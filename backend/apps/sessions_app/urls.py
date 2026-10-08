from django.urls import path
from .views import (
    LiveTablesStatusView, SessionStartView, SessionStopView,
    SessionExtendView, SessionTransferView, SessionOrderAddView,
    SessionOrderRemoveView, SessionHistoryListView
)

urlpatterns = [
    path('tables/status/', LiveTablesStatusView.as_view(), name='tables_status'),
    path('sessions/start/', SessionStartView.as_view(), name='session_start'),
    path('sessions/<uuid:pk>/stop/', SessionStopView.as_view(), name='session_stop'),
    path('sessions/<uuid:pk>/extend/', SessionExtendView.as_view(), name='session_extend'),
    path('sessions/<uuid:pk>/transfer/', SessionTransferView.as_view(), name='session_transfer'),
    path('sessions/<uuid:pk>/orders/', SessionOrderAddView.as_view(), name='session_order_add'),
    path('sessions/<uuid:pk>/orders/<uuid:order_id>/', SessionOrderRemoveView.as_view(), name='session_order_remove'),
    path('sessions/history/', SessionHistoryListView.as_view(), name='session_history'),
]
