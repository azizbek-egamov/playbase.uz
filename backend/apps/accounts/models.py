import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    telegram_id = models.BigIntegerField(unique=True, null=True, blank=True, db_index=True)
    phone_number = models.CharField(max_length=30, null=True, blank=True)
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    is_owner = models.BooleanField(default=False)
    language = models.CharField(max_length=10, default='uz')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username or str(self.telegram_id)}"
