from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import TelegramWebAppAuthView, TelegramWidgetAuthView, DevLoginView, MeView

urlpatterns = [
    path('auth/telegram-web-app/', TelegramWebAppAuthView.as_view(), name='twa_auth'),
    path('auth/telegram-widget/', TelegramWidgetAuthView.as_view(), name='telegram_widget_auth'),
    path('auth/dev-login/', DevLoginView.as_view(), name='dev_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
]
