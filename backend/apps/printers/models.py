import uuid
import secrets
from django.db import models
from django.utils import timezone
from apps.clubs.models import Club

def generate_printer_token():
    return f"pb_prn_{secrets.token_hex(12)}"

class PrinterDevice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='printers')
    name = models.CharField(max_length=150, default="Asosiy Kassa Printeri")
    token = models.CharField(max_length=64, unique=True, default=generate_printer_token)
    printer_model = models.CharField(max_length=150, blank=True, null=True, default="Termal Chek Printeri (ESC/POS)")
    paper_width = models.IntegerField(default=80, choices=[(58, "58 mm"), (80, "80 mm")])
    auto_cut = models.BooleanField(default=True)
    open_cash_drawer = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_online(self) -> bool:
        if not self.last_seen_at:
            return False
        # Agent har 5 soniyada ping yuboradi, 20 soniya ichida ko'ringan bo'lsa online
        return (timezone.now() - self.last_seen_at).total_seconds() < 25

    def __str__(self):
        return f"{self.name} ({self.club.name}) - {'ONLINE' if self.is_online else 'OFFLINE'}"

class PrintJobStatus(models.TextChoices):
    PENDING = 'PENDING', 'Kutilmoqda'
    PRINTED = 'PRINTED', 'Chop etildi'
    FAILED = 'FAILED', 'Xatolik'

class PrintJobType(models.TextChoices):
    BAR_SALE = 'BAR_SALE', 'Bar Savdosi Cheki'
    SESSION_RECEIPT = 'SESSION_RECEIPT', 'Stol Seansi Cheki'
    Z_REPORT = 'Z_REPORT', 'Smena Hisoboti (Z-Report)'
    TEST = 'TEST', 'Test Chek'

class PrintJob(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='print_jobs')
    device = models.ForeignKey(PrinterDevice, on_delete=models.SET_NULL, null=True, blank=True, related_name='jobs')
    job_type = models.CharField(max_length=30, choices=PrintJobType.choices, default=PrintJobType.BAR_SALE)
    title = models.CharField(max_length=200, default="Chek")
    receipt_data = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=PrintJobStatus.choices, default=PrintJobStatus.PENDING)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    printed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.get_job_type_display()} - {self.club.name} ({self.status})"
