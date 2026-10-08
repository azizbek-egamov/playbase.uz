from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionPlanListView, ClubViewSet, ZoneViewSet, GameTableViewSet, ClubMemberViewSet

router = DefaultRouter()
router.register(r'clubs', ClubViewSet, basename='club')
router.register(r'zones', ZoneViewSet, basename='zone')
router.register(r'tables', GameTableViewSet, basename='table')
router.register(r'staff', ClubMemberViewSet, basename='staff')

urlpatterns = [
    path('billing/plans/', SubscriptionPlanListView.as_view(), name='plans_list'),
    path('', include(router.urls)),
]
