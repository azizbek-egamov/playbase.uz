from datetime import timedelta
from decimal import Decimal
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.clubs.models import Club, GameTable, TableStatus
from apps.clubs.permissions import IsClubStaff, HasActiveSubscription
from apps.products.models import Product
from .models import Session, SessionOrderItem, SessionTransferHistory, SessionStatus, PaymentType
from .serializers import (
    SessionSerializer, SessionStartSerializer, SessionStopSerializer,
    SessionExtendSerializer, SessionTransferSerializer, SessionOrderItemSerializer,
    SessionOrderItemCreateSerializer
)
from .utils import broadcast_club_tables

class LiveTablesStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubStaff]

    @extend_schema(description="Get live real-time status of all tables in the club for live dashboard")
    def get(self, request):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')
        if not club_id:
            return Response({"detail": "X-Club-Id headeri talab qilinadi."}, status=status.HTTP_400_BAD_REQUEST)

        club = get_object_or_404(Club, id=club_id)
        max_allowed = club.max_allowed_tables

        tables = list(
            GameTable.objects.filter(club_id=club_id, is_active=True)
            .select_related('zone')
            .prefetch_related('sessions')
            .order_by('order', 'number', 'created_at')
        )
        
        allowed_ids = set(t.id for t in tables[:max_allowed])

        result = []
        for table in tables:
            active_session = table.sessions.filter(status=SessionStatus.ACTIVE).first()
            is_locked = table.id not in allowed_ids
            table_data = {
                "id": str(table.id),
                "name": table.name,
                "number": table.number,
                "status": table.status,
                "is_plan_locked": is_locked,
                "lock_reason": f"Tarif limiti ({max_allowed} ta) oshganligi sababli bloklangan" if is_locked else None,
                "zone_id": str(table.zone.id),
                "zone_name": table.zone.name,
                "zone_color": table.zone.color_code,
                "zone_icon": table.zone.icon,
                "hourly_rate": float(table.zone.hourly_rate),
                "active_session": SessionSerializer(active_session).data if active_session else None
            }
            result.append(table_data)

        return Response({
            "tables": result,
            "max_allowed_tables": max_allowed,
            "total_tables_count": len(tables),
            "locked_tables_count": max(0, len(tables) - max_allowed),
            "server_time": timezone.now().isoformat()
        })

class SessionStartView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    @extend_schema(request=SessionStartSerializer, responses={201: SessionSerializer})
    def post(self, request):
        serializer = SessionStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            table = get_object_or_404(GameTable.objects.select_for_update(), id=data['table_id'])
            
            # Check if table exceeds plan limit
            club = table.club
            max_allowed = club.max_allowed_tables
            allowed_ids = set(
                club.tables.filter(is_active=True)
                .order_by('order', 'number', 'created_at')
                .values_list('id', flat=True)[:max_allowed]
            )
            if table.id not in allowed_ids:
                return Response(
                    {"detail": f"Ushbu stol ({table.name}) tarifingizdagi maksimal stollar limitidan ({max_allowed} ta) oshib ketganligi sababli bloklangan. Seans ochish uchun tarifni oshiring."},
                    status=status.HTTP_403_FORBIDDEN
                )

            if table.status == TableStatus.OCCUPIED:
                return Response({"detail": "Ushbu stol allaqachon band."}, status=status.HTTP_400_BAD_REQUEST)
            if table.status == TableStatus.MAINTENANCE:
                return Response({"detail": "Ushbu stol texnik xizmatda."}, status=status.HTTP_400_BAD_REQUEST)

            now = timezone.now()
            planned_end = None
            if not data.get('is_open_ended') and data.get('duration_minutes'):
                planned_end = now + timedelta(minutes=data['duration_minutes'])

            session = Session.objects.create(
                table=table,
                club=table.club,
                started_by=request.user,
                customer_name=data.get('customer_name', ''),
                customer_phone=data.get('customer_phone', ''),
                start_time=now,
                planned_end_time=planned_end,
                is_open_ended=data.get('is_open_ended', True),
                duration_minutes=data.get('duration_minutes'),
                applied_hourly_rate=table.zone.hourly_rate,
                status=SessionStatus.ACTIVE
            )

            # Add initial orders if any
            initial_orders = data.get('initial_orders', [])
            bar_total = Decimal(0)
            for order_item in initial_orders:
                product = get_object_or_404(Product, id=order_item['product_id'], club=table.club)
                qty = order_item['quantity']
                item_total = product.selling_price * qty
                SessionOrderItem.objects.create(
                    session=session,
                    product=product,
                    quantity=qty,
                    unit_price=product.selling_price,
                    total_price=item_total,
                    added_by=request.user
                )
                bar_total += item_total
                if product.stock_quantity > 0:
                    product.stock_quantity = max(0, product.stock_quantity - qty)
                    product.save(update_fields=['stock_quantity'])

            session.bar_amount = bar_total
            session.save(update_fields=['bar_amount'])

            table.status = TableStatus.OCCUPIED
            table.save(update_fields=['status'])

        broadcast_club_tables(table.club_id, action="session_started")
        return Response(SessionSerializer(session).data, status=status.HTTP_201_CREATED)

class SessionStopView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    @extend_schema(request=SessionStopSerializer, responses={200: SessionSerializer})
    def post(self, request, pk):
        session = get_object_or_404(Session, id=pk, status=SessionStatus.ACTIVE)
        serializer = SessionStopSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            now = timezone.now()
            session.end_time = now
            time_amount = session.calculate_current_time_amount(current_time=now)
            session.time_amount = Decimal(str(time_amount))
            
            discount = data.get('discount_amount', Decimal(0))
            session.discount_amount = discount
            
            bar_total = sum(item.total_price for item in session.orders.all())
            session.bar_amount = bar_total
            
            session.total_amount = max(Decimal(0), session.time_amount + session.bar_amount - discount)
            session.payment_type = data.get('payment_type', PaymentType.CASH)
            session.note = data.get('note', '')
            session.closed_by = request.user
            session.status = SessionStatus.COMPLETED
            session.save()

            # Free the table
            session.table.status = TableStatus.IDLE
            session.table.save(update_fields=['status'])

        # Thermal chek apparat funksiyasi vaqtincha commentga olingan
        # try:
        #     from apps.printers.services import create_session_print_job
        #     create_session_print_job(session, cashier_name=request.user.get_full_name() or request.user.username)
        # except Exception:
        #     pass

        broadcast_club_tables(session.club_id, action="session_stopped")
        return Response(SessionSerializer(session).data, status=status.HTTP_200_OK)

class SessionExtendView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    @extend_schema(request=SessionExtendSerializer, responses={200: SessionSerializer})
    def post(self, request, pk):
        session = get_object_or_404(Session, id=pk, status=SessionStatus.ACTIVE)
        serializer = SessionExtendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        extra_minutes = serializer.validated_data['additional_minutes']

        if session.is_open_ended:
            session.is_open_ended = False
            session.planned_end_time = timezone.now() + timedelta(minutes=extra_minutes)
            session.duration_minutes = extra_minutes
        else:
            base_time = session.planned_end_time or timezone.now()
            session.planned_end_time = base_time + timedelta(minutes=extra_minutes)
            session.duration_minutes = (session.duration_minutes or 0) + extra_minutes

        session.save(update_fields=['is_open_ended', 'planned_end_time', 'duration_minutes'])
        broadcast_club_tables(session.club_id, action="session_extended")
        return Response(SessionSerializer(session).data)

class SessionTransferView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    @extend_schema(request=SessionTransferSerializer, responses={200: SessionSerializer})
    def post(self, request, pk):
        session = get_object_or_404(Session, id=pk, status=SessionStatus.ACTIVE)
        serializer = SessionTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_table_id = serializer.validated_data['target_table_id']

        with transaction.atomic():
            target_table = get_object_or_404(GameTable.objects.select_for_update(), id=target_table_id, club=session.club)
            
            # Check plan limit for target table
            club = session.club
            max_allowed = club.max_allowed_tables
            allowed_ids = set(
                club.tables.filter(is_active=True)
                .order_by('order', 'number', 'created_at')
                .values_list('id', flat=True)[:max_allowed]
            )
            if target_table.id not in allowed_ids:
                return Response(
                    {"detail": f"Ko'chirilayotgan stol ({target_table.name}) tarif limiti ({max_allowed} ta) oshganligi sababli bloklangan. Seansni o'tkazib bo'lmaydi."},
                    status=status.HTTP_403_FORBIDDEN
                )

            if target_table.status != TableStatus.IDLE:
                return Response({"detail": "Maqsadli stol bo'sh emas."}, status=status.HTTP_400_BAD_REQUEST)

            old_table = session.table
            old_rate = session.applied_hourly_rate
            
            # Log transfer history
            SessionTransferHistory.objects.create(
                session=session,
                from_table=old_table,
                to_table=target_table,
                transferred_by=request.user
            )

            # Transfer vaqtida yangi narxga o'tish
            # Muhim: Transfer oldidan hisoblangan vaqt eski narxda, keyingisi yangi narxda hisoblangani uchun
            # applied_hourly_rate ni yangilaymiz — session.calculate_current_time_amount() ni e'tiborga olamiz
            session.table = target_table
            session.applied_hourly_rate = target_table.zone.hourly_rate
            session.save(update_fields=['table', 'applied_hourly_rate'])

            old_table.status = TableStatus.IDLE
            old_table.save(update_fields=['status'])

            target_table.status = TableStatus.OCCUPIED
            target_table.save(update_fields=['status'])

        broadcast_club_tables(session.club_id, action="session_transferred")
        return Response(SessionSerializer(session).data)

class SessionOrderAddView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    @extend_schema(request=SessionOrderItemCreateSerializer, responses={201: SessionOrderItemSerializer})
    def post(self, request, pk):
        session = get_object_or_404(Session, id=pk, status=SessionStatus.ACTIVE)
        serializer = SessionOrderItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        product = get_object_or_404(Product, id=serializer.validated_data['product_id'], club=session.club)
        qty = serializer.validated_data['quantity']
        
        with transaction.atomic():
            order_item = SessionOrderItem.objects.create(
                session=session,
                product=product,
                quantity=qty,
                unit_price=product.selling_price,
                total_price=product.selling_price * qty,
                added_by=request.user
            )
            # Update session bar amount
            bar_total = sum(item.total_price for item in session.orders.all())
            session.bar_amount = bar_total
            session.save(update_fields=['bar_amount'])

            if product.stock_quantity > 0:
                product.stock_quantity = max(0, product.stock_quantity - qty)
                product.save(update_fields=['stock_quantity'])

        broadcast_club_tables(session.club_id, action="order_added")
        return Response(SessionOrderItemSerializer(order_item).data, status=status.HTTP_201_CREATED)

class SessionOrderRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    def delete(self, request, pk, order_id):
        session = get_object_or_404(Session, id=pk, status=SessionStatus.ACTIVE)
        order_item = get_object_or_404(SessionOrderItem, id=order_id, session=session)
        
        with transaction.atomic():
            product = order_item.product
            qty = order_item.quantity
            order_item.delete()

            # Recalculate bar total
            bar_total = sum(item.total_price for item in session.orders.all())
            session.bar_amount = bar_total
            session.save(update_fields=['bar_amount'])

            # Return stock
            product.stock_quantity += qty
            product.save(update_fields=['stock_quantity'])

        broadcast_club_tables(session.club_id, action="order_removed")
        return Response(status=status.HTTP_204_NO_CONTENT)

class SessionHistoryListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubStaff]

    @extend_schema(responses={200: SessionSerializer(many=True)})
    def get(self, request):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')
        if not club_id:
            return Response({"detail": "X-Club-Id talab qilinadi."}, status=status.HTTP_400_BAD_REQUEST)

        sessions = Session.objects.filter(club_id=club_id).select_related('table', 'table__zone', 'started_by', 'closed_by').prefetch_related('orders', 'orders__product').order_by('-created_at')
        
        # Filters
        status_param = request.query_params.get('status')
        if status_param:
            sessions = sessions.filter(status=status_param)
        
        table_id = request.query_params.get('table_id')
        if table_id:
            sessions = sessions.filter(table_id=table_id)

        # Pagination — hard-coded limit o'rniga parametrli
        try:
            page_size = min(int(request.query_params.get('page_size', 50)), 200)
            page = max(int(request.query_params.get('page', 1)), 1)
        except (ValueError, TypeError):
            page_size = 50
            page = 1
        
        offset = (page - 1) * page_size
        total_count = sessions.count()
        paginated_sessions = sessions[offset:offset + page_size]

        return Response({
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size,
            "results": SessionSerializer(paginated_sessions, many=True).data
        })
