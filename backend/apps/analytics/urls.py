from django.urls import path
from .views import (
    DashboardStatsView, RevenueTrendsView, PeakHoursView,
    TopProductsView, PaymentMethodsBreakdownView
)

urlpatterns = [
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('trends/', RevenueTrendsView.as_view(), name='revenue_trends'),
    path('peak-hours/', PeakHoursView.as_view(), name='peak_hours'),
    path('top-products/', TopProductsView.as_view(), name='top_products'),
    path('payment-methods/', PaymentMethodsBreakdownView.as_view(), name='payment_methods'),
]
