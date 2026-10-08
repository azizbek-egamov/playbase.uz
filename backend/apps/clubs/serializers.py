from rest_framework import serializers
from .models import SubscriptionPlan, Club, ClubMember, Zone, GameTable
from apps.accounts.serializers import UserSerializer

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'code', 'price_per_month', 'max_tables', 'max_staff', 'features_json', 'is_active']

class ClubMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = ClubMember
        fields = ['id', 'club', 'user', 'user_id', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class ZoneSerializer(serializers.ModelSerializer):
    tables_count = serializers.IntegerField(source='tables.count', read_only=True)

    class Meta:
        model = Zone
        fields = ['id', 'club', 'name', 'hourly_rate', 'color_code', 'icon', 'order', 'is_active', 'tables_count', 'created_at']
        read_only_fields = ['id', 'created_at']

class GameTableSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    zone_hourly_rate = serializers.DecimalField(source='zone.hourly_rate', max_digits=12, decimal_places=2, read_only=True)
    zone_color_code = serializers.CharField(source='zone.color_code', read_only=True)
    is_plan_locked = serializers.SerializerMethodField()
    lock_reason = serializers.SerializerMethodField()

    class Meta:
        model = GameTable
        fields = [
            'id', 'club', 'zone', 'zone_name', 'zone_hourly_rate', 'zone_color_code',
            'name', 'number', 'status', 'order', 'is_active', 'is_plan_locked', 'lock_reason', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def _get_allowed_ids(self, club):
        if not hasattr(club, '_allowed_table_ids_cache'):
            max_allowed = club.max_allowed_tables
            allowed = list(
                club.tables.filter(is_active=True)
                .order_by('order', 'number', 'created_at')
                .values_list('id', flat=True)[:max_allowed]
            )
            club._allowed_table_ids_cache = set(allowed)
            club._max_allowed_cache = max_allowed
        return club._allowed_table_ids_cache

    def get_is_plan_locked(self, obj):
        allowed_ids = self._get_allowed_ids(obj.club)
        return obj.id not in allowed_ids

    def get_lock_reason(self, obj):
        if self.get_is_plan_locked(obj):
            max_allowed = getattr(obj.club, '_max_allowed_cache', 10)
            return f"Tarif limiti ({max_allowed} ta) oshganligi sababli bloklangan"
        return None

class ClubSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    active_plan_detail = SubscriptionPlanSerializer(source='active_plan', read_only=True)
    days_left = serializers.IntegerField(read_only=True)
    has_active_subscription = serializers.BooleanField(read_only=True)
    zones = ZoneSerializer(many=True, read_only=True)
    tables_count = serializers.IntegerField(source='tables.count', read_only=True)

    class Meta:
        model = Club
        fields = [
            'id', 'name', 'owner', 'address', 'phone', 'logo_url', 'currency', 'rounding_unit',
            'active_plan', 'active_plan_detail', 'plan_expires_at', 'is_trial', 'is_active',
            'has_active_subscription', 'days_left', 'zones', 'tables_count', 'created_at'
        ]
        read_only_fields = ['id', 'owner', 'plan_expires_at', 'is_trial', 'created_at']

class ClubCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'address', 'phone', 'logo_url', 'currency', 'rounding_unit']
