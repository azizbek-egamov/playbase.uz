from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminLoginView, AdminChangePasswordView, AdminMeView,
    SuperAdminOverviewView, SuperAdminClubViewSet,
    SuperAdminPlanViewSet, SuperAdminTransactionViewSet,
    SuperAdminUserViewSet, SuperAdminBroadcastView
)

router = DefaultRouter()
router.register(r'clubs', SuperAdminClubViewSet, basename='admin-clubs')
router.register(r'plans', SuperAdminPlanViewSet, basename='admin-plans')
router.register(r'transactions', SuperAdminTransactionViewSet, basename='admin-transactions')
router.register(r'users', SuperAdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('auth/login/', AdminLoginView.as_view(), name='admin-login'),
    path('auth/change-password/', AdminChangePasswordView.as_view(), name='admin-change-password'),
    path('auth/me/', AdminMeView.as_view(), name='admin-me'),
    path('overview/', SuperAdminOverviewView.as_view(), name='admin-overview'),
    path('broadcast/', SuperAdminBroadcastView.as_view(), name='admin-broadcast'),
    path('', include(router.urls)),
]
