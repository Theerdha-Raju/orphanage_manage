import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Expense

EXPENSES = [
    # Food
    {
        'title': 'Monthly Grocery & Fresh Produce',
        'category': 'Food',
        'amount': 48500.00,
        'expense_date': datetime.date(2026, 8, 12),
        'paid_by': 'Priya Nair',
        'description': 'Bulk grocery purchase from BigBasket Wholesale – rice (100 kg), dal (40 kg), cooking oil (30 L), vegetables and seasonal fruits for 30 children',
        'status': 'Paid',
    },
    {
        'title': 'Monthly Milk & Dairy Supply',
        'category': 'Food',
        'amount': 16800.00,
        'expense_date': datetime.date(2026, 8, 1),
        'paid_by': 'Priya Nair',
        'description': 'Daily milk delivery – 30 litres/day × 30 days from Amul authorized dairy vendor. Includes curd and paneer for protein diet',
        'status': 'Paid',
    },
    {
        'title': 'Festival Sweets & Special Meal – Eid',
        'category': 'Food',
        'amount': 8200.00,
        'expense_date': datetime.date(2026, 7, 7),
        'paid_by': 'Priya Nair',
        'description': 'Special celebration meal on Eid – biryani, halwa, and sweets for all 30 children and 12 staff members',
        'status': 'Paid',
    },

    # Medical
    {
        'title': 'Emergency Pediatric Medicines',
        'category': 'Medical',
        'amount': 12400.00,
        'expense_date': datetime.date(2026, 8, 8),
        'paid_by': 'Dr. Rajesh Sharma',
        'description': 'Pharmacy stock replenishment – antibiotics, paracetamol, ORS sachets, vitamin supplements and first aid materials for Wing B clinic',
        'status': 'Paid',
    },
    {
        'title': 'Quarterly Health Checkup Camp',
        'category': 'Medical',
        'amount': 9500.00,
        'expense_date': datetime.date(2026, 7, 22),
        'paid_by': 'Dr. Rajesh Sharma',
        'description': 'Doctor fees + diagnostics for Q2 health checkup: CBC blood tests, dental screening, and eye checkup for 21 children. Reports filed.',
        'status': 'Paid',
    },
    {
        'title': 'Dental Treatment – 4 Children',
        'category': 'Medical',
        'amount': 5600.00,
        'expense_date': datetime.date(2026, 8, 5),
        'paid_by': 'Dr. Rajesh Sharma',
        'description': 'Dental filling and tooth extraction for Rohit, Meera, Diya and Kabir at City Dental Clinic. Includes follow-up medication.',
        'status': 'Paid',
    },

    # Education
    {
        'title': 'School Uniforms & Backpacks (Class 4–6)',
        'category': 'Education',
        'amount': 32000.00,
        'expense_date': datetime.date(2026, 8, 2),
        'paid_by': 'Anand Rao',
        'description': '25 sets of school uniform (shirt, trousers/skirt) + backpacks purchased from Arvind Stores for children enrolled in Class 4, 5, and 6',
        'status': 'Paid',
    },
    {
        'title': 'Science Lab Kits & Notebooks',
        'category': 'Education',
        'amount': 9500.00,
        'expense_date': datetime.date(2026, 7, 10),
        'paid_by': 'Lakshmi Iyer',
        'description': 'Science experiment kits (chemistry set, biology chart models) + 60 ruled notebooks for middle school students from City Stationery Mart',
        'status': 'Paid',
    },
    {
        'title': 'Annual School Fees – 8 Children',
        'category': 'Education',
        'amount': 72000.00,
        'expense_date': datetime.date(2026, 6, 15),
        'paid_by': 'Anand Rao',
        'description': 'Tuition fees paid to Greenwood Academy and City Primary School for 8 children for academic year 2026–27. Includes exam and library fees.',
        'status': 'Paid',
    },
    {
        'title': 'Computer & Digital Learning Equipment',
        'category': 'Education',
        'amount': 28500.00,
        'expense_date': datetime.date(2026, 5, 20),
        'paid_by': 'Anand Rao',
        'description': 'Purchased 2 Dell laptops, 1 projector, and HDMI cables for the new computer learning lab. Setup and installation included.',
        'status': 'Paid',
    },

    # Utilities
    {
        'title': 'Electricity & Power Utility Bill',
        'category': 'Utilities',
        'amount': 18600.00,
        'expense_date': datetime.date(2026, 8, 5),
        'paid_by': 'Suresh Menon',
        'description': 'State Electricity Board monthly bill for August 2026 – covers all wings A, B, C, kitchen block, and outdoor lighting (1,860 units consumed)',
        'status': 'Paid',
    },
    {
        'title': 'Water Supply & Municipal Bill',
        'category': 'Utilities',
        'amount': 4200.00,
        'expense_date': datetime.date(2026, 8, 3),
        'paid_by': 'Suresh Menon',
        'description': 'Monthly water supply charges from Municipal Corporation + borewell pump electricity bill for August 2026',
        'status': 'Paid',
    },
    {
        'title': 'LPG Cylinders – Kitchen (4 units)',
        'category': 'Utilities',
        'amount': 3800.00,
        'expense_date': datetime.date(2026, 7, 30),
        'paid_by': 'Priya Nair',
        'description': 'Refill of 4 commercial LPG gas cylinders (19 kg each) from Bharat Gas Agency for orphanage mess kitchen',
        'status': 'Paid',
    },

    # Maintenance
    {
        'title': 'Plumbing & Water Tank Maintenance',
        'category': 'Maintenance',
        'amount': 8900.00,
        'expense_date': datetime.date(2026, 7, 28),
        'paid_by': 'Suresh Menon',
        'description': 'Overhead tank cleaning (3 tanks), leakage repair in bathroom block B, replacement of 2 faulty flush valves and 1 broken pipe',
        'status': 'Paid',
    },
    {
        'title': 'Water Purifier Filter Replacement',
        'category': 'Maintenance',
        'amount': 4200.00,
        'expense_date': datetime.date(2026, 8, 14),
        'paid_by': 'Suresh Menon',
        'description': 'Kent RO plant annual servicing – replaced pre-filter, post-filter membrane and UV lamp in dining hall purifier. Next due: Aug 2027.',
        'status': 'Pending',
    },
    {
        'title': 'Roof & Ceiling Repair – Wing C',
        'category': 'Maintenance',
        'amount': 21000.00,
        'expense_date': datetime.date(2026, 6, 5),
        'paid_by': 'Suresh Menon',
        'description': 'Emergency monsoon repair – ceiling waterproofing and wall plastering in 3 dormitory rooms of Wing C after rain leakage',
        'status': 'Paid',
    },

    # Clothing
    {
        'title': 'Winter Sweaters & Footwear',
        'category': 'Clothing',
        'amount': 22000.00,
        'expense_date': datetime.date(2026, 7, 20),
        'paid_by': 'Heena Kausar',
        'description': 'Seasonal winter clothing – 24 woolen sweaters (sizes 6–14 years) and canvas shoes for 24 children purchased from Reliance Trends',
        'status': 'Paid',
    },
    {
        'title': 'Bed Sheets, Pillows & Towels',
        'category': 'Clothing',
        'amount': 14500.00,
        'expense_date': datetime.date(2026, 5, 10),
        'paid_by': 'Heena Kausar',
        'description': 'Replaced worn linen – 30 bed sheets, 30 pillow covers, 30 bath towels and 5 blankets for dormitory rooms A, B, and C',
        'status': 'Paid',
    },

    # Transportation
    {
        'title': 'School Van Fuel & Monthly Servicing',
        'category': 'Transportation',
        'amount': 14500.00,
        'expense_date': datetime.date(2026, 7, 15),
        'paid_by': 'Suresh Menon',
        'description': 'Diesel refill (120 L × ₹95/L) + monthly vehicle servicing of orphanage school van (oil change, filter replacement, tyre pressure check)',
        'status': 'Paid',
    },
    {
        'title': 'Vehicle Insurance Renewal – Van',
        'category': 'Transportation',
        'amount': 11200.00,
        'expense_date': datetime.date(2026, 4, 1),
        'paid_by': 'Suresh Menon',
        'description': 'Annual comprehensive insurance renewal for orphanage Mahindra school van (MH-04-AB-1234) from HDFC Ergo. Covers accident and third-party.',
        'status': 'Paid',
    },

    # Other
    {
        'title': 'Staff Welfare & Diwali Bonus',
        'category': 'Other',
        'amount': 18000.00,
        'expense_date': datetime.date(2026, 10, 20),
        'paid_by': 'Director Office',
        'description': 'Diwali bonus and gift hampers for 12 staff members – caretakers, cooks, drivers and teachers as annual welfare incentive',
        'status': 'Pending',
    },
    {
        'title': 'Fire Safety Equipment Inspection',
        'category': 'Other',
        'amount': 6500.00,
        'expense_date': datetime.date(2026, 7, 5),
        'paid_by': 'Suresh Menon',
        'description': 'Annual fire safety audit – refilling 8 fire extinguishers, smoke detector battery replacement and compliance certificate renewal',
        'status': 'Paid',
    },
]

def seed_expenses():
    print("Clearing old expense records...")
    Expense.objects.all().delete()

    print(f"Inserting {len(EXPENSES)} real expense records...")
    for data in EXPENSES:
        Expense.objects.create(**data)
        print(f"  [OK] {data['category']}: {data['title']} - Rs.{data['amount']:,.2f}")

    total = sum(e['amount'] for e in EXPENSES)
    print(f"\nDone! Total {len(EXPENSES)} expenses worth Rs.{total:,.2f} added.")

if __name__ == '__main__':
    seed_expenses()
