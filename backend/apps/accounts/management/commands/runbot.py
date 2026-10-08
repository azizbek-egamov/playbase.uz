import asyncio
import logging
import sys
from django.core.management.base import BaseCommand
from django.conf import settings
from aiogram import Bot, Dispatcher, Router, types
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart, Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.client.default import DefaultBotProperties

logger = logging.getLogger(__name__)

router = Router()

@router.message(CommandStart())
async def cmd_start(message: types.Message):
    from apps.accounts.models import User
    from asgiref.sync import sync_to_async

    user_first_name = message.from_user.first_name if message.from_user else "Foydalanuvchi"
    webapp_url = getattr(settings, 'TELEGRAM_WEBAPP_URL', 'http://127.0.0.1:5173')
    
    # Check if user is blocked in the system
    if message.from_user:
        is_blocked = await sync_to_async(
            lambda: User.objects.filter(telegram_id=message.from_user.id, is_active=False).exists()
        )()
        if is_blocked:
            block_keyboard = InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="ℹ️ Admin bilan bog'lanish (@playbase_support)",
                            url="https://t.me/playbase_support"
                        )
                    ]
                ]
            )
            await message.answer(
                f"⛔️ <b>Hisobingiz bloklangan!</b>\n\n"
                f"Hurmatli <b>{user_first_name}</b>, sizning PlayBase tizimidagi hisobingiz administrator tomonidan bloklangan.\n\n"
                f"Sababini bilish yoki hisobingizni qayta faollashtirish uchun rasmiy administrator bilan bog'laning:\n"
                f"👉 <b>@playbase_support</b>",
                reply_markup=block_keyboard,
                parse_mode="HTML"
            )
            return

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 PlayBase CRM-ni ochish",
                    web_app=WebAppInfo(url=webapp_url)
                )
            ],
            [
                InlineKeyboardButton(
                    text="📊 Tezkor Hisobot (Z-Report)",
                    callback_data="quick_report"
                ),
                InlineKeyboardButton(
                    text="ℹ️ Qo'llab-quvvatlash",
                    url="https://t.me/playbase_support"
                )
            ]
        ]
    )

    welcome_text = (
        f"Assalomu alaykum, <b>{user_first_name}</b>!\n\n"
        f"🎮 <b>PlayBase SaaS</b> — PlayStation klublar, bilyard va bowling markazlari uchun "
        f"avtomatlashtirilgan boshqaruv platformasi.\n\n"
        f"🔹 <i>Jonli stollar boshqaruvi (Vaqtbay & Limitli)</i>\n"
        f"🔹 <i>To'g'ridan-to'g'ri Bar POS kassasi</i>\n"
        f"🔹 <i>Avtomatlashtirilgan real-vaqt hisob-kitoblar</i>\n"
        f"🔹 <i>Moliyaviy hisobotlar va tahlillar</i>\n\n"
        f"Tizimga kirish uchun pastdagi <b>«PlayBase CRM-ni ochish»</b> tugmasini bosing 👇"
    )

    await message.answer(
        text=welcome_text,
        reply_markup=keyboard,
        parse_mode="HTML"
    )

@router.callback_query(lambda c: c.data == "quick_report")
async def cb_quick_report(callback: types.CallbackQuery):
    await callback.answer("Hisobot shakllantirilmoqda...", show_alert=False)
    webapp_url = getattr(settings, 'TELEGRAM_WEBAPP_URL', 'http://127.0.0.1:5173')
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📈 To'liq hisobotni ko'rish (Web-App)",
                    web_app=WebAppInfo(url=f"{webapp_url}?tab=analytics")
                )
            ]
        ]
    )
    
    await callback.message.answer(
        "📊 <b>Klub Real-Time Holati:</b>\n\n"
        "🟢 Barcha tizimlar barqaror ishlamoqda.\n"
        "⚡️ Barcha joriy seanslar, tushumlar va bar savdolari avtomatik hisoblanmoqda.\n\n"
        "<i>Batafsil ma'lumot va grafiklar uchun Web-Appga kiring:</i>",
        reply_markup=keyboard,
        parse_mode="HTML"
    )

@router.message(Command("help"))
async def cmd_help(message: types.Message):
    await message.answer(
        "💡 <b>PlayBase Bot Buyruqlari:</b>\n\n"
        "/start - WebApp tizimini ishga tushirish\n"
        "/report - Tezkor hisobot olish\n"
        "/help - Yordam va ma'lumotlar\n",
        parse_mode="HTML"
    )

class Command(BaseCommand):
    help = "PlayBase Telegram Botni Django management command orqali ishga tushirish"

    def handle(self, *args, **options):
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
        if not bot_token:
            self.stderr.write(self.style.ERROR("TELEGRAM_BOT_TOKEN Django sozlamalarida topilmadi!"))
            return

        webapp_url = getattr(settings, 'TELEGRAM_WEBAPP_URL', 'http://127.0.0.1:5173')
        self.stdout.write(self.style.SUCCESS(f"PlayBase Telegram Bot ishga tushirilmoqda..."))
        self.stdout.write(self.style.SUCCESS(f"Web-App URL: {webapp_url}"))

        async def run():
            bot = Bot(
                token=bot_token,
                default=DefaultBotProperties(parse_mode=ParseMode.HTML)
            )
            dp = Dispatcher()
            dp.include_router(router)
            
            try:
                await bot.delete_webhook(drop_pending_updates=True)
                await dp.start_polling(bot)
            finally:
                await bot.session.close()

        try:
            asyncio.run(run())
        except (KeyboardInterrupt, SystemExit):
            self.stdout.write(self.style.WARNING("Bot to'xtatildi."))
