from rest_framework import serializers
from .models import PrinterDevice, PrintJob

class PrinterDeviceSerializer(serializers.ModelSerializer):
    is_online = serializers.BooleanField(read_only=True)

    class Meta:
        model = PrinterDevice
        fields = [
            'id', 'club', 'name', 'token', 'printer_model',
            'paper_width', 'auto_cut', 'open_cash_drawer',
            'is_active', 'is_online', 'last_seen_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'token', 'is_online', 'last_seen_at', 'created_at', 'updated_at']

class PrintJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrintJob
        fields = [
            'id', 'club', 'device', 'job_type', 'title',
            'receipt_data', 'status', 'error_message',
            'created_at', 'printed_at'
        ]
        read_only_fields = ['id', 'created_at']

class PrintJobAckSerializer(serializers.Serializer):
    job_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=['PRINTED', 'FAILED'])
    error_message = serializers.CharField(required=False, allow_blank=True, default='')
