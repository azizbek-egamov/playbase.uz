import logging
from aiogram import Bot
from bot.config import BOT_TOKEN

logger = logging.getLogger(__name__)

async def send_timer_warning(bot: Bot, chat_id: int, table_name: str, minutes_left: int):
    """
    Send notification to cashier when table session time is almost up
    """
    text = (
        f"⚠️ <b>DIQQAT: Vaqt tugamoqda!</b>\n\n"
        f"🎮 Stol: <b>{table_name}</b>\n"
        f"⏳ Qolgan vaqt: <b>{minutes_left} daqiqa</b>\n\n"
        f"<i>Mijozdan vaqtni uzaytirishini so'rang yoki seansni yopishga tayyorlaning.</i>"
    )
    try:
        await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")
    except Exception as e:
        logger.error(f"Failed to send timer warning to {chat_id}: {e}")

async def send_daily_z_report(bot: Bot, chat_id: int, club_name: str, data: dict):
    """
    Send end-of-day Z-Report summary to Club Owner
    """
    text = (
        f"📊 <b>KUNLIK Z-HISOBOT | {club_name}</b>\n\n"
        f"💰 Jami tushum: <b>{(data.get('total_revenue', 0)):,} UZS</b>\n"
        f"⏱ O'yin vaqti: <b>{(data.get('time_revenue', 0)):,} UZS</b>\n"
        f"🍹 Bar savdosi: <b>{(data.get('bar_revenue', 0)):,} UZS</b>\n"
        f"💵 Naqd: <b>{(data.get('cash_amount', 0)):,} UZS</b>\n"
        f"💳 Karta / Click: <b>{(data.get('card_amount', 0)):,} UZS</b>\n"
        f"👥 Xizmat ko'rsatilgan seanslar: <b>{data.get('total_sessions', 0)} ta</b>\n\n"
        f"✅ <i>Kassa smenasi muvaffaqiyatli topshirildi.</i>"
    )
    try:
        await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")
    except Exception as e:
        logger.error(f"Failed to send Z-Report to {chat_id}: {e}")
