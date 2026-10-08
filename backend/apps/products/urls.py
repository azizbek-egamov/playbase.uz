from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductCategoryViewSet, ProductViewSet,
    DirectBarSaleView, AttachToSessionView, BarSaleHistoryView
)

router = DefaultRouter()
router.register(r'categories', ProductCategoryViewSet, basename='product_category')
router.register(r'items', ProductViewSet, basename='product')

urlpatterns = [
    path('pos/quick-sale/', DirectBarSaleView.as_view(), name='bar_quick_sale'),
    path('pos/attach-to-session/', AttachToSessionView.as_view(), name='bar_attach_to_session'),
    path('pos/history/', BarSaleHistoryView.as_view(), name='bar_sale_history'),
    path('', include(router.urls)),
]
