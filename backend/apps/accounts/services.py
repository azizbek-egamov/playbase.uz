import hmac
import hashlib
import json
import urllib.parse
from django.conf import settings
from .models import User

class TelegramAuthService:
    @staticmethod
    def validate_twa_init_data(init_data_str: str) -> dict | None:
        """
        Validates Telegram WebApp initData string using HMAC-SHA256.
        Returns parsed user dictionary if valid, None otherwise.
        """
        bot_token = settings.TELEGRAM_BOT_TOKEN
        if not init_data_str or not bot_token:
            return None

        try:
            parsed_data = dict(urllib.parse.parse_qsl(init_data_str, keep_blank_values=True))
            received_hash = parsed_data.pop('hash', None)
            if not received_hash:
                return None

            # Sort keys and join
            data_check_string = '\n'.join([f"{k}={v}" for k, v in sorted(parsed_data.items())])

            # Secret key: HMAC_SHA256("WebAppData", bot_token)
            secret_key = hmac.new(b"WebAppData", bot_token.encode('utf-8'), hashlib.sha256).digest()
            calculated_hash = hmac.new(secret_key, data_check_string.encode('utf-8'), hashlib.sha256).hexdigest()

            if calculated_hash != received_hash:
                # In development mode, allow dev fallback if configured
                if not settings.DEBUG:
                    return None

            user_raw = parsed_data.get('user')
            if user_raw:
                return json.loads(user_raw)
            return None
        except Exception:
            return None

    @staticmethod
    def validate_telegram_widget_data(data: dict) -> dict | None:
        """
        Validates Telegram Login Widget data dictionary using SHA256(bot_token) and HMAC-SHA256.
        """
        bot_token = settings.TELEGRAM_BOT_TOKEN
        if not data or not bot_token:
            return None

        try:
            data_dict = dict(data)
            received_hash = data_dict.pop('hash', None)
            if not received_hash:
                return None

            # Sort keys alphabetically and construct check string
            check_lines = []
            for k in sorted(data_dict.keys()):
                val = data_dict[k]
                if val is not None:
                    check_lines.append(f"{k}={val}")
            
            data_check_string = '\n'.join(check_lines)

            # Secret key: SHA256(bot_token)
            secret_key = hashlib.sha256(bot_token.encode('utf-8')).digest()
            calculated_hash = hmac.new(secret_key, data_check_string.encode('utf-8'), hashlib.sha256).hexdigest()

            if calculated_hash != received_hash:
                if not settings.DEBUG:
                    return None

            return {
                'id': data_dict.get('id'),
                'first_name': data_dict.get('first_name', ''),
                'last_name': data_dict.get('last_name', ''),
                'username': data_dict.get('username', ''),
                'photo_url': data_dict.get('photo_url', '')
            }
        except Exception as e:
            return None

    @staticmethod
    def get_or_create_telegram_user(user_data: dict, is_owner: bool = False) -> User:
        """
        Finds or creates a User based on Telegram data.
        """
        telegram_id = user_data.get('id')
        username = user_data.get('username') or f"tg_user_{telegram_id}"
        first_name = user_data.get('first_name', '')
        last_name = user_data.get('last_name', '')
        photo_url = user_data.get('photo_url', '')

        user, created = User.objects.get_or_create(
            telegram_id=telegram_id,
            defaults={
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
                'avatar_url': photo_url,
                'is_owner': is_owner,
            }
        )
        if not created:
            updated = False
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                updated = True
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                updated = True
            if photo_url and user.avatar_url != photo_url:
                user.avatar_url = photo_url
                updated = True
            if updated:
                user.save()
        return user
