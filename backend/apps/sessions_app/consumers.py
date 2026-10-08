import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from apps.clubs.models import GameTable
from apps.sessions_app.models import Session, SessionStatus
from apps.sessions_app.serializers import SessionSerializer

logger = logging.getLogger(__name__)

class ClubLiveConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer that streams real-time table status and active sessions
    to all connected operators for a specific club.
    """

    async def connect(self):
        self.club_id = self.scope['url_route']['kwargs'].get('club_id')
        if not self.club_id:
            await self.close()
            return

        self.group_name = f"club_{self.club_id}"

        # Join club channel group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial snapshot of live tables
        tables_data = await self.get_live_tables_data(self.club_id)
        await self.send_json({
            "type": "initial_state",
            "tables": tables_data
        })
        logger.info(f"WebSocket client connected to {self.group_name}")

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            logger.info(f"WebSocket client disconnected from {self.group_name}")

    async def receive_json(self, content):
        """
        Handle incoming messages from clients (e.g. ping/heartbeat or request snapshot)
        """
        msg_type = content.get('type')
        if msg_type == 'ping':
            await self.send_json({"type": "pong"})
        elif msg_type == 'request_refresh':
            tables_data = await self.get_live_tables_data(self.club_id)
            await self.send_json({
                "type": "tables_update",
                "tables": tables_data
            })

    async def tables_update(self, event):
        """
        Handler for group_send 'tables_update' event
        """
        await self.send_json({
            "type": "tables_update",
            "tables": event["tables"],
            "event_action": event.get("action", "update")
        })

    @database_sync_to_async
    def get_live_tables_data(self, club_id):
        tables = GameTable.objects.filter(club_id=club_id, is_active=True).select_related('zone').prefetch_related('sessions')
        result = []
        for table in tables:
            active_session = table.sessions.filter(status=SessionStatus.ACTIVE).first()
            result.append({
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
        return result
