import uuid
from django.db import models
from apps.accounts.models import User
from apps.clubs.models import Club

class ProductCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='product_categories')
    name = models.CharField(max_length=100) # masalan: "Ichimliklar", "Snacklar & Chips", "Kalyan", "Oshxona"
    icon = models.CharField(max_length=50, default='local_cafe')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.name

class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name = models.CharField(max_length=150) # masalan: "Flash Energy 0.5L", "Red Bull 0.25L", "Lays 140g"
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Tannarx (sof foydani hisoblash uchun)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2) # Sotish narxi
    stock_quantity = models.IntegerField(default=0) # Ombor qoldig'i
    barcode = models.CharField(max_length=100, null=True, blank=True)
    image_url = models.URLField(max_length=500, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.selling_price:,.0f} UZS (Qoldiq: {self.stock_quantity})"

class BarPaymentType(models.TextChoices):
    CASH = 'CASH', 'Naqd pul'
    CARD = 'CARD', 'Plastik karta (Uzcard/Humo)'
    TRANSFER = 'TRANSFER', 'Click / Payme'
    DEBT = 'DEBT', 'Nasiya / Qarz'

class BarSale(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='bar_sales')
    sold_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='bar_sales')
    customer_name = models.CharField(max_length=150, null=True, blank=True)
    
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    payment_type = models.CharField(max_length=20, choices=BarPaymentType.choices, default=BarPaymentType.CASH)
    note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Bar Savdosi #{str(self.id)[:8]} - {self.final_amount:,.0f} UZS ({self.payment_type})"

class BarSaleItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale = models.ForeignKey(BarSale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sale_items')
    quantity = models.PositiveIntegerField(default=1)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        if not self.cost_price:
            self.cost_price = self.product.cost_price
        super().save(*args, **kwargs)
