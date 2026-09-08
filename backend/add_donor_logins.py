import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Users, Login, Donor

def add_donor_logins():
    donors = Donor.objects.all()
    for d in donors:
        if d.email:
            # Create/get user
            u, _ = Users.objects.get_or_create(
                phone_number=d.phone_number or f"98000000{d.donor_id}",
                defaults={'full_name': d.full_name, 'gender': 'Other', 'address': d.address or '', 'designation': 'donor'}
            )
            login_obj, created = Login.objects.get_or_create(
                email=d.email,
                defaults={'password': 'Donor@123', 'role': 'donor', 'user': u, 'status': 'Active'}
            )
            if not created:
                login_obj.password = 'Donor@123'
                login_obj.role = 'donor'
                login_obj.save()
            print(f"Donor Login Ready: Email: {d.email} | Password: Donor@123 | Role: donor")

if __name__ == '__main__':
    add_donor_logins()
