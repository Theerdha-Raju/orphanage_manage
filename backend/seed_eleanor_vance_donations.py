import os
import django
from decimal import Decimal
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Users, Login, Donor, Donation, PaymentOrder

def seed_eleanor_vance():
    print("=== Seeding Donor Profile & Donations for Eleanor Vance ===")
    
    # 1. Update/Ensure Users record
    user = Users.objects.filter(full_name='Eleanor Vance').first()
    if not user:
        user = Users.objects.create(
            full_name='Eleanor Vance',
            phone_number='9800000003',
            gender='Female',
            address='42 Philanthropy Way, Indiranagar, Bengaluru, Karnataka 560038',
            designation='donor',
            status='Active'
        )
    else:
        user.designation = 'donor'
        user.address = '42 Philanthropy Way, Indiranagar, Bengaluru, Karnataka 560038'
        user.save()
    print(f"Users Record: ID {user.user_id}, Name: {user.full_name}")

    # 2. Ensure Login accounts
    l1, _ = Login.objects.get_or_create(
        email='donor@orphanage.com',
        defaults={'password': 'Donor@123', 'role': 'donor', 'status': 'Active', 'user': user}
    )
    l1.role = 'donor'
    l1.user = user
    l1.save()

    l2, _ = Login.objects.get_or_create(
        email='eleanor.vance@orphanage.com',
        defaults={'password': 'Donor@123', 'role': 'donor', 'status': 'Active', 'user': user}
    )
    l2.role = 'donor'
    l2.user = user
    l2.save()
    print("Logins synchronized for donor@orphanage.com and eleanor.vance@orphanage.com")

    # 3. Create or update Donor table entry
    donor = Donor.objects.filter(full_name='Eleanor Vance').first()
    if not donor:
        donor = Donor.objects.filter(email='donor@orphanage.com').first()
    if not donor:
        donor = Donor.objects.filter(email='eleanor.vance@orphanage.com').first()
        
    if not donor:
        donor = Donor.objects.create(
            full_name='Eleanor Vance',
            email='donor@orphanage.com',
            phone_number='9800000003',
            address='42 Philanthropy Way, Indiranagar, Bengaluru, Karnataka 560038',
            status='Active'
        )
    else:
        donor.full_name = 'Eleanor Vance'
        donor.email = 'donor@orphanage.com'
        donor.phone_number = '9800000003'
        donor.address = '42 Philanthropy Way, Indiranagar, Bengaluru, Karnataka 560038'
        donor.status = 'Active'
        donor.save()
    print(f"Donor Table Entry: ID {donor.donor_id}, Name: {donor.full_name}, Email: {donor.email}")

    # Remove existing dummy/incomplete donations for Eleanor to reseed cleanly
    PaymentOrder.objects.filter(donor=donor).delete()
    PaymentOrder.objects.filter(razorpay_order_id__startswith='order_Nzk1EV').delete()
    Donation.objects.filter(donor=donor).delete()

    # 4. Monetary Donations (Razorpay Online Transfers with 80G Receipts)
    monetary_donations = [
        {
            'amount': Decimal('25000.00'),
            'purpose': 'Education & School Tuition Sponsorship',
            'receipt': 'HN-REC-2026-1081',
            'method': 'Razorpay UPI (GPay)',
            'order_id': 'order_Nzk1EV001',
            'payment_id': 'pay_Nzk1Vance001',
            'sig': 'sig_vance_verified_001',
            'date': date(2026, 9, 15),
            'notes': 'Higher secondary schooling fees, STEM laboratory pass, and study textbooks for middle school children.'
        },
        {
            'amount': Decimal('15000.00'),
            'purpose': 'Child Healthcare & Annual Health Checkups',
            'receipt': 'HN-REC-2026-1082',
            'method': 'Razorpay NetBanking (HDFC Bank)',
            'order_id': 'order_Nzk1EV002',
            'payment_id': 'pay_Nzk1Vance002',
            'sig': 'sig_vance_verified_002',
            'date': date(2026, 8, 20),
            'notes': 'Comprehensive pediatric health screening, dental checkups, and nutritional supplements.'
        },
        {
            'amount': Decimal('50000.00'),
            'purpose': 'Infrastructure & Clean Solar Energy Project',
            'receipt': 'HN-REC-2026-1083',
            'method': 'Razorpay Credit Card (VISA)',
            'order_id': 'order_Nzk1EV003',
            'payment_id': 'pay_Nzk1Vance003',
            'sig': 'sig_vance_verified_003',
            'date': date(2026, 6, 10),
            'notes': 'Rooftop solar panel project contribution to ensure 24/7 sustainable power for the orphanage campus.'
        },
        {
            'amount': Decimal('10000.00'),
            'purpose': 'Nutrition & Daily Balanced Meals',
            'receipt': 'HN-REC-2026-1084',
            'method': 'Razorpay UPI (PhonePe)',
            'order_id': 'order_Nzk1EV004',
            'payment_id': 'pay_Nzk1Vance004',
            'sig': 'sig_vance_verified_004',
            'date': date(2026, 10, 5),
            'notes': 'Monthly contribution for fresh milk, high-protein pulses, and seasonal orchard fruits.'
        },
        {
            'amount': Decimal('5000.00'),
            'purpose': 'Festive Celebration & Children Welfare',
            'receipt': 'HN-REC-2026-1085',
            'method': 'Razorpay Debit Card',
            'order_id': 'order_Nzk1EV005',
            'payment_id': 'pay_Nzk1Vance005',
            'sig': 'sig_vance_verified_005',
            'date': date(2026, 10, 18),
            'notes': 'Diwali festival gifts, new attire accessories, and festive dinner banquet for all kids.'
        },
    ]

    for m in monetary_donations:
        d = Donation.objects.create(
            donor=donor,
            donation_type='Money',
            amount=m['amount'],
            purpose=m['purpose'],
            receipt_number=m['receipt'],
            payment_method=m['method'],
            payment_status='Successful',
            razorpay_order_id=m['order_id'],
            razorpay_payment_id=m['payment_id'],
            razorpay_signature=m['sig'],
            donation_date=m['date'],
            status='Received',
            message=m['notes']
        )
        PaymentOrder.objects.create(
            razorpay_order_id=m['order_id'],
            donor=donor,
            donor_name=donor.full_name,
            donor_email=donor.email,
            donor_phone=donor.phone_number,
            amount=m['amount'],
            currency='INR',
            purpose=m['purpose'],
            message=m['notes'],
            status='Successful',
            razorpay_payment_id=m['payment_id'],
            razorpay_signature=m['sig'],
            donation=d
        )
        print(f"Created Monetary Donation: {m['receipt']} - Rs. {m['amount']} ({m['purpose']})")

    # 5. In-Kind / Non-Monetary Donations (Items)
    item_donations = [
        {
            'type': 'Clothing Donation',
            'category': 'Clothing Donation',
            'item_name': 'Winter Sweaters, Jackets & Cardigans',
            'qty': Decimal('50.00'),
            'unit': 'pcs',
            'delivery': 'Orphanage Pickup',
            'address': '42 Philanthropy Way, Indiranagar, Bengaluru',
            'collection_status': 'In Orphanage Inventory',
            'receipt': 'HN-ACK-2026-0031',
            'date': date(2026, 10, 12),
            'notes': '50 pcs assorted warm knitted sweaters and insulated windbreakers for ages 6-16.'
        },
        {
            'type': 'Books and Educational Materials',
            'category': 'Books and Educational Materials',
            'item_name': 'NCERT STEM & Science Reference Textbooks',
            'qty': Decimal('120.00'),
            'unit': 'books',
            'delivery': 'Direct Drop-off',
            'address': 'HopeNest Central Library Wing, Bengaluru Campus',
            'collection_status': 'In Orphanage Inventory',
            'receipt': 'HN-ACK-2026-0032',
            'date': date(2026, 9, 28),
            'notes': '120 curriculum-approved Mathematics, Physics, and English reference readers.'
        },
        {
            'type': 'Food Donation',
            'category': 'Food Donation',
            'item_name': 'Nutrition Dry Fruits & Protein Supplements',
            'qty': Decimal('25.00'),
            'unit': 'kg',
            'delivery': 'Orphanage Pickup',
            'address': '42 Philanthropy Way, Indiranagar, Bengaluru',
            'collection_status': 'Collected',
            'receipt': 'HN-ACK-2026-0033',
            'date': date(2026, 10, 14),
            'notes': '25 kg vacuum-sealed premium California almonds, walnuts, and children nutrition malt.'
        },
        {
            'type': 'Books and Educational Materials',
            'category': 'Books and Educational Materials',
            'item_name': 'Art & Drawing Kits with Sketchbooks',
            'qty': Decimal('30.00'),
            'unit': 'kits',
            'delivery': 'Direct Drop-off',
            'address': 'HopeNest Activity and Recreation Room',
            'collection_status': 'In Orphanage Inventory',
            'receipt': 'HN-ACK-2026-0034',
            'date': date(2026, 8, 15),
            'notes': '30 complete art kits including Faber-Castell watercolor sets, oil pastels, and sketchpads.'
        },
        {
            'type': 'Medical Supplies',
            'category': 'Medical Supplies',
            'item_name': 'Pediatric First-Aid Kits & Digital Thermometers',
            'qty': Decimal('15.00'),
            'unit': 'kits',
            'delivery': 'Courier / Delivery',
            'address': 'HopeNest Health Clinic & Medical Dispensary',
            'collection_status': 'In Orphanage Inventory',
            'receipt': 'HN-ACK-2026-0035',
            'date': date(2026, 7, 22),
            'notes': '15 clinical grade first aid containers, digital infrared thermometers, and antiseptic gauze.'
        },
    ]

    for itm in item_donations:
        Donation.objects.create(
            donor=donor,
            donation_type=itm['type'],
            amount=None,
            item_description=f"{int(itm['qty'])} {itm['unit']} of {itm['item_name']}",
            item_category=itm['category'],
            item_name=itm['item_name'],
            quantity=itm['qty'],
            unit=itm['unit'],
            delivery_option=itm['delivery'],
            delivery_address=itm['address'],
            collection_status=itm['collection_status'],
            purpose=f"In-Kind Support: {itm['category']}",
            receipt_number=itm['receipt'],
            payment_method='In-Kind / Physical Fulfillment',
            payment_status='N/A',
            donation_date=itm['date'],
            status='Received',
            message=itm['notes']
        )
        print(f"Created Item Contribution: {itm['receipt']} - {itm['qty']} {itm['unit']} {itm['item_name']}")

    total_money = sum(m['amount'] for m in monetary_donations)
    print("\n=== Seeding Completed Successfully! ===")
    print(f"Total Donated by Eleanor Vance: Rs. {total_money:,}")
    print(f"Monetary Donations with 80G Receipts: {len(monetary_donations)}")
    print(f"In-Kind Item Contributions: {len(item_donations)}")
    print(f"Total Donations: {len(monetary_donations) + len(item_donations)}")

if __name__ == '__main__':
    seed_eleanor_vance()
