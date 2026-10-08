from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum, Count, F
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.clubs.permissions import IsClubStaff
from apps.clubs.models import GameTable, TableStatus, Zone
from apps.sessions_app.models import Session, SessionStatus, SessionOrderItem
from apps.products.models import BarSale, BarSaleItem, Product

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubStaff]

    def get(self, request):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')
        if not club_id:
            return Response({"detail": "X-Club-Id talab qilinadi."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_week = start_of_today - timedelta(days=now.weekday())
        start_of_month = start_of_today.replace(day=1)

        # Completed sessions
        completed_sessions = Session.objects.filter(club_id=club_id, status=SessionStatus.COMPLETED)
        today_sessions = completed_sessions.filter(start_time__gte=start_of_today)
        week_sessions = completed_sessions.filter(start_time__gte=start_of_week)
        month_sessions = completed_sessions.filter(start_time__gte=start_of_month)

        # Direct bar sales
        bar_sales = BarSale.objects.filter(club_id=club_id)
        today_bar_sales = bar_sales.filter(created_at__gte=start_of_today)
        week_bar_sales = bar_sales.filter(created_at__gte=start_of_week)
        month_bar_sales = bar_sales.filter(created_at__gte=start_of_month)

        # Calculations
        today_time = today_sessions.aggregate(total=Sum('time_amount'))['total'] or Decimal(0)
        today_session_bar = today_sessions.aggregate(total=Sum('bar_amount'))['total'] or Decimal(0)
        today_direct_bar = today_bar_sales.aggregate(total=Sum('final_amount'))['total'] or Decimal(0)
        today_total_bar = today_session_bar + today_direct_bar
        today_total_revenue = today_time + today_total_bar

        week_time = week_sessions.aggregate(total=Sum('time_amount'))['total'] or Decimal(0)
        week_bar = (week_sessions.aggregate(total=Sum('bar_amount'))['total'] or Decimal(0)) + (week_bar_sales.aggregate(total=Sum('final_amount'))['total'] or Decimal(0))
        week_total_revenue = week_time + week_bar

        month_time = month_sessions.aggregate(total=Sum('time_amount'))['total'] or Decimal(0)
        month_bar = (month_sessions.aggregate(total=Sum('bar_amount'))['total'] or Decimal(0)) + (month_bar_sales.aggregate(total=Sum('final_amount'))['total'] or Decimal(0))
        month_total_revenue = month_time + month_bar

        # Table counts
        total_tables = GameTable.objects.filter(club_id=club_id, is_active=True).count()
        occupied_tables = GameTable.objects.filter(club_id=club_id, status=TableStatus.OCCUPIED, is_active=True).count()
        idle_tables = GameTable.objects.filter(club_id=club_id, status=TableStatus.IDLE, is_active=True).count()

        # Zone stats
        zone_stats = (
            completed_sessions.filter(start_time__gte=start_of_month)
            .values('table__zone__name', 'table__zone__color_code')
            .annotate(revenue=Sum('total_amount'), sessions_count=Count('id'))
            .order_by('-revenue')
        )

        return Response({
            "overview": {
                "today_revenue": float(today_total_revenue),
                "today_time_amount": float(today_time),
                "today_bar_amount": float(today_total_bar),
                "today_sessions_count": today_sessions.count(),
                "week_revenue": float(week_total_revenue),
                "month_revenue": float(month_total_revenue),
            },
            "tables_summary": {
                "total": total_tables,
                "occupied": occupied_tables,
                "idle": idle_tables,
                "occupancy_rate": round((occupied_tables / total_tables * 100) if total_tables > 0 else 0, 1)
            },
            "zone_breakdown": list(zone_stats)
        })

class RevenueTrendsView(APIView):
    """
    7 yoki 30 kunlik dinamika grafigi (O'yin vaqti vs Bar daromadi)
    """
    permission_classes = [permissions.IsAuthenticated, IsClubStaff]

    def get(self, request):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')
        days = int(request.query_params.get('days', 7))

        now = timezone.now()
        start_date = (now - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

        result = []
        for i in range(days):
            current_day = start_date + timedelta(days=i)
            next_day = current_day + timedelta(days=1)
            day_label = current_day.strftime('%d-%b')

            # Sessions on this day
            day_sessions = Session.objects.filter(
                club_id=club_id,
                status=SessionStatus.COMPLETED,
                start_time__gte=current_day,
                start_time__lt=next_day
            )
            time_amt = float(day_sessions.aggregate(total=Sum('time_amount'))['total'] or 0)
            session_bar = float(day_sessions.aggregate(total=Sum('bar_amount'))['total'] or 0)

            # Direct bar sales on this day
            direct_bar = float(
                BarSale.objects.filter(
                    club_id=club_id,
                    created_at__gte=current_day,
                    created_at__lt=next_day
                ).aggregate(total=Sum('final_amount'))['total'] or 0
            )

            total_bar = session_bar + direct_bar
            result.append({
                "date": day_label,
                "time_revenue": time_amt,
                "bar_revenue": total_bar,
                "total_revenue": time_amt + total_bar
            })

        return Response(result)

class PeakHoursView(APIView):
    """
    Klubning 24 soatlik yuklama grafigi (Soatbay gavjumlik tahlili)
    """
    permission_classes = [permissions.IsAuthenticated, IsClubStaff]

    def get(self, request):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')
        # Analyze last 30 days
        since = timezone.now() - timedelta(days=30)
        sessions = Session.objects.filter(club_id=club_id, start_time__gte=since)

        hourly_counts = {hour: 0 for hour in range(24)}
        for s in sessions:
            hour = s.start_time.hour
            hourly_counts[hour] += 1

        total_sessions = max(1, len(sessions))
        result = []
        for hour in range(24):
            count = hourly_counts[hour]
            result.append({
                "hour": f"{hour:02d}:00",
                "sessions_count": count,
                "load_percentage": round((count / total_sessions) * 100, 1)
            })

        return Response(result)

class TopProductsView(APIView):
    """
    Eng ko'p sotilgan bar mahsulotlari va sof marjasi
    """
    permission_classes = [permissions.IsAuthenticated, IsClubStaff]

    def get(self, request):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')

        # Aggregate from both SessionOrderItem and BarSaleItem
        products = Product.objects.filter(club_id=club_id)
        result = []

        for p in products:
            # Session orders
            so_qty = SessionOrderItem.objects.filter(product=p).aggregate(total=Sum('quantity'))['total'] or 0
            # Direct sales
            bs_qty = BarSaleItem.objects.filter(product=p).aggregate(total=Sum('quantity'))['total'] or 0
            total_sold = so_qty + bs_qty

            if total_sold > 0:
                revenue = float(p.selling_price * total_sold)
                cost = float(p.cost_price * total_sold)
                profit = revenue - cost
                margin = round((profit / revenue * 100) if revenue > 0 else 0, 1)

                result.append({
                    "id": str(p.id),
                    "name": p.name,
                    "category": p.category.name if p.category else "Boshqa",
                    "total_sold": total_sold,
                    "revenue": revenue,
                    "cost": cost,
                    "profit": profit,
                    "margin_percent": margin,
                    "stock_quantity": p.stock_quantity
                })

        result.sort(key=lambda x: x['revenue'], reverse=True)
        return Response(result[:10])

class PaymentMethodsBreakdownView(APIView):
    """
    To'lov turlari bo'yicha taqsimot (Naqd, Karta, Click/Payme, Nasiya)
    """
    permission_classes = [permissions.IsAuthenticated, IsClubStaff]

    def get(self, request):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')
        since = timezone.now() - timedelta(days=30)

        # Completed sessions
        sessions = Session.objects.filter(club_id=club_id, status=SessionStatus.COMPLETED, start_time__gte=since)
        # Direct bar sales
        bar_sales = BarSale.objects.filter(club_id=club_id, created_at__gte=since)

        breakdown = {
            "CASH": {"label": "Naqd pul", "amount": 0, "color": "#10b981"},
            "CARD": {"label": "Plastik Karta (Humo/Uzcard)", "amount": 0, "color": "#3b82f6"},
            "TRANSFER": {"label": "Click / Payme", "amount": 0, "color": "#f59e0b"},
            "DEBT": {"label": "Nasiya / Qarz", "amount": 0, "color": "#ef4444"},
        }

        for s in sessions:
            pt = s.payment_type or 'CASH'
            if pt in breakdown:
                breakdown[pt]["amount"] += float(s.total_amount)

        for b in bar_sales:
            pt = b.payment_type or 'CASH'
            if pt in breakdown:
                breakdown[pt]["amount"] += float(b.final_amount)

        total_amount = sum(v["amount"] for v in breakdown.values()) or 1.0

        result = []
        for key, val in breakdown.items():
            result.append({
                "key": key,
                "label": val["label"],
                "amount": val["amount"],
                "color": val["color"],
                "percentage": round((val["amount"] / total_amount) * 100, 1)
            })

        return Response(result)
