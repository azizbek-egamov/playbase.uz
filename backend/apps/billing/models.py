import uuid
from django.db import models
from apps.clubs.models import Club, SubscriptionPlan

class TransactionProvider(models.TextChoices):
    PAYME = 'PAYME', 'Payme'
    CLICK = 'CLICK', 'Click'

class TransactionStatus(models.TextChoices):
    PENDING = 'PENDING', 'Kutilmoqda'
    SUCCESS = 'SUCCESS', 'Muvaffaqiyatli'
    FAILED = 'FAILED', 'Xatolik'
    CANCELLED = 'CANCELLED', 'Bekor qilingan'

class SaaSTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='billing_transactions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    provider = models.CharField(max_length=20, choices=TransactionProvider.choices)
    status = models.CharField(max_length=20, choices=TransactionStatus.choices, default=TransactionStatus.PENDING)
    external_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.club.name} - {self.plan.name} ({self.amount:,.0f} UZS - {self.status})"
