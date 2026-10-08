from rest_framework import serializers
from django.utils import timezone
from .models import Session, SessionOrderItem, SessionTransferHistory, SessionStatus, PaymentType
from apps.products.models import Product
from apps.products.serializers import ProductSerializer

class SessionOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SessionOrderItem
        fields = ['id', 'session', 'product', 'product_name', 'quantity', 'unit_price', 'total_price', 'created_at']
        read_only_fields = ['id', 'total_price', 'created_at']

class SessionOrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(default=1, min_value=1)

class SessionSerializer(serializers.ModelSerializer):
    table_name = serializers.CharField(source='table.name', read_only=True)
    table_number = serializers.IntegerField(source='table.number', read_only=True)
    zone_name = serializers.CharField(source='table.zone.name', read_only=True)
    zone_color = serializers.CharField(source='table.zone.color_code', read_only=True)
    orders = SessionOrderItemSerializer(many=True, read_only=True)
    
    current_time_amount = serializers.SerializerMethodField()
    current_total_amount = serializers.SerializerMethodField()
    elapsed_seconds = serializers.SerializerMethodField()
    remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            'id', 'table', 'table_name', 'table_number', 'zone_name', 'zone_color',
            'club', 'started_by', 'closed_by', 'customer_name', 'customer_phone',
            'start_time', 'end_time', 'planned_end_time', 'is_open_ended', 'duration_minutes',
            'applied_hourly_rate', 'time_amount', 'bar_amount', 'discount_amount', 'total_amount',
            'current_time_amount', 'current_total_amount', 'elapsed_seconds', 'remaining_seconds',
            'payment_type', 'status', 'note', 'orders', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'time_amount', 'bar_amount', 'total_amount', 'applied_hourly_rate',
            'status', 'start_time', 'end_time', 'created_at', 'updated_at'
        ]

    def get_current_time_amount(self, obj) -> float:
        if obj.status == SessionStatus.ACTIVE:
            return obj.calculate_current_time_amount()
        return float(obj.time_amount)

    def get_current_total_amount(self, obj) -> float:
        if obj.status == SessionStatus.ACTIVE:
            time_amt = obj.calculate_current_time_amount()
            bar_amt = float(obj.bar_amount)
            discount = float(obj.discount_amount)
            return max(0, time_amt + bar_amt - discount)
        return float(obj.total_amount)

    def get_elapsed_seconds(self, obj) -> int:
        effective_end = obj.end_time or timezone.now()
        return int(max(0, (effective_end - obj.start_time).total_seconds()))

    def get_remaining_seconds(self, obj) -> int | None:
        if obj.is_open_ended or not obj.planned_end_time:
            return None
        diff = (obj.planned_end_time - timezone.now()).total_seconds()
        return int(max(0, diff))

class SessionStartSerializer(serializers.Serializer):
    table_id = serializers.UUIDField()
    is_open_ended = serializers.BooleanField(default=True)
    duration_minutes = serializers.IntegerField(required=False, allow_null=True, min_value=5)
    customer_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    customer_phone = serializers.CharField(required=False, allow_blank=True, max_length=30)
    initial_orders = SessionOrderItemCreateSerializer(many=True, required=False)

class SessionStopSerializer(serializers.Serializer):
    payment_type = serializers.ChoiceField(choices=PaymentType.choices, default=PaymentType.CASH)
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=0)
    note = serializers.CharField(required=False, allow_blank=True)

class SessionExtendSerializer(serializers.Serializer):
    additional_minutes = serializers.IntegerField(min_value=5)

class SessionTransferSerializer(serializers.Serializer):
    target_table_id = serializers.UUIDField()

class SessionDiscountSerializer(serializers.Serializer):
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    discount_percent = serializers.IntegerField(required=False, min_value=0, max_value=100)
