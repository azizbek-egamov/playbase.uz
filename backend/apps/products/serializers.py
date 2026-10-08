from rest_framework import serializers
from .models import ProductCategory, Product, BarSale, BarSaleItem, BarPaymentType

class ProductCategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = ProductCategory
        fields = ['id', 'club', 'name', 'icon', 'order', 'products_count', 'created_at']
        read_only_fields = ['id', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'club', 'category', 'category_name', 'name',
            'cost_price', 'selling_price', 'stock_quantity', 'barcode',
            'image_url', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class BarSaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = BarSaleItem
        fields = ['id', 'product', 'product_name', 'quantity', 'cost_price', 'unit_price', 'total_price', 'created_at']

class BarSaleSerializer(serializers.ModelSerializer):
    items = BarSaleItemSerializer(many=True, read_only=True)
    sold_by_name = serializers.CharField(source='sold_by.get_full_name', read_only=True)

    class Meta:
        model = BarSale
        fields = [
            'id', 'club', 'sold_by', 'sold_by_name', 'customer_name',
            'total_amount', 'discount_amount', 'final_amount',
            'payment_type', 'note', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'total_amount', 'final_amount', 'created_at']

class DirectSaleItemInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)

class DirectSaleCreateSerializer(serializers.Serializer):
    items = DirectSaleItemInputSerializer(many=True)
    payment_type = serializers.ChoiceField(choices=BarPaymentType.choices, default=BarPaymentType.CASH)
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0, min_value=0)
    customer_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    note = serializers.CharField(required=False, allow_blank=True)

class AttachToSessionSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    items = DirectSaleItemInputSerializer(many=True)
