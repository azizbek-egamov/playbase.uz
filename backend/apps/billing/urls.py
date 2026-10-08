from django.urls import path
from .views import (
    CheckoutView,
    PaymeWebhookView,
    ClickWebhookView,
    ClickPrepareWebhookView,
    ClickCompleteWebhookView,
    TransactionHistoryView
)

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='billing_checkout'),
    path('transactions/', TransactionHistoryView.as_view(), name='billing_transactions'),
    path('payme/webhook/', PaymeWebhookView.as_view(), name='payme_webhook'),
    path('click/prepare/', ClickPrepareWebhookView.as_view(), name='click_prepare'),
    path('click/complete/', ClickCompleteWebhookView.as_view(), name='click_complete'),
    path('click/webhook/', ClickWebhookView.as_view(), name='click_webhook'),
]
