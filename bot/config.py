import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8631087984:AAE3qIHNe1NIsrug38NXC3cMrovV8shVI48")
WEBAPP_URL = os.getenv("TELEGRAM_WEBAPP_URL", "http://127.0.0.1:5173")
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://127.0.0.1:8000/api/v1")

