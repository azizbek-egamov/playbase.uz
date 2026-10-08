from datetime import timedelta
from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import views, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from apps.accounts.models import User
from apps.clubs.models import Club, SubscriptionPlan, GameTable
from apps.billing.models import SaaSTransaction, TransactionStatus, TransactionProvider
from apps.sessions_app.models import Session, SessionStatus
from .permissions import IsSuperAdminUser
from .serializers import (
    AdminLoginSerializer, AdminChangePasswordSerializer, SuperAdminUserSerializer,
    SuperAdminClubSerializer, SuperAdminExtendSubscriptionSerializer,
    SuperAdminPlanSerializer, SuperAdminTransactionSerializer, BroadcastMessageSerializer
)
from django.conf import settings

class AdminLoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=AdminLoginSerializer, responses={200: dict})
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": SuperAdminUserSerializer(user).data
        }, status=status.HTTP_200_OK)

class AdminChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]

    @extend_schema(request=AdminChangePasswordSerializer, responses={200: dict})
    def post(self, request):
        serializer = AdminChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {"old_password": ["Hozirgi parol noto'g'ri kiritildi."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Generate new tokens after password change
        refresh = RefreshToken.for_user(user)
        return Response({
            "detail": "Parol muvaffaqiyatli o'zgartirildi.",
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }, status=status.HTTP_200_OK)

class AdminMeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]

    @extend_schema(responses={200: SuperAdminUserSerializer})
    def get(self, request):
        return Response(SuperAdminUserSerializer(request.user).data)

class SuperAdminOverviewView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        # Clubs stats
        total_clubs = Club.objects.count()
        active_subscribed_clubs = Club.objects.filter(is_active=True, plan_expires_at__gt=now, is_trial=False).count()
        trial_clubs = Club.objects.filter(is_active=True, plan_expires_at__gt=now, is_trial=True).count()
        expired_clubs = Club.objects.filter(Q(plan_expires_at__lte=now) | Q(plan_expires_at__isnull=True)).count()
        blocked_clubs = Club.objects.filter(is_active=False).count()

        # Tables & Users stats
        total_tables = GameTable.objects.count()
        total_users = User.objects.count()
        active_sessions_count = Session.objects.filter(status=SessionStatus.ACTIVE).count()

        # Revenue stats (SaaS Billings)
        total_revenue = SaaSTransaction.objects.filter(status=TransactionStatus.SUCCESS).aggregate(total=Sum('amount'))['total'] or 0
        mrr_revenue = SaaSTransaction.objects.filter(
            status=TransactionStatus.SUCCESS,
            created_at__gte=thirty_days_ago
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Provider breakdown
        payme_revenue = SaaSTransaction.objects.filter(status=TransactionStatus.SUCCESS, provider=TransactionProvider.PAYME).aggregate(total=Sum('amount'))['total'] or 0
        click_revenue = SaaSTransaction.objects.filter(status=TransactionStatus.SUCCESS, provider=TransactionProvider.CLICK).aggregate(total=Sum('amount'))['total'] or 0

        # Recent 7 days club registrations
        daily_registrations = []
        for i in range(6, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            count = Club.objects.filter(created_at__gte=day_start, created_at__lt=day_end).count()
            daily_registrations.append({
                "date": day_start.strftime("%d-%b"),
                "count": count
            })

        # Recent transactions
        recent_txs = SaaSTransaction.objects.all().order_by('-created_at')[:8]

        return Response({
            "total_clubs": total_clubs,
            "active_subscribed_clubs": active_subscribed_clubs,
            "trial_clubs": trial_clubs,
            "expired_clubs": expired_clubs,
            "blocked_clubs": blocked_clubs,
            "total_tables": total_tables,
            "total_users": total_users,
            "active_sessions_count": active_sessions_count,
            "total_revenue": float(total_revenue),
            "mrr_revenue": float(mrr_revenue),
            "payme_revenue": float(payme_revenue),
            "click_revenue": float(click_revenue),
            "daily_registrations": daily_registrations,
            "recent_transactions": SuperAdminTransactionSerializer(recent_txs, many=True).data
        })

class SuperAdminClubViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]
    serializer_class = SuperAdminClubSerializer
    queryset = Club.objects.all().order_by('-created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        now = timezone.now()

        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(owner__username__icontains=search) |
                Q(owner__first_name__icontains=search) |
                Q(owner__phone_number__icontains=search) |
                Q(phone__icontains=search) |
                Q(address__icontains=search)
            )

        if status_filter == 'ACTIVE':
            qs = qs.filter(is_active=True, plan_expires_at__gt=now, is_trial=False)
        elif status_filter == 'TRIAL':
            qs = qs.filter(is_active=True, plan_expires_at__gt=now, is_trial=True)
        elif status_filter == 'EXPIRED':
            qs = qs.filter(Q(plan_expires_at__lte=now) | Q(plan_expires_at__isnull=True))
        elif status_filter == 'BLOCKED':
            qs = qs.filter(is_active=False)

        return qs

    @action(detail=True, methods=['post'], url_path='extend-subscription')
    def extend_subscription(self, request, pk=None):
        club = self.get_object()
        serializer = SuperAdminExtendSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        days = serializer.validated_data.get('days', 30)
        plan_id = serializer.validated_data.get('plan_id')
        is_trial = serializer.validated_data.get('is_trial', False)

        now = timezone.now()
        base_date = club.plan_expires_at if (club.plan_expires_at and club.plan_expires_at > now) else now
        club.plan_expires_at = base_date + timedelta(days=days)
        club.is_trial = is_trial
        club.is_active = True

        if plan_id:
            plan = get_object_or_404(SubscriptionPlan, id=plan_id)
            club.active_plan = plan

        club.save()
        return Response(SuperAdminClubSerializer(club).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        club = self.get_object()
        club.is_active = not club.is_active
        club.save(update_fields=['is_active'])
        return Response(SuperAdminClubSerializer(club).data, status=status.HTTP_200_OK)

class SuperAdminPlanViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]
    serializer_class = SuperAdminPlanSerializer
    queryset = SubscriptionPlan.objects.all().order_by('price_per_month')

class SuperAdminTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]
    serializer_class = SuperAdminTransactionSerializer
    queryset = SaaSTransaction.objects.all().order_by('-created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        provider = self.request.query_params.get('provider')
        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if provider:
            qs = qs.filter(provider=provider)
        if status_param:
            qs = qs.filter(status=status_param)
        if search:
            qs = qs.filter(
                Q(club__name__icontains=search) |
                Q(external_id__icontains=search) |
                Q(club__owner__username__icontains=search)
            )
        return qs

class SuperAdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]
    serializer_class = SuperAdminUserSerializer
    queryset = User.objects.all().order_by('-created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')

        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(telegram_id__icontains=search)
            )
        if role == 'OWNER':
            qs = qs.filter(is_owner=True)
        elif role == 'STAFF':
            qs = qs.filter(is_staff=True)
        return qs

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response(SuperAdminUserSerializer(user).data, status=status.HTTP_200_OK)

class SuperAdminBroadcastView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminUser]

    @extend_schema(request=BroadcastMessageSerializer)
    def post(self, request):
        serializer = BroadcastMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target = serializer.validated_data['target']
        message_text = serializer.validated_data['message']
        parse_mode = serializer.validated_data['parse_mode']

        now = timezone.now()
        clubs_qs = Club.objects.filter(owner__telegram_id__isnull=False)

        if target == 'ACTIVE':
            clubs_qs = clubs_qs.filter(is_active=True, plan_expires_at__gt=now, is_trial=False)
        elif target == 'TRIAL':
            clubs_qs = clubs_qs.filter(is_active=True, plan_expires_at__gt=now, is_trial=True)
        elif target == 'EXPIRED':
            clubs_qs = clubs_qs.filter(Q(plan_expires_at__lte=now) | Q(plan_expires_at__isnull=True))

        telegram_ids = list(clubs_qs.values_list('owner__telegram_id', flat=True).distinct())

        bot_token = settings.TELEGRAM_BOT_TOKEN
        if not bot_token or "dummy" in bot_token:
            return Response({
                "detail": f"Telegram Bot token sozlanmagan. {len(telegram_ids)} ta qabul qiluvchi aniqlandi.",
                "recipients_count": len(telegram_ids)
            }, status=status.HTTP_200_OK)

        # Synchronous Telegram Bot API broadcast via requests/urllib
        import urllib.request
        import json

        sent_count = 0
        failed_count = 0
        send_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

        for tg_id in telegram_ids:
            try:
                payload = json.dumps({
                    "chat_id": tg_id,
                    "text": message_text,
                    "parse_mode": parse_mode
                }).encode('utf-8')
                req = urllib.request.Request(send_url, data=payload, headers={'Content-Type': 'application/json'})
                with urllib.request.urlopen(req, timeout=5) as response:
                    if response.status == 200:
                        sent_count += 1
            except Exception:
                failed_count += 1

        return Response({
            "detail": f"Xabar muvaffaqiyatli tarqatildi: {sent_count} ta yetkazildi, {failed_count} ta xatolik.",
            "recipients_count": len(telegram_ids),
            "sent_count": sent_count,
            "failed_count": failed_count
        }, status=status.HTTP_200_OK)
