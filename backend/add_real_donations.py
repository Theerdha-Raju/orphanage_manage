import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Donor, Donation

def seed_all_donations():
    Donation.objects.all().delete()
    print("Cleared existing donations.")

    donors = list(Donor.objects.all())
    if not donors:
        print("No donors found.")
        return

    real_donations = [
        # (Donor index, type, amount, item_desc, date, status)
        (0, "Money", 50000.00, None, "2026-08-10", "Received"),
        (0, "Money", 40000.00, None, "2026-05-22", "Received"),
        (1, "Money", 150000.00, None, "2026-08-01", "Received"),
        (1, "Money", 120000.00, None, "2026-05-05", "Received"),
        (2, "Item", None, "50 Sets of Winter Jackets & Blankets", "2026-07-25", "Received"),
        (2, "Money", 15000.00, None, "2026-03-10", "Received"),
        (3, "Money", 25000.00, None, "2026-07-15", "Received"),
        (3, "Money", 30000.00, None, "2026-02-18", "Received"),
        (4, "Money", 75000.00, None, "2026-06-30", "Received"),
        (4, "Money", 60000.00, None, "2026-01-25", "Received"),
        (5, "Item", None, "10 Brand New Desktop Computers for Edu Lab", "2026-06-18", "Received"),
        (5, "Money", 50000.00, None, "2026-04-14", "Received"),
        (6, "Money", 35000.00, None, "2026-04-12", "Received"),
        (7, "Money", 20000.00, None, "2026-04-05", "Received"),
        (8, "Item", None, "100 Sets of School Stationery & Art Supplies", "2026-03-20", "Received"),
    ]

    for idx, dtype, amt, desc, dt, st in real_donations:
        if idx < len(donors):
            d = Donation.objects.create(
                donor=donors[idx],
                donation_type=dtype,
                amount=amt,
                item_description=desc,
                donation_date=dt,
                status=st
            )
            print(f"Recorded real donation: {donors[idx].full_name} | {dtype} | Rs.{amt if amt else desc} | {dt}")

if __name__ == '__main__':
    seed_all_donations()
