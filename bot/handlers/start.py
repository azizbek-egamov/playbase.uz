from aiogram import Router, types
from aiogram.filters import CommandStart, Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from bot.config import WEBAPP_URL

router = Router()

@router.message(CommandStart())
async def cmd_start(message: types.Message):
    user_first_name = message.from_user.first_name if message.from_user else "Foydalanuvchi"
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 PlayBase CRM-ni ochish",
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            ],
            [
                InlineKeyboardButton(
                    text="📊 Bugungi hisobot (Z-Report)",
                    callback_data="daily_report"
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
        f"🎮 <b>PlayBase SaaS</b> — PlayStation klublar, bilyard va game-zonalar uchun "
        f"zamonaviy boshqaruv tizimiga xush kelibsiz!\n\n"
        f"🔹 <i>Jonli stollar nazorati (Sekundomer & Limit)</i>\n"
        f"🔹 <i>To'g'ridan-to'g'ri Bar POS kassasi</i>\n"
        f"🔹 <i>Avtomatlashtirilgan real-vaqt hisob-kitoblar</i>\n"
        f"🔹 <i>Vizual analitika va grafiklar</i>\n\n"
        f"Klubingizni boshqarish uchun pastdagi tugmani bosing 👇"
    )

    await message.answer(
        text=welcome_text,
        reply_markup=keyboard,
        parse_mode="HTML"
    )

@router.callback_query(lambda c: c.data == "daily_report")
async def cb_daily_report(callback: types.CallbackQuery):
    await callback.answer("Bugungi hisobot tayyorlanmoqda...", show_alert=False)
    await callback.message.answer(
        "📊 <b>Bugungi Klub Statistikasi:</b>\n\n"
        "🎮 Faol stollar: <b>3 ta</b>\n"
        "💰 Jami tushum: <b>780,000 UZS</b>\n"
        "⏱ O'yin vaqti: <b>520,000 UZS</b>\n"
        "🍹 Bar savdosi: <b>260,000 UZS</b>\n"
        "👥 Yopilgan seanslar: <b>14 ta</b>\n\n"
        "<i>Batafsil ma'lumotlar uchun WebApp tizimiga kiring.</i>",
        parse_mode="HTML"
    )

@router.message(Command("help"))
async def cmd_help(message: types.Message):
    await message.answer(
        "💡 <b>PlayBase Bot Buyruqlari:</b>\n\n"
        "/start - WebApp tizimini ishga tushirish\n"
        "/help - Yordam va qo'llanma\n"
        "/report - Kunlik hisobotni olish\n",
        parse_mode="HTML"
    )
