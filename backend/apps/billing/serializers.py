from rest_framework import serializers
from .models import SaaSTransaction
from apps.clubs.serializers import SubscriptionPlanSerializer

class SaaSTransactionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)

    class Meta:
        model = SaaSTransaction
        fields = ['id', 'club', 'club_name', 'plan', 'plan_name', 'amount', 'provider', 'status', 'external_id', 'created_at']
        read_only_fields = ['id', 'created_at']

class CreateCheckoutSerializer(serializers.Serializer):
    plan_id = serializers.UUIDField()
    provider = serializers.ChoiceField(choices=['PAYME', 'CLICK'])
