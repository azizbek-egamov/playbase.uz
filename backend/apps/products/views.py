from decimal import Decimal
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.clubs.models import Club
from apps.clubs.permissions import IsClubStaff, HasActiveSubscription
from apps.sessions_app.models import Session, SessionOrderItem, SessionStatus
from .models import ProductCategory, Product, BarSale, BarSaleItem
from .serializers import (
    ProductCategorySerializer, ProductSerializer,
    BarSaleSerializer, DirectSaleCreateSerializer, AttachToSessionSerializer
)

class ProductCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ProductCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    def get_queryset(self):
        club_id = self.request.headers.get('X-Club-Id') or self.request.query_params.get('club_id')
        if not club_id:
            return ProductCategory.objects.none()
        return ProductCategory.objects.filter(club_id=club_id)

    def perform_create(self, serializer):
        club_id = self.request.headers.get('X-Club-Id') or self.request.data.get('club')
        club = get_object_or_404(Club, id=club_id)
        serializer.save(club=club)

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    def get_queryset(self):
        club_id = self.request.headers.get('X-Club-Id') or self.request.query_params.get('club_id')
        if not club_id:
            return Product.objects.none()
        queryset = Product.objects.filter(club_id=club_id)
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    def perform_create(self, serializer):
        club_id = self.request.headers.get('X-Club-Id') or self.request.data.get('club')
        club = get_object_or_404(Club, id=club_id)
        serializer.save(club=club)

class DirectBarSaleView(APIView):
    """
    Mustaqil (Direct) Bar Kassa savdosi: Joyida to'lov qilib olib ketish.
    """
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    @extend_schema(request=DirectSaleCreateSerializer, responses={201: BarSaleSerializer})
    def post(self, request):
        serializer = DirectSaleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        club_id = request.headers.get('X-Club-Id') or request.data.get('club_id')
        club = get_object_or_404(Club, id=club_id)

        items_data = data['items']
        if not items_data:
            return Response({"detail": "Savatda hech qanday mahsulot yo'q."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # 1. Create BarSale
            sale = BarSale.objects.create(
                club=club,
                sold_by=request.user,
                customer_name=data.get('customer_name', ''),
                payment_type=data.get('payment_type'),
                discount_amount=data.get('discount_amount', Decimal(0)),
                note=data.get('note', '')
            )

            total_raw = Decimal(0)
            for item in items_data:
                product = get_object_or_404(Product.objects.select_for_update(), id=item['product_id'], club=club)
                qty = item['quantity']

                # Create sale item
                item_total = product.selling_price * qty
                BarSaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=qty,
                    cost_price=product.cost_price,
                    unit_price=product.selling_price,
                    total_price=item_total
                )
                total_raw += item_total

                # Deduct stock
                if product.stock_quantity > 0:
                    product.stock_quantity = max(0, product.stock_quantity - qty)
                    product.save(update_fields=['stock_quantity'])

            discount = data.get('discount_amount', Decimal(0))
            sale.total_amount = total_raw
            sale.final_amount = max(Decimal(0), total_raw - discount)
            sale.save(update_fields=['total_amount', 'final_amount'])

        # Thermal chek apparat funksiyasi vaqtincha commentga olingan
        # try:
        #     from apps.printers.services import create_bar_sale_print_job
        #     create_bar_sale_print_job(sale, cashier_name=request.user.get_full_name() or request.user.username)
        # except Exception:
        #     pass

        return Response(BarSaleSerializer(sale).data, status=status.HTTP_201_CREATED)

class AttachToSessionView(APIView):
    """
    Bar mahsulotlarini faol o'yin stoliga (sessiyaga) biriktirish.
    """
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    @extend_schema(request=AttachToSessionSerializer)
    def post(self, request):
        serializer = AttachToSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        session = get_object_or_404(Session, id=data['session_id'], status=SessionStatus.ACTIVE)
        items_data = data['items']

        with transaction.atomic():
            for item in items_data:
                product = get_object_or_404(Product.objects.select_for_update(), id=item['product_id'], club=session.club)
                qty = item['quantity']
                item_total = product.selling_price * qty

                SessionOrderItem.objects.create(
                    session=session,
                    product=product,
                    quantity=qty,
                    unit_price=product.selling_price,
                    total_price=item_total,
                    added_by=request.user
                )

                if product.stock_quantity > 0:
                    product.stock_quantity = max(0, product.stock_quantity - qty)
                    product.save(update_fields=['stock_quantity'])

            # Recalculate session bar amount
            bar_total = sum(order.total_price for order in session.orders.all())
            session.bar_amount = bar_total
            session.save(update_fields=['bar_amount'])

        return Response({
            "message": "Mahsulotlar stol hisobiga muvaffaqiyatli qo'shildi!",
            "session_id": str(session.id),
            "table_name": session.table.name,
            "session_bar_amount": float(session.bar_amount)
        }, status=status.HTTP_200_OK)

class BarSaleHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubStaff]

    @extend_schema(responses={200: BarSaleSerializer(many=True)})
    def get(self, request):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')
        if not club_id:
            return Response({"detail": "X-Club-Id talab qilinadi."}, status=status.HTTP_400_BAD_REQUEST)

        sales = BarSale.objects.filter(club_id=club_id).prefetch_related('items', 'items__product')[:100]
        return Response(BarSaleSerializer(sales, many=True).data)
