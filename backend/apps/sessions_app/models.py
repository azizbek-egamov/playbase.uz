import uuid
from django.db import models
from django.utils import timezone
from apps.accounts.models import User
from apps.clubs.models import Club, GameTable
from apps.products.models import Product

class SessionStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Faol'
    COMPLETED = 'COMPLETED', 'Yakunlangan'
    CANCELLED = 'CANCELLED', 'Bekor qilingan'

class PaymentType(models.TextChoices):
    CASH = 'CASH', 'Naqd pul'
    CARD = 'CARD', 'Plastik karta (Uzcard/Humo)'
    TRANSFER = 'TRANSFER', 'Bank o\'tkazmasi / Click / Payme'
    DEBT = 'DEBT', 'Qarz / Nasiya'

class Session(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    table = models.ForeignKey(GameTable, on_delete=models.CASCADE, related_name='sessions')
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='sessions')
    started_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='started_sessions')
    closed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='closed_sessions')
    
    customer_name = models.CharField(max_length=150, null=True, blank=True)
    customer_phone = models.CharField(max_length=30, null=True, blank=True)
    
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    planned_end_time = models.DateTimeField(null=True, blank=True)
    
    is_open_ended = models.BooleanField(default=True) # Cheksiz yoki Taymerli
    duration_minutes = models.IntegerField(null=True, blank=True) # Agar taymerli bo'lsa
    
    applied_hourly_rate = models.DecimalField(max_digits=12, decimal_places=2)
    time_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bar_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices, default=PaymentType.CASH)
    status = models.CharField(max_length=20, choices=SessionStatus.choices, default=SessionStatus.ACTIVE)
    note = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_time']

    def calculate_current_time_amount(self, current_time=None) -> float:
        """
        Calculates time spent amount based on applied_hourly_rate and club rounding.
        """
        if not current_time:
            current_time = timezone.now()
        
        effective_end = self.end_time or current_time
        duration_seconds = max(0, (effective_end - self.start_time).total_seconds())
        duration_minutes = duration_seconds / 60.0
        
        # Hourly rate per minute
        rate_per_minute = float(self.applied_hourly_rate) / 60.0
        raw_amount = duration_minutes * rate_per_minute
        
        # Rounding rule based on club
        rounding = self.club.rounding_unit if self.club else 500
        rounded_amount = round(raw_amount / rounding) * rounding
        return max(0, rounded_amount)

    def __str__(self):
        return f"Sessiya #{str(self.id)[:8]} - {self.table.name} ({self.status})"

class SessionOrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='orders')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='session_orders')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

class SessionTransferHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='transfers')
    from_table = models.ForeignKey(GameTable, on_delete=models.CASCADE, related_name='transferred_from')
    to_table = models.ForeignKey(GameTable, on_delete=models.CASCADE, related_name='transferred_to')
    transferred_at = models.DateTimeField(default=timezone.now)
    transferred_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
