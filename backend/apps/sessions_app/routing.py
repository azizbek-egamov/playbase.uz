from django.urls import re_path
from .consumers import ClubLiveConsumer

websocket_urlpatterns = [
    re_path(r'^ws/club/(?P<club_id>[0-9a-f-]+)/$', ClubLiveConsumer.as_asgi()),
]
