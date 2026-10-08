import hashlib
from datetime import timedelta
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.clubs.models import Club, SubscriptionPlan
from apps.clubs.permissions import IsClubOwner
from .models import SaaSTransaction, TransactionProvider, TransactionStatus
from .serializers import SaaSTransactionSerializer, CreateCheckoutSerializer

class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubOwner]

    @extend_schema(request=CreateCheckoutSerializer)
    def post(self, request):
        serializer = CreateCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        club_id = request.headers.get('X-Club-Id') or request.data.get('club_id')
        club = get_object_or_404(Club, id=club_id, owner=request.user)
        plan = get_object_or_404(SubscriptionPlan, id=serializer.validated_data['plan_id'], is_active=True)
        provider = serializer.validated_data['provider']

        tx = SaaSTransaction.objects.create(
            club=club,
            plan=plan,
            amount=plan.price_per_month,
            provider=provider,
            status=TransactionStatus.PENDING
        )

        service_id = getattr(settings, 'CLICK_SERVICE_ID', '113304')
        merchant_id = getattr(settings, 'CLICK_MERCHANT_ID', '62836')
        return_url = getattr(settings, 'TELEGRAM_WEBAPP_URL', 'https://licensing-packaging-original-requesting.trycloudflare.com')

        # Official Click URL format
        checkout_url = (
            f"https://my.click.uz/services/pay"
            f"?service_id={service_id}"
            f"&merchant_id={merchant_id}"
            f"&amount={float(plan.price_per_month):.2f}"
            f"&transaction_param={tx.id}"
            f"&return_url={return_url}"
        )

        return Response({
            "transaction_id": str(tx.id),
            "checkout_url": checkout_url,
            "amount": float(tx.amount),
            "provider": provider
        })

class ClickWebhookView(APIView):
    """
    Official Click Merchant API Callback (Prepare & Complete).
    Supports both JSON and form-urlencoded requests with MD5 sign_string check.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        click_trans_id = data.get('click_trans_id')
        service_id = data.get('service_id')
        merchant_trans_id = data.get('merchant_trans_id')
        merchant_prepare_id = data.get('merchant_prepare_id', '')
        amount = data.get('amount')
        action = str(data.get('action', ''))
        error = data.get('error', 0)
        error_note = data.get('error_note', '')
        sign_time = data.get('sign_time', '')
        sign_string = data.get('sign_string', '')

        secret_key = getattr(settings, 'CLICK_SECRET_KEY', 'U2DfaumvVrleu')

        # 1. Check if Click reported an error
        if int(error) < 0:
            return Response({
                "click_trans_id": click_trans_id,
                "merchant_trans_id": merchant_trans_id,
                "merchant_prepare_id": merchant_prepare_id,
                "error": error,
                "error_note": error_note or "Click error reported"
            })

        # 2. Verify MD5 Signature (if sign_string is provided)
        if sign_string and not settings.DEBUG:
            if action == '0':  # Prepare
                expected_str = f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}{amount}{action}{sign_time}"
            else:  # Complete
                expected_str = f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}{merchant_prepare_id}{amount}{action}{sign_time}"
            
            computed_sign = hashlib.md5(expected_str.encode('utf-8')).hexdigest()
            if computed_sign.lower() != sign_string.lower():
                return Response({
                    "click_trans_id": click_trans_id,
                    "merchant_trans_id": merchant_trans_id,
                    "error": -1,
                    "error_note": "SIGN CHECK FAILED"
                })

        # 3. Find target SaaSTransaction
        try:
            tx = SaaSTransaction.objects.get(id=merchant_trans_id)
        except (SaaSTransaction.DoesNotExist, ValueError):
            return Response({
                "click_trans_id": click_trans_id,
                "merchant_trans_id": merchant_trans_id,
                "error": -5,
                "error_note": "User / Transaction does not exist"
            })

        # 4. Check Amount match
        try:
            if float(amount) < float(tx.amount):
                return Response({
                    "click_trans_id": click_trans_id,
                    "merchant_trans_id": merchant_trans_id,
                    "error": -2,
                    "error_note": "Incorrect parameter amount"
                })
        except (ValueError, TypeError):
            pass

        # 5. Handle Action 0: PREPARE
        if action == '0':
            if tx.status == TransactionStatus.SUCCESS:
                return Response({
                    "click_trans_id": click_trans_id,
                    "merchant_trans_id": merchant_trans_id,
                    "error": -4,
                    "error_note": "Already paid"
                })

            return Response({
                "click_trans_id": click_trans_id,
                "merchant_trans_id": merchant_trans_id,
                "merchant_prepare_id": str(tx.id),
                "error": 0,
                "error_note": "Success"
            })

        # 6. Handle Action 1: COMPLETE
        elif action == '1':
            if tx.status == TransactionStatus.SUCCESS:
                return Response({
                    "click_trans_id": click_trans_id,
                    "merchant_trans_id": merchant_trans_id,
                    "merchant_confirm_id": str(tx.id),
                    "error": 0,
                    "error_note": "Success"
                })

            # Mark transaction as paid
            tx.status = TransactionStatus.SUCCESS
            tx.external_id = str(click_trans_id)
            tx.save(update_fields=['status', 'external_id'])

            # Extend SaaS subscription for Club (+30 days)
            club = tx.club
            now = timezone.now()
            base_date = club.plan_expires_at if (club.plan_expires_at and club.plan_expires_at > now) else now
            club.plan_expires_at = base_date + timedelta(days=30)
            club.active_plan = tx.plan
            club.is_trial = False
            club.is_active = True
            club.save(update_fields=['plan_expires_at', 'active_plan', 'is_trial', 'is_active'])

            return Response({
                "click_trans_id": click_trans_id,
                "merchant_trans_id": merchant_trans_id,
                "merchant_confirm_id": str(tx.id),
                "error": 0,
                "error_note": "Success"
            })

        return Response({
            "click_trans_id": click_trans_id,
            "merchant_trans_id": merchant_trans_id,
            "error": -3,
            "error_note": "Action not found"
        })

class ClickPrepareWebhookView(ClickWebhookView):
    def post(self, request):
        if 'action' not in request.data:
            request.data._mutable = True if hasattr(request.data, '_mutable') else False
            request.data['action'] = '0'
        return super().post(request)

class ClickCompleteWebhookView(ClickWebhookView):
    def post(self, request):
        if 'action' not in request.data:
            request.data._mutable = True if hasattr(request.data, '_mutable') else False
            request.data['action'] = '1'
        return super().post(request)

class PaymeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        return Response({"error": {"code": -32601, "message": "Payme is disabled"}})

class TransactionHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubOwner]

    @extend_schema(responses={200: SaaSTransactionSerializer(many=True)})
    def get(self, request):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')
        transactions = SaaSTransaction.objects.filter(club_id=club_id).order_by('-created_at')
        return Response(SaaSTransactionSerializer(transactions, many=True).data)
