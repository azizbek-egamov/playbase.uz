from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'full_name', 'phone_number', 'avatar_url', 'is_owner', 'language', 'is_active', 'created_at']
        read_only_fields = ['id', 'telegram_id', 'is_active', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username or str(obj.telegram_id)

class TelegramWebAppAuthSerializer(serializers.Serializer):
    init_data = serializers.CharField(required=True, allow_blank=False)
    is_owner = serializers.BooleanField(default=False)

class DevAuthSerializer(serializers.Serializer):
    telegram_id = serializers.IntegerField(default=123456789)
    username = serializers.CharField(default="admin_demo")
    first_name = serializers.CharField(default="PlayBase Admin")
    is_owner = serializers.BooleanField(default=True)
