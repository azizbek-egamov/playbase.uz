import os
import sys
import django
from datetime import timedelta
from decimal import Decimal

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.accounts.models import User
from apps.clubs.models import SubscriptionPlan, Club, ClubMember, ClubMemberRole, Zone, GameTable, TableStatus
from apps.products.models import ProductCategory, Product
from apps.sessions_app.models import Session, SessionOrderItem, SessionStatus, PaymentType

import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def seed():
    print("[*] Seeding PlayBase demo data...")

    # 1. SaaS Subscription Plans
    plan_start, _ = SubscriptionPlan.objects.get_or_create(
        code='starter',
        defaults={
            'name': 'Start',
            'price_per_month': Decimal('190000.00'),
            'max_tables': 10,
            'max_staff': 2,
            'features_json': {
                'twa_access': True,
                'bar_sales': True,
                'analytics': 'basic'
            }
        }
    )

    plan_pro, _ = SubscriptionPlan.objects.get_or_create(
        code='pro',
        defaults={
            'name': 'Pro Club',
            'price_per_month': Decimal('390000.00'),
            'max_tables': 25,
            'max_staff': 5,
            'features_json': {
                'twa_access': True,
                'bar_sales': True,
                'analytics': 'advanced',
                'telegram_alerts': True
            }
        }
    )

    plan_ultra, _ = SubscriptionPlan.objects.get_or_create(
        code='ultra',
        defaults={
            'name': 'Ultra Lounge',
            'price_per_month': Decimal('690000.00'),
            'max_tables': 100,
            'max_staff': 20,
            'features_json': {
                'twa_access': True,
                'bar_sales': True,
                'analytics': 'full_enterprise',
                'telegram_alerts': True,
                'custom_domain': True
            }
        }
    )
    print("✅ SaaS Subscription plans created.")

    # 2. Demo Owner User
    user, _ = User.objects.get_or_create(
        telegram_id=123456789,
        defaults={
            'username': 'cyber_admin',
            'first_name': 'Sardor',
            'last_name': 'Karimov',
            'phone_number': '+998901234567',
            'is_owner': True,
            'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
        }
    )
    user.set_password('admin123')
    user.save()

    # 3. Demo Club
    club, _ = Club.objects.get_or_create(
        name='Cyber Lounge Toshkent',
        owner=user,
        defaults={
            'address': 'Toshkent sh., Yunusobod tumani, Amir Temur ko\'chasi 45',
            'phone': '+998901234567',
            'currency': 'UZS',
            'rounding_unit': 500,
            'active_plan': plan_pro,
            'plan_expires_at': timezone.now() + timedelta(days=28),
            'is_trial': False,
            'is_active': True,
            'logo_url': 'https://images.unsplash.com/photo-1612287233207-6b4515570fb0?w=200&auto=format&fit=crop&q=80'
        }
    )

    # 4. Club Member
    ClubMember.objects.get_or_create(
        club=club,
        user=user,
        defaults={'role': ClubMemberRole.OWNER, 'is_active': True}
    )

    # 5. Zones
    z_ps5_vip, _ = Zone.objects.get_or_create(
        club=club,
        name='PlayStation 5 VIP',
        defaults={
            'hourly_rate': Decimal('45000.00'),
            'color_code': '#f59e0b',
            'icon': 'sports_esports',
            'order': 1
        }
    )

    z_standart, _ = Zone.objects.get_or_create(
        club=club,
        name='Standart Zal (PS5)',
        defaults={
            'hourly_rate': Decimal('25000.00'),
            'color_code': '#10b981',
            'icon': 'gamepad',
            'order': 2
        }
    )

    z_billiard, _ = Zone.objects.get_or_create(
        club=club,
        name='Billiard VIP',
        defaults={
            'hourly_rate': Decimal('50000.00'),
            'color_code': '#3b82f6',
            'icon': 'sports_tennis',
            'order': 3
        }
    )

    # 6. Tables
    tables_data = [
        (z_ps5_vip, 'VIP 1 (PlayStation 5)', 1, TableStatus.OCCUPIED),
        (z_ps5_vip, 'VIP 2 (PlayStation 5)', 2, TableStatus.IDLE),
        (z_ps5_vip, 'VIP 3 (PlayStation 5)', 3, TableStatus.OCCUPIED),
        (z_standart, 'Stol #1 (PS5 Standard)', 4, TableStatus.OCCUPIED),
        (z_standart, 'Stol #2 (PS5 Standard)', 5, TableStatus.IDLE),
        (z_standart, 'Stol #3 (PS5 Standard)', 6, TableStatus.IDLE),
        (z_standart, 'Stol #4 (PS5 Standard)', 7, TableStatus.MAINTENANCE),
        (z_standart, 'Stol #5 (PS5 Standard)', 8, TableStatus.IDLE),
        (z_billiard, 'Billiard Stol #1', 9, TableStatus.OCCUPIED),
        (z_billiard, 'Billiard Stol #2', 10, TableStatus.IDLE),
    ]

    table_objs = {}
    for zone, name, num, status in tables_data:
        t, _ = GameTable.objects.get_or_create(
            club=club,
            number=num,
            defaults={
                'zone': zone,
                'name': name,
                'status': status,
                'order': num
            }
        )
        t.status = status
        t.save(update_fields=['status'])
        table_objs[num] = t

    print(f"✅ Zones and {len(tables_data)} tables created.")

    # 7. Bar Categories and Products
    cat_drinks, _ = ProductCategory.objects.get_or_create(club=club, name='Ichimliklar', defaults={'icon': 'local_bar', 'order': 1})
    cat_snacks, _ = ProductCategory.objects.get_or_create(club=club, name='Snacklar & Chips', defaults={'icon': 'fastfood', 'order': 2})
    cat_smoke, _ = ProductCategory.objects.get_or_create(club=club, name='Kalyan & Qo\'shimchalar', defaults={'icon': 'smoking_rooms', 'order': 3})

    products_data = [
        (cat_drinks, 'Flash Energy 0.5L', Decimal('8000.00'), Decimal('15000.00'), 48),
        (cat_drinks, 'Red Bull 0.25L', Decimal('18000.00'), Decimal('30000.00'), 24),
        (cat_drinks, 'Coca-Cola 0.5L', Decimal('6000.00'), Decimal('12000.00'), 60),
        (cat_drinks, 'Nestle Suv 0.5L', Decimal('2000.00'), Decimal('5000.00'), 100),
        (cat_drinks, 'Americano Kofe', Decimal('4000.00'), Decimal('15000.00'), 50),
        (cat_snacks, 'Lays Pishloqli 140g', Decimal('12000.00'), Decimal('22000.00'), 30),
        (cat_snacks, 'Doritos Nacho 110g', Decimal('14000.00'), Decimal('25000.00'), 25),
        (cat_snacks, 'Pista & Bodom to\'plami', Decimal('10000.00'), Decimal('20000.00'), 40),
    ]

    prod_objs = []
    for cat, name, cost, sell, stock in products_data:
        p, _ = Product.objects.get_or_create(
            club=club,
            name=name,
            defaults={
                'category': cat,
                'cost_price': cost,
                'selling_price': sell,
                'stock_quantity': stock,
                'is_available': True
            }
        )
        prod_objs.append(p)
    print(f"✅ {len(prod_objs)} Bar & Snack products created.")

    # 8. Active Sessions
    # Active Session 1: VIP 1 - 1 hr 45 min elapsed
    s1, _ = Session.objects.get_or_create(
        table=table_objs[1],
        status=SessionStatus.ACTIVE,
        defaults={
            'club': club,
            'started_by': user,
            'customer_name': 'Jasur aka (VIP)',
            'customer_phone': '+998931112233',
            'start_time': timezone.now() - timedelta(minutes=105),
            'is_open_ended': True,
            'applied_hourly_rate': Decimal('45000.00')
        }
    )
    SessionOrderItem.objects.get_or_create(session=s1, product=prod_objs[0], defaults={'quantity': 2, 'unit_price': prod_objs[0].selling_price, 'total_price': prod_objs[0].selling_price * 2, 'added_by': user})
    SessionOrderItem.objects.get_or_create(session=s1, product=prod_objs[5], defaults={'quantity': 1, 'unit_price': prod_objs[5].selling_price, 'total_price': prod_objs[5].selling_price, 'added_by': user})
    s1.bar_amount = (prod_objs[0].selling_price * 2) + prod_objs[5].selling_price
    s1.save()

    # Active Session 2: VIP 3 - Timed 2 hours (1 hr 10 min left)
    Session.objects.get_or_create(
        table=table_objs[3],
        status=SessionStatus.ACTIVE,
        defaults={
            'club': club,
            'started_by': user,
            'customer_name': 'FIFA Chempionat',
            'start_time': timezone.now() - timedelta(minutes=50),
            'planned_end_time': timezone.now() + timedelta(minutes=70),
            'is_open_ended': False,
            'duration_minutes': 120,
            'applied_hourly_rate': Decimal('45000.00')
        }
    )

    # Active Session 3: Stol #1 - 25 min elapsed
    Session.objects.get_or_create(
        table=table_objs[4],
        status=SessionStatus.ACTIVE,
        defaults={
            'club': club,
            'started_by': user,
            'customer_name': 'Bekzod',
            'start_time': timezone.now() - timedelta(minutes=25),
            'is_open_ended': True,
            'applied_hourly_rate': Decimal('25000.00')
        }
    )

    # Active Session 4: Billiard 1 - Timed 1 hour
    Session.objects.get_or_create(
        table=table_objs[9],
        status=SessionStatus.ACTIVE,
        defaults={
            'club': club,
            'started_by': user,
            'customer_name': 'Alisher va do\'stlari',
            'start_time': timezone.now() - timedelta(minutes=40),
            'planned_end_time': timezone.now() + timedelta(minutes=20),
            'is_open_ended': False,
            'duration_minutes': 60,
            'applied_hourly_rate': Decimal('50000.00')
        }
    )

    print("🎉 Seed data successfully created! Everything is ready for frontend and API integration.")

if __name__ == '__main__':
    seed()
