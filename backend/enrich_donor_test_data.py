import os
import django
from decimal import Decimal
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Donor, Donation, PaymentOrder

# 1. Enrich Eleanor Vance test data
ev_donor = Donor.objects.filter(donor_id=12).first()
if ev_donor:
    # Check if pending donation already exists
    pending_ev = Donation.objects.filter(donor=ev_donor, payment_status='Pending').first()
    if not pending_ev:
        pending_ev = Donation.objects.create(
            donor=ev_donor,
            donation_type='Money',
            amount=Decimal('2500.00'),
            purpose='Festival Celebrations & Sweet Distribution',
            receipt_number=None,
            payment_method='Razorpay UPI',
            payment_status='Pending',
            razorpay_order_id='order_pending_ev01',
            razorpay_payment_id=None,
            donation_date=date(2026, 10, 19),
            status='Pending Payment',
            message='Pending payment authorization via UPI intent'
        )
        print('Created Eleanor Vance Pending Donation ID:', pending_ev.donation_id)
    else:
        print('Eleanor Vance Pending Donation already exists ID:', pending_ev.donation_id)

    # Check if refunded donation already exists
    refunded_ev = Donation.objects.filter(donor=ev_donor, payment_status='Refunded').first()
    if not refunded_ev:
        refunded_ev = Donation.objects.create(
            donor=ev_donor,
            donation_type='Money',
            amount=Decimal('1000.00'),
            purpose='Emergency Medical Aid (Duplicate Charge Refunded)',
            receipt_number=None,
            payment_method='Razorpay NetBanking',
            payment_status='Refunded',
            razorpay_order_id='order_refund_ev02',
            razorpay_payment_id='pay_refunded_ev02',
            donation_date=date(2026, 10, 1),
            status='Refunded',
            message='Duplicate transaction refunded to source account on 2026-10-02'
        )
        print('Created Eleanor Vance Refunded Donation ID:', refunded_ev.donation_id)
    else:
        print('Eleanor Vance Refunded Donation already exists ID:', refunded_ev.donation_id)

# 2. Enrich Anita Desai test data
anita_donor = Donor.objects.filter(donor_id=6).first()
if anita_donor:
    # Update item 41
    Donation.objects.filter(donation_id=41).update(
        item_category='Clothing Donation',
        item_name='Children Winter Sweaters & Woolen Caps',
        item_description='25 sets of hand-knitted woolen sweaters and warm caps for ages 5-10',
        quantity=Decimal('25.00'),
        unit='sets',
        delivery_option='Pickup',
        collection_status='Collected',
        receipt_number='HN-ACK-041',
        purpose='In-Kind Support: Winter Clothing Drive',
        donation_date=date(2026, 7, 25),
        status='Received'
    )
    # Update item 51
    Donation.objects.filter(donation_id=51).update(
        item_category='Books and Educational Materials',
        item_name='Mathematics Workbooks & Science Kits',
        item_description='40 comprehensive STEM practice workbooks and interactive experiment kits',
        quantity=Decimal('40.00'),
        unit='pcs',
        delivery_option='Direct Delivery',
        collection_status='In Orphanage Inventory',
        receipt_number='HN-ACK-051',
        purpose='In-Kind Support: STEM Education',
        donation_date=date(2026, 8, 14),
        status='Received'
    )
    # Update item 61
    Donation.objects.filter(donation_id=61).update(
        item_category='Food Donation',
        item_name='Baby Formula & Nutrition Cereals',
        item_description='15 boxes of infant nutrition formulas and high-protein fortified cereal',
        quantity=Decimal('15.00'),
        unit='boxes',
        delivery_option='Pickup',
        collection_status='Scheduled',
        receipt_number='HN-ACK-061',
        purpose='In-Kind Support: Infant Nutrition',
        donation_date=date(2026, 9, 10),
        status='Scheduled'
    )
    # Update money 70
    Donation.objects.filter(donation_id=70).update(
        amount=Decimal('1000.00'),
        purpose='General Child Welfare & Health Checkups',
        payment_method='Razorpay UPI',
        payment_status='Successful',
        razorpay_order_id='order_anita_70',
        razorpay_payment_id='pay_anita_70',
        receipt_number='HN-REC-070',
        donation_date=date(2026, 9, 20),
        status='Received'
    )
    # Check if failed donation already exists for Anita
    failed_anita = Donation.objects.filter(donor=anita_donor, payment_status='Failed').first()
    if not failed_anita:
        failed_anita = Donation.objects.create(
            donor=anita_donor,
            donation_type='Money',
            amount=Decimal('500.00'),
            purpose='Educational Supplies & Art Materials',
            receipt_number=None,
            payment_method='Razorpay Debit Card',
            payment_status='Failed',
            razorpay_order_id='order_failed_ad01',
            razorpay_payment_id=None,
            donation_date=date(2026, 10, 11),
            status='Failed Payment',
            message='Card authentication timed out on payment gateway'
        )
        print('Created Anita Desai Failed Donation ID:', failed_anita.donation_id)
    else:
        print('Anita Desai Failed Donation already exists ID:', failed_anita.donation_id)

print('Enrichment complete.')
