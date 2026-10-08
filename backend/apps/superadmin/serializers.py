from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.accounts.models import User
from apps.clubs.models import Club, SubscriptionPlan, ClubMember
from apps.billing.models import SaaSTransaction
from apps.sessions_app.models import Session

class AdminLoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Login yoki parol noto'g'ri.")
        
        if not (user.is_staff or user.is_superuser):
            raise serializers.ValidationError("Ushbu hisob Master Admin huquqiga ega emas.")

        if not user.is_active:
            raise serializers.ValidationError("Ushbu hisob faolsizlantirilgan.")

        attrs['user'] = user
        return attrs

class AdminChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, min_length=6, write_only=True)
    confirm_new_password = serializers.CharField(required=True, min_length=6, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({"confirm_new_password": "Yangi parollar bir-biriga mos kelmadi."})
        return attrs

class SuperAdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'phone_number', 'is_owner', 'is_staff', 'is_superuser', 'is_active', 'created_at']

class SuperAdminClubSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_phone = serializers.CharField(source='owner.phone_number', read_only=True)
    owner_telegram_id = serializers.IntegerField(source='owner.telegram_id', read_only=True)
    active_plan_name = serializers.CharField(source='active_plan.name', read_only=True)
    tables_count = serializers.IntegerField(source='tables.count', read_only=True)
    members_count = serializers.IntegerField(source='members.count', read_only=True)
    has_active_subscription = serializers.BooleanField(read_only=True)
    days_left = serializers.IntegerField(read_only=True)

    class Meta:
        model = Club
        fields = [
            'id', 'name', 'address', 'phone', 'currency', 'rounding_unit',
            'owner', 'owner_name', 'owner_username', 'owner_phone', 'owner_telegram_id',
            'active_plan', 'active_plan_name', 'plan_expires_at',
            'is_trial', 'is_active', 'has_active_subscription', 'days_left',
            'tables_count', 'members_count', 'created_at', 'updated_at'
        ]

class SuperAdminExtendSubscriptionSerializer(serializers.Serializer):
    days = serializers.IntegerField(required=False, default=30, min_value=1)
    plan_id = serializers.UUIDField(required=False)
    is_trial = serializers.BooleanField(required=False, default=False)

class SuperAdminPlanSerializer(serializers.ModelSerializer):
    clubs_count = serializers.IntegerField(source='clubs.count', read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'code', 'price_per_month', 'max_tables',
            'max_staff', 'features_json', 'is_active', 'clubs_count', 'created_at'
        ]

class SuperAdminTransactionSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source='club.name', read_only=True)
    owner_name = serializers.CharField(source='club.owner.get_full_name', read_only=True)
    owner_phone = serializers.CharField(source='club.owner.phone_number', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model = SaaSTransaction
        fields = [
            'id', 'club', 'club_name', 'owner_name', 'owner_phone',
            'plan', 'plan_name', 'amount', 'provider', 'status',
            'external_id', 'created_at', 'updated_at'
        ]

class BroadcastMessageSerializer(serializers.Serializer):
    TARGET_CHOICES = [
        ('ALL', 'Barcha Klub Egalari'),
        ('ACTIVE', 'Faqat Faol Obunachilar'),
        ('TRIAL', 'Faqat Trial Dagilar'),
        ('EXPIRED', 'Obunasi Tugaganlar')
    ]
    target = serializers.ChoiceField(choices=TARGET_CHOICES, default='ALL')
    message = serializers.CharField(required=True, min_length=5)
    parse_mode = serializers.CharField(default='HTML')
