import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Users, Volunteer, VolunteerAssignment, Donor, Donation

# Passwords for seeded users per role
PASSWORDS = {
    'admin': 'Admin@123',
    'staff': 'staff123',
    'doctor': 'doctor123',
    'teacher': 'teacher123',
    'volunteer': 'vol123',
    'donor': 'donor123',
}

import datetime
from django.utils import timezone

def seed():
    print("Seeding Users (Staff, Teachers, Doctors)...")
    roles = [
        ("Dr. Sharma", "sharma@example.com", "doctor", "9876543210"),
        ("Nurse Joy", "staff@orphanage.com", "staff", "9876543211"),
        ("Mr. Rao", "rao@example.com", "teacher", "9876543212"),
        ("Ms. Iyer", "iyer@example.com", "teacher", "9876543213")
    ]
    for name, email, role, phone in roles:
        from api.models import Login
        if not Login.objects.filter(email=email).exists():
            u, _ = Users.objects.get_or_create(phone_number=phone, defaults={'full_name': name, 'designation': role})
            Login.objects.create(user=u, email=email, password=PASSWORDS[role], role=role)

    print("Seeding Volunteers and Assignments...")
    vols = ["Rahul Singh", "Anita Desai", "Vikram Patel", "Priya Verma"]
    created_vols = []
    for i, v in enumerate(vols):
        vol, created = Volunteer.objects.get_or_create(full_name=v, defaults={'email': f'vol{i}@example.com', 'skills': 'Teaching, Mentoring', 'availability': 'Weekends'})
        created_vols.append(vol)
    
    tasks = [
        ("Math Tutoring (Class 4)", datetime.date.today() + datetime.timedelta(days=2)),
        ("Weekend Sports Activity", datetime.date.today() + datetime.timedelta(days=3)),
        ("Art & Craft Workshop", datetime.date.today() + datetime.timedelta(days=5)),
    ]
    for i, (task_name, date) in enumerate(tasks):
        VolunteerAssignment.objects.get_or_create(
            volunteer=created_vols[i % len(created_vols)],
            event_name=task_name,
            defaults={'assigned_date': date, 'status': 'Pending'}
        )
    
    print("Seeding Donors and Donations...")
    donors = ["Mehta Family", "TechCorp Inc.", "Anita Desai"]
    created_donors = []
    for i, d in enumerate(donors):
        donor, created = Donor.objects.get_or_create(full_name=d, defaults={'email': f'donor{i}@example.com'})
        created_donors.append(donor)
    
    donations = [
        (created_donors[0], "Money", 25000.00, None, timezone.now().date() - datetime.timedelta(days=2)),
        (created_donors[1], "Money", 100000.00, None, timezone.now().date() - datetime.timedelta(days=15)),
        (created_donors[2], "Item", None, "Winter Clothes (50 pcs)", timezone.now().date() - datetime.timedelta(days=30)),
    ]
    for donor, dtype, amount, item, date in donations:
        Donation.objects.get_or_create(
            donor=donor,
            donation_type=dtype,
            donation_date=date,
            defaults={'amount': amount, 'item_description': item}
        )
    
    print("Done seeding.")

if __name__ == '__main__':
    seed()
