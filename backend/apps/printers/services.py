from decimal import Decimal
from django.utils import timezone
from .models import PrintJob, PrintJobType, PrintJobStatus, PrinterDevice

def format_price(amount):
    try:
        return f"{int(Decimal(str(amount))):,}".replace(",", " ")
    except Exception:
        return str(amount)

def create_bar_sale_print_job(bar_sale, cashier_name=None):
    """
    Bar tezkor kassa savdosi uchun chek yaratish.
    """
    club = bar_sale.club
    items_data = []
    for item in bar_sale.items.select_related('product').all():
        items_data.append({
            "name": item.product.name,
            "quantity": item.quantity,
            "price": format_price(item.unit_price),
            "total": format_price(item.total_price),
        })

    receipt_data = {
        "club_name": club.name,
        "club_phone": club.phone or "",
        "club_address": club.address or "",
        "receipt_no": str(bar_sale.id)[:8].upper(),
        "type": "BAR_SALE",
        "title": "BAR SAVDOSI CHEKI",
        "date_time": timezone.localtime(bar_sale.created_at).strftime("%d.%m.%Y %H:%M"),
        "cashier": cashier_name or (bar_sale.created_by.get_full_name() if bar_sale.created_by else "Kassir"),
        "customer_name": bar_sale.customer_name or "",
        "items": items_data,
        "subtotal": format_price(bar_sale.total_amount + bar_sale.discount_amount),
        "discount": format_price(bar_sale.discount_amount),
        "total": format_price(bar_sale.total_amount),
        "currency": club.currency or "UZS",
        "payment_type": bar_sale.get_payment_type_display(),
        "footer_text": "Xaridingiz uchun rahmat!",
    }

    job = PrintJob.objects.create(
        club=club,
        job_type=PrintJobType.BAR_SALE,
        title=f"Bar Cheki #{str(bar_sale.id)[:8]}",
        receipt_data=receipt_data,
        status=PrintJobStatus.PENDING
    )
    return job

def create_session_print_job(session, cashier_name=None):
    """
    O'yin seansi yakunlanganda kassa cheki yaratish.
    """
    club = session.club
    table = session.table

    # Format durations
    duration_str = "00:00"
    if session.start_time and session.end_time:
        diff_seconds = int((session.end_time - session.start_time).total_seconds())
        hrs = diff_seconds // 3600
        mins = (diff_seconds % 3600) // 60
        duration_str = f"{hrs:02d}:{mins:02d}"

    bar_items_data = []
    for order in session.orders.select_related('product').all():
        bar_items_data.append({
            "name": order.product.name,
            "quantity": order.quantity,
            "price": format_price(order.unit_price),
            "total": format_price(order.total_price),
        })

    receipt_data = {
        "club_name": club.name,
        "club_phone": club.phone or "",
        "club_address": club.address or "",
        "receipt_no": str(session.id)[:8].upper(),
        "type": "SESSION_RECEIPT",
        "title": f"STOL #{table.number} - {table.name}",
        "zone_name": table.zone.name if table.zone else "Standart",
        "date_time": timezone.localtime(session.end_time or timezone.now()).strftime("%d.%m.%Y %H:%M"),
        "start_time": timezone.localtime(session.start_time).strftime("%H:%M") if session.start_time else "",
        "end_time": timezone.localtime(session.end_time).strftime("%H:%M") if session.end_time else "",
        "duration": duration_str,
        "customer_name": session.customer_name or "",
        "cashier": cashier_name or (session.created_by.get_full_name() if session.created_by else "Admin"),
        "time_amount": format_price(session.time_amount),
        "bar_amount": format_price(session.bar_amount),
        "bar_items": bar_items_data,
        "discount": format_price(session.discount_amount),
        "total": format_price(session.final_amount or session.total_amount),
        "currency": club.currency or "UZS",
        "payment_type": session.get_payment_type_display() if hasattr(session, 'get_payment_type_display') else "Naqd",
        "footer_text": "PlayBase bilan maroqli hordiq!",
    }

    job = PrintJob.objects.create(
        club=club,
        job_type=PrintJobType.SESSION_RECEIPT,
        title=f"Stol #{table.number} Cheki",
        receipt_data=receipt_data,
        status=PrintJobStatus.PENDING
    )
    return job

def create_test_print_job(device):
    """
    Printer apparatini tekshirish uchun test cheki.
    """
    club = device.club
    receipt_data = {
        "club_name": club.name,
        "club_phone": club.phone or "+998 90 000 00 00",
        "receipt_no": "TEST-001",
        "type": "TEST",
        "title": "PLAYBASE TEST CHEKI",
        "date_time": timezone.localtime(timezone.now()).strftime("%d.%m.%Y %H:%M:%S"),
        "printer_name": device.name,
        "paper_width": f"{device.paper_width} mm",
        "items": [
            {"name": "PlayStation 5 (1 soat)", "quantity": 1, "price": "40 000", "total": "40 000"},
            {"name": "Coca-Cola 0.5L", "quantity": 2, "price": "8 000", "total": "16 000"},
            {"name": "Lays Chips 140g", "quantity": 1, "price": "18 000", "total": "18 000"},
        ],
        "total": "74 000",
        "currency": "UZS",
        "footer_text": "Chek apparati muvaffaqiyatli ulandi!",
    }

    job = PrintJob.objects.create(
        club=club,
        device=device,
        job_type=PrintJobType.TEST,
        title=f"Test Chek - {device.name}",
        receipt_data=receipt_data,
        status=PrintJobStatus.PENDING
    )
    return job
