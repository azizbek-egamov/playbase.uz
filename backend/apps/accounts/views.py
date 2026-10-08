from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema
from django.conf import settings

from .models import User
from .serializers import UserSerializer, TelegramWebAppAuthSerializer, DevAuthSerializer
from .services import TelegramAuthService

class TelegramWebAppAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=TelegramWebAppAuthSerializer,
        responses={200: dict},
        description="Authenticate user via Telegram WebApp initData string and issue JWT tokens."
    )
    def post(self, request):
        serializer = TelegramWebAppAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        init_data = serializer.validated_data['init_data']
        is_owner = serializer.validated_data.get('is_owner', False)

        user_data = TelegramAuthService.validate_twa_init_data(init_data)
        if not user_data:
            return Response(
                {"detail": "Noto'g'ri yoki muddati o'tgan Telegram initData."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = TelegramAuthService.get_or_create_telegram_user(user_data, is_owner=is_owner)
        
        if not user.is_active:
            return Response({
                "detail": "Sizning hisobingiz administrator tomonidan bloklangan.",
                "is_blocked": True,
                "support_telegram": "@playbase_support"
            }, status=status.HTTP_403_FORBIDDEN)

        # Auto-provision initial club with trial if new user has no clubs
        from apps.clubs.models import Club, ClubMember, ClubMemberRole, Zone, GameTable, SubscriptionPlan
        from apps.products.models import ProductCategory, Product
        from datetime import timedelta
        from django.utils import timezone

        if not ClubMember.objects.filter(user=user).exists() and not Club.objects.filter(owner=user).exists():
            first_name = user.first_name or user.username or "PlayBase"
            pro_plan = SubscriptionPlan.objects.filter(code='pro').first()
            club = Club.objects.create(
                name=f"{first_name} Game Lounge",
                owner=user,
                address="Toshkent sh., Markaziy filial",
                active_plan=pro_plan,
                is_trial=True,
                plan_expires_at=timezone.now() + timedelta(days=7),
                rounding_unit=500,
                currency='UZS'
            )
            ClubMember.objects.create(club=club, user=user, role=ClubMemberRole.OWNER)

            # Create default zones
            zone_std = Zone.objects.create(club=club, name="Standart PS5", hourly_rate=25000, color_code="#10b981", icon="sports_esports", order=1)
            zone_vip = Zone.objects.create(club=club, name="VIP Lounge PS5", hourly_rate=45000, color_code="#8b5cf6", icon="videogame_asset", order=2)
            zone_bil = Zone.objects.create(club=club, name="Billiard Pool", hourly_rate=35000, color_code="#3b82f6", icon="sports_handball", order=3)

            # Create default tables
            GameTable.objects.create(club=club, zone=zone_std, name="PS5 #1", number=1, order=1)
            GameTable.objects.create(club=club, zone=zone_std, name="PS5 #2", number=2, order=2)
            GameTable.objects.create(club=club, zone=zone_std, name="PS5 #3", number=3, order=3)
            GameTable.objects.create(club=club, zone=zone_vip, name="VIP Xona #1", number=4, order=4)
            GameTable.objects.create(club=club, zone=zone_vip, name="VIP Xona #2", number=5, order=5)
            GameTable.objects.create(club=club, zone=zone_bil, name="Billiard #1", number=6, order=6)

            # Create default categories and products
            cat_drink = ProductCategory.objects.create(club=club, name="Ichimliklar", icon="local_cafe", order=1)
            cat_snack = ProductCategory.objects.create(club=club, name="Snacklar & Chips", icon="cookie", order=2)

            Product.objects.create(club=club, category=cat_drink, name="Flash Energy 0.5L", cost_price=7000, selling_price=12000, stock_quantity=48)
            Product.objects.create(club=club, category=cat_drink, name="Coca-Cola 0.5L", cost_price=6000, selling_price=10000, stock_quantity=60)
            Product.objects.create(club=club, category=cat_drink, name="Red Bull 0.25L", cost_price=16000, selling_price=24000, stock_quantity=24)
            Product.objects.create(club=club, category=cat_snack, name="Lays Chips 140g", cost_price=12000, selling_price=18000, stock_quantity=30)

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class TelegramWidgetAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        responses={200: dict},
        description="Authenticate user via official Telegram Login Widget callback."
    )
    def post(self, request):
        data = request.data
        user_data = TelegramAuthService.validate_telegram_widget_data(data)
        if not user_data:
            return Response(
                {"detail": "Telegram Login ma'lumotlari tasdiqlanmadi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_owner = data.get('is_owner', True)
        user = TelegramAuthService.get_or_create_telegram_user(user_data, is_owner=is_owner)

        if not user.is_active:
            return Response({
                "detail": "Sizning hisobingiz administrator tomonidan bloklangan.",
                "is_blocked": True,
                "support_telegram": "@playbase_support"
            }, status=status.HTTP_403_FORBIDDEN)

        from apps.clubs.models import Club, ClubMember, ClubMemberRole, Zone, GameTable
        from apps.products.models import ProductCategory, Product
        from datetime import timedelta
        from django.utils import timezone

        if not ClubMember.objects.filter(user=user).exists() and not Club.objects.filter(owner=user).exists():
            first_name = user.first_name or user.username or "PlayBase"
            club = Club.objects.create(
                name=f"{first_name} Game Lounge",
                owner=user,
                address="Toshkent sh., Markaziy filial",
                is_trial=True,
                plan_expires_at=timezone.now() + timedelta(days=7),
                rounding_unit=500,
                currency='UZS'
            )
            ClubMember.objects.create(club=club, user=user, role=ClubMemberRole.OWNER)

            # Default zones
            zone_std = Zone.objects.create(club=club, name="Standart PS5", hourly_rate=25000, color_code="#10b981", icon="sports_esports", order=1)
            zone_vip = Zone.objects.create(club=club, name="VIP Lounge PS5", hourly_rate=45000, color_code="#8b5cf6", icon="videogame_asset", order=2)
            zone_bil = Zone.objects.create(club=club, name="Billiard Pool", hourly_rate=35000, color_code="#3b82f6", icon="sports_handball", order=3)

            # Default tables
            GameTable.objects.create(club=club, zone=zone_std, name="PS5 #1", number=1, order=1)
            GameTable.objects.create(club=club, zone=zone_std, name="PS5 #2", number=2, order=2)
            GameTable.objects.create(club=club, zone=zone_std, name="PS5 #3", number=3, order=3)
            GameTable.objects.create(club=club, zone=zone_vip, name="VIP Xona #1", number=4, order=4)
            GameTable.objects.create(club=club, zone=zone_vip, name="VIP Xona #2", number=5, order=5)
            GameTable.objects.create(club=club, zone=zone_bil, name="Billiard #1", number=6, order=6)

            # Default products
            cat_drink = ProductCategory.objects.create(club=club, name="Ichimliklar", icon="local_cafe", order=1)
            cat_snack = ProductCategory.objects.create(club=club, name="Snacklar & Chips", icon="cookie", order=2)

            Product.objects.create(club=club, category=cat_drink, name="Flash Energy 0.5L", cost_price=7000, selling_price=12000, stock_quantity=48)
            Product.objects.create(club=club, category=cat_drink, name="Coca-Cola 0.5L", cost_price=6000, selling_price=10000, stock_quantity=60)
            Product.objects.create(club=club, category=cat_drink, name="Red Bull 0.25L", cost_price=16000, selling_price=24000, stock_quantity=24)
            Product.objects.create(club=club, category=cat_snack, name="Lays Chips 140g", cost_price=12000, selling_price=18000, stock_quantity=30)

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class DevLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=DevAuthSerializer,
        responses={200: dict},
        description="Dev/Demo login for local development and rapid browser testing. ONLY available when DEBUG=True."
    )
    def post(self, request):
        # Xavfsizlik: bu endpoint faqat DEBUG rejimida ishlaydi
        if not settings.DEBUG:
            return Response(
                {"detail": "Bu endpoint faqat development rejimida mavjud."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DevAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user, _ = User.objects.get_or_create(
            telegram_id=data['telegram_id'],
            defaults={
                'username': data['username'],
                'first_name': data['first_name'],
                'is_owner': data['is_owner']
            }
        )
        if not user.is_active:
            return Response({
                "detail": "Sizning hisobingiz administrator tomonidan bloklangan.",
                "is_blocked": True,
                "support_telegram": "@playbase_support"
            }, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: UserSerializer},
        description="Get current user details."
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        request=UserSerializer,
        responses={200: UserSerializer},
        description="Update current user details."
    )
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
