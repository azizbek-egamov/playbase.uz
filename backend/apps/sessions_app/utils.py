import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.clubs.models import GameTable
from apps.sessions_app.models import Session, SessionStatus
from apps.sessions_app.serializers import SessionSerializer

logger = logging.getLogger(__name__)

def broadcast_club_tables(club_id, action="update"):
    """
    Broadcasts the latest live tables snapshot to all connected WebSocket clients in the club group.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        tables = GameTable.objects.filter(club_id=club_id, is_active=True).select_related('zone').prefetch_related('sessions')
        tables_data = []
        for table in tables:
            active_session = table.sessions.filter(status=SessionStatus.ACTIVE).first()
            tables_data.append({
                "id": str(table.id),
                "name": table.name,
                "number": table.number,
                "status": table.status,
                "zone_id": str(table.zone.id),
                "zone_name": table.zone.name,
                "zone_color": table.zone.color_code,
                "zone_icon": table.zone.icon,
                "hourly_rate": float(table.zone.hourly_rate),
                "active_session": SessionSerializer(active_session).data if active_session else None
            })

        group_name = f"club_{club_id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "tables_update",
                "tables": tables_data,
                "action": action
            }
        )
    except Exception as e:
        logger.error(f"Failed to broadcast websocket tables update for club {club_id}: {e}")
