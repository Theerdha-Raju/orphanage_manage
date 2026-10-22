import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Users, Login, Donor

def create_or_verify_donor():
    user, _ = Users.objects.get_or_create(
        phone_number='9800000003',
        defaults={
            'full_name': 'Eleanor Vance',
            'gender': 'Female',
            'address': '42 Philanthropy Way, Indiranagar, Bengaluru, Karnataka 560038',
            'designation': 'donor',
            'status': 'Active'
        }
    )
    user.full_name = 'Eleanor Vance'
    user.designation = 'donor'
    user.save()

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

    donor, _ = Donor.objects.get_or_create(
        email='donor@orphanage.com',
        defaults={
            'full_name': 'Eleanor Vance',
            'phone_number': '9800000003',
            'address': '42 Philanthropy Way, Indiranagar, Bengaluru, Karnataka 560038',
            'status': 'Active'
        }
    )
    donor.full_name = 'Eleanor Vance'
    donor.phone_number = '9800000003'
    donor.save()

    print("Donor account verified for Eleanor Vance:", donor.donor_id, donor.full_name, donor.email)

if __name__ == '__main__':
    create_or_verify_donor()
