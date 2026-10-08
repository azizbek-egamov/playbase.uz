import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone
from apps.accounts.models import User

class SubscriptionPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    price_per_month = models.DecimalField(max_digits=12, decimal_places=2)
    max_tables = models.IntegerField(default=10)
    max_staff = models.IntegerField(default=3)
    features_json = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.price_per_month:,.0f} UZS)"

class Club(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_clubs')
    address = models.CharField(max_length=500, null=True, blank=True)
    phone = models.CharField(max_length=30, null=True, blank=True)
    logo_url = models.URLField(max_length=500, null=True, blank=True)
    currency = models.CharField(max_length=10, default='UZS')
    rounding_unit = models.IntegerField(default=500) # 100, 500, 1000 so'mga yaxlitlash
    
    active_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='clubs')
    plan_expires_at = models.DateTimeField(null=True, blank=True)
    is_trial = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def has_active_subscription(self) -> bool:
        if not self.is_active:
            return False
        if not self.plan_expires_at:
            return False
        return self.plan_expires_at > timezone.now()

    @property
    def days_left(self) -> int:
        if not self.plan_expires_at:
            return 0
        diff = self.plan_expires_at - timezone.now()
        return max(0, diff.days)

    @property
    def max_allowed_tables(self) -> int:
        if self.active_plan:
            return self.active_plan.max_tables
        if self.is_trial:
            return 25 # Trial davrida Pro Club imkoniyati
        return 10

    def set_trial_period(self, days: int = 7):
        self.is_trial = True
        self.plan_expires_at = timezone.now() + timedelta(days=days)
        if not self.active_plan:
            pro_plan = SubscriptionPlan.objects.filter(code='pro').first()
            if pro_plan:
                self.active_plan = pro_plan
        self.save(update_fields=['is_trial', 'plan_expires_at', 'active_plan'])

    def __str__(self):
        return self.name

class ClubMemberRole(models.TextChoices):
    OWNER = 'OWNER', 'Klub Egasi'
    ADMIN = 'ADMIN', 'Admin / Menejer'
    CASHIER = 'CASHIER', 'Kassir / Operator'

class ClubMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='club_memberships')
    role = models.CharField(max_length=20, choices=ClubMemberRole.choices, default=ClubMemberRole.CASHIER)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('club', 'user')

    def __str__(self):
        return f"{self.user} - {self.club.name} ({self.role})"

class Zone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='zones')
    name = models.CharField(max_length=100) # masalan: Standard, VIP, PlayStation 5, Lounge, Billiard
    hourly_rate = models.DecimalField(max_digits=12, decimal_places=2) # 30000.00
    color_code = models.CharField(max_length=20, default='#10b981') # hex color
    icon = models.CharField(max_length=50, default='sports_esports') # Material symbol icon name
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.name} - {self.hourly_rate:,.0f} {self.club.currency}/soat"

class TableStatus(models.TextChoices):
    IDLE = 'IDLE', 'Bo\'sh'
    OCCUPIED = 'OCCUPIED', 'Band'
    MAINTENANCE = 'MAINTENANCE', 'Texnik xizmatda'

class GameTable(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='tables')
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='tables')
    name = models.CharField(max_length=100) # masalan: "Stol #1", "PS5 VIP 1"
    number = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=TableStatus.choices, default=TableStatus.IDLE)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'number', 'created_at']
        unique_together = ('club', 'number')

    def __str__(self):
        return f"{self.name} ({self.zone.name})"
