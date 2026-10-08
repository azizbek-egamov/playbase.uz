from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema

from .models import SubscriptionPlan, Club, ClubMember, ClubMemberRole, Zone, GameTable, TableStatus
from .serializers import (
    SubscriptionPlanSerializer, ClubSerializer, ClubCreateSerializer,
    ClubMemberSerializer, ZoneSerializer, GameTableSerializer
)
from .permissions import IsClubOwner, IsClubStaff, HasActiveSubscription

# Tarif bo'lmagan klublarga berilgan standart limit
DEFAULT_MAX_TABLES = 10
DEFAULT_MAX_STAFF = 3

class SubscriptionPlanListView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: SubscriptionPlanSerializer(many=True)})
    def get(self, request):
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by('price_per_month')
        return Response(SubscriptionPlanSerializer(plans, many=True).data)

class ClubViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, HasActiveSubscription]

    def get_serializer_class(self):
        if self.action == 'create':
            return ClubCreateSerializer
        return ClubSerializer

    def get_queryset(self):
        user = self.request.user
        return Club.objects.filter(
            Q(owner=user) | Q(members__user=user, members__is_active=True)
        ).distinct()

    def perform_create(self, serializer):
        with transaction.atomic():
            club = serializer.save(owner=self.request.user)
            # Give 7 days trial by default
            club.set_trial_period(days=7)
            # Add owner as ClubMember
            ClubMember.objects.create(
                club=club,
                user=self.request.user,
                role=ClubMemberRole.OWNER,
                is_active=True
            )
            # Create default zone & sample tables
            standard_zone = Zone.objects.create(
                club=club,
                name="Standart Zona",
                hourly_rate=25000,
                color_code="#10b981",
                icon="sports_esports",
                order=1
            )
            vip_zone = Zone.objects.create(
                club=club,
                name="VIP Lounge",
                hourly_rate=45000,
                color_code="#f59e0b",
                icon="workspace_premium",
                order=2
            )
            # Create sample tables
            for i in range(1, 6):
                GameTable.objects.create(
                    club=club,
                    zone=standard_zone,
                    name=f"Stol #{i}",
                    number=i,
                    status=TableStatus.IDLE,
                    order=i
                )
            for i in range(1, 3):
                GameTable.objects.create(
                    club=club,
                    zone=vip_zone,
                    name=f"VIP #{i}",
                    number=10 + i,
                    status=TableStatus.IDLE,
                    order=10 + i
                )

class ZoneViewSet(viewsets.ModelViewSet):
    serializer_class = ZoneSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    def get_queryset(self):
        club_id = self.request.headers.get('X-Club-Id') or self.request.query_params.get('club_id')
        if not club_id:
            return Zone.objects.none()
        return Zone.objects.filter(club_id=club_id)

    def perform_create(self, serializer):
        club_id = self.request.headers.get('X-Club-Id') or self.request.data.get('club')
        club = get_object_or_404(Club, id=club_id)
        serializer.save(club=club)

class GameTableViewSet(viewsets.ModelViewSet):
    serializer_class = GameTableSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    def get_queryset(self):
        club_id = self.request.headers.get('X-Club-Id') or self.request.query_params.get('club_id')
        if not club_id:
            return GameTable.objects.none()
        queryset = GameTable.objects.filter(club_id=club_id)
        zone_id = self.request.query_params.get('zone_id')
        status_param = self.request.query_params.get('status')
        if zone_id:
            queryset = queryset.filter(zone_id=zone_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def perform_create(self, serializer):
        club_id = self.request.headers.get('X-Club-Id') or self.request.data.get('club')
        club = get_object_or_404(Club, id=club_id)
        
        # Check max tables limit — tarif va trial bo'yicha dinamik limit
        max_allowed = club.max_allowed_tables
        current_count = club.tables.filter(is_active=True).count()
        if current_count >= max_allowed:
            raise serializers.ValidationError(
                f"Tarifdagi maksimal stollar soniga ({max_allowed} ta) yetildi. "
                f"Ko'proq stol qo'shish uchun tarifni oshiring."
            )
        
        serializer.save(club=club)

    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create_tables(self, request):
        club_id = request.headers.get('X-Club-Id') or request.data.get('club_id')
        zone_id = request.data.get('zone_id')
        prefix = request.data.get('prefix', 'Stol')
        start_number = int(request.data.get('start_number', 1))
        count = int(request.data.get('count', 5))

        # count manfiy yoki nol bo'lmasligi kerak
        if count <= 0 or count > 50:
            return Response({"detail": "Bir vaqtda 1-50 ta stol yaratish mumkin."}, status=status.HTTP_400_BAD_REQUEST)

        club = get_object_or_404(Club, id=club_id)
        zone = get_object_or_404(Zone, id=zone_id, club=club)

        # Tarif limitini tekshirish — agar mavjud + yangi soni limitdan oshsa, rad etiladi
        max_allowed = club.max_allowed_tables
        current_count = club.tables.filter(is_active=True).count()
        available_slots = max_allowed - current_count

        if available_slots <= 0:
            return Response(
                {"detail": f"Tarifingizdagi maksimal stollar soniga ({max_allowed} ta) yetilgan. Yangi stol qo'shish uchun tarifni oshiring."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if count > available_slots:
            return Response(
                {
                    "detail": (
                        f"Tarifingizda maksimal {max_allowed} ta stol ruxsat etilgan. "
                        f"Hozirda {current_count} ta mavjud. Siz {count} ta qo'shmoqchisiz (jami {current_count + count} ta bo'ladi). "
                        f"Siz ko'pi bilan {available_slots} ta stol yarata olasiz. Tarifni oshiring."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        created_tables = []
        with transaction.atomic():
            for i in range(count):
                num = start_number + i
                table, _ = GameTable.objects.get_or_create(
                    club=club,
                    number=num,
                    defaults={
                        'zone': zone,
                        'name': f"{prefix} #{num}",
                        'status': TableStatus.IDLE,
                        'order': num
                    }
                )
                created_tables.append(table)
        
        response_data = GameTableSerializer(created_tables, many=True).data
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='toggle-maintenance')
    def toggle_maintenance(self, request, pk=None):
        table = self.get_object()
        max_allowed = table.club.max_allowed_tables
        allowed_ids = set(
            table.club.tables.filter(is_active=True)
            .order_by('order', 'number', 'created_at')
            .values_list('id', flat=True)[:max_allowed]
        )
        if table.id not in allowed_ids:
            return Response(
                {"detail": f"Ushbu stol tarifingizdagi maksimal stollar limitidan ({max_allowed} ta) oshganligi sababli bloklangan."},
                status=status.HTTP_403_FORBIDDEN
            )

        if table.status == TableStatus.OCCUPIED:
            return Response({"detail": "Band stolni servisga o'tkazib bo'lmaydi. Avval sessiyani yoping."}, status=status.HTTP_400_BAD_REQUEST)
        
        table.status = TableStatus.MAINTENANCE if table.status == TableStatus.IDLE else TableStatus.IDLE
        table.save(update_fields=['status'])
        return Response(GameTableSerializer(table).data)

class ClubMemberViewSet(viewsets.ModelViewSet):
    serializer_class = ClubMemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubOwner, HasActiveSubscription]

    def get_queryset(self):
        club_id = self.request.headers.get('X-Club-Id') or self.request.query_params.get('club_id')
        if not club_id:
            return ClubMember.objects.none()
        return ClubMember.objects.filter(club_id=club_id)

    def perform_create(self, serializer):
        club_id = self.request.headers.get('X-Club-Id') or self.request.data.get('club')
        club = get_object_or_404(Club, id=club_id)

        # max_staff limitini tekshirish
        max_allowed = club.active_plan.max_staff if club.active_plan else DEFAULT_MAX_STAFF
        current_staff = club.members.filter(is_active=True).exclude(role=ClubMemberRole.OWNER).count()
        if current_staff >= max_allowed:
            raise serializers.ValidationError(
                f"Tarifdagi maksimal xodimlar soniga ({max_allowed} ta) yetildi. "
                f"Ko'proq xodim qo'shish uchun tarifni oshiring."
            )
        serializer.save(club=club)
