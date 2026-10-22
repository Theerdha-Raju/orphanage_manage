import os
import random
from datetime import date
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Child, Attendance, Users

def seed_previous_academic_years():
    staff = Users.objects.filter(designation__icontains='caregiver').first() or Users.objects.first()
    children = list(Child.objects.all())
    print(f"Seeding for {len(children)} children...")

    # 1. Academic Year 2025-2026 (June 2025 to May 2026)
    # 25 realistic school days across various months
    dates_2025_2026 = [
        # Sep 2025
        date(2025, 9, 1), date(2025, 9, 2), date(2025, 9, 3), date(2025, 9, 4), date(2025, 9, 5),
        # Oct 2025
        date(2025, 10, 6), date(2025, 10, 7), date(2025, 10, 8), date(2025, 10, 9), date(2025, 10, 10),
        # Nov 2025
        date(2025, 11, 3), date(2025, 11, 4), date(2025, 11, 5), date(2025, 11, 6), date(2025, 11, 7),
        # Jan 2026
        date(2026, 1, 5), date(2026, 1, 6), date(2026, 1, 7), date(2026, 1, 8), date(2026, 1, 9),
        # Feb 2026
        date(2026, 2, 2), date(2026, 2, 3), date(2026, 2, 4), date(2026, 2, 5), date(2026, 2, 6),
    ]

    # 2. Academic Year 2024-2025 (June 2024 to May 2025)
    # 10 sample school days
    dates_2024_2025 = [
        date(2024, 9, 2), date(2024, 9, 3), date(2024, 9, 4),
        date(2024, 11, 4), date(2024, 11, 5), date(2024, 11, 6),
        date(2025, 1, 6), date(2025, 1, 7),
        date(2025, 3, 3), date(2025, 3, 4),
    ]

    all_dates = [(d, '2025-2026') for d in dates_2025_2026] + [(d, '2024-2025') for d in dates_2024_2025]

    total_created = 0
    batch = []

    for d, ay in all_dates:
        # Check existing for this date
        existing_child_ids = set(
            Attendance.objects.filter(attendance_date=d).values_list('child_id', flat=True)
        )
        for c in children:
            if c.child_id in existing_child_ids:
                continue
            
            # Deterministic status based on child_id and day
            seed_val = (c.child_id * 17 + d.day * 3 + d.month * 7) % 100
            if seed_val < 88:
                st = 'Present'
            elif seed_val < 95:
                st = 'Absent'
            else:
                st = 'Leave'

            batch.append(Attendance(
                child=c,
                attendance_date=d,
                attendance_status=st,
                marked_by=staff
            ))

            if len(batch) >= 2000:
                Attendance.objects.bulk_create(batch)
                total_created += len(batch)
                batch = []

    if batch:
        Attendance.objects.bulk_create(batch)
        total_created += len(batch)

    print(f"Successfully seeded {total_created} historical attendance records.")

if __name__ == '__main__':
    seed_previous_academic_years()
