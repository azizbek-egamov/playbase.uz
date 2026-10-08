from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PrinterDeviceViewSet, PrinterAgentPollView,
    PrinterAgentAckView, PrinterTestPrintView
)

router = DefaultRouter()
router.register(r'devices', PrinterDeviceViewSet, basename='printer-devices')

urlpatterns = [
    # Agent APIs (Local background client)
    path('agent/poll/', PrinterAgentPollView.as_view(), name='printer-agent-poll'),
    path('agent/ack/', PrinterAgentAckView.as_view(), name='printer-agent-ack'),

    # Web Manager APIs
    path('devices/<uuid:pk>/test-print/', PrinterTestPrintView.as_view(), name='printer-test-print'),
    path('', include(router.urls)),
]
