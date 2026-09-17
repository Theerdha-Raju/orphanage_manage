import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Users, Login

accounts = [
    {
        'email': 'admin@orphanage.com',
        'password': 'Admin@123',
        'role': 'admin',
        'name': 'Alexander Wright',
        'phone': '9800000001',
        'gender': 'Male',
        'designation': 'admin'
    },
    {
        'email': 'staff@orphanage.com',
        'password': 'Staff@123',
        'role': 'staff',
        'name': 'Sarah Jenkins',
        'phone': '9800000002',
        'gender': 'Female',
        'designation': 'staff'
    },
    {
        'email': 'donor@orphanage.com',
        'password': 'Donor@123',
        'role': 'donor',
        'name': 'Eleanor Vance',
        'phone': '9800000003',
        'gender': 'Female',
        'designation': 'donor'
    },
    {
        'email': 'donar@orphanage.com',
        'password': 'Donor@123',
        'role': 'donor',
        'name': 'Eleanor Vance',
        'phone': '9800000004',
        'gender': 'Female',
        'designation': 'donor'
    },
    {
        'email': 'volunteer@orphanage.com',
        'password': 'Volunteer@123',
        'role': 'volunteer',
        'name': 'Marcus Brody',
        'phone': '9800000005',
        'gender': 'Male',
        'designation': 'volunteer'
    },
    {
        'email': 'student@orphanage.com',
        'password': 'Student@123',
        'role': 'child',
        'name': 'Leo Carter',
        'phone': '9800000006',
        'gender': 'Male',
        'designation': 'child'
    },
    {
        'email': 'child@orphanage.com',
        'password': 'Student@123',
        'role': 'child',
        'name': 'Leo Carter',
        'phone': '9800000007',
        'gender': 'Male',
        'designation': 'child'
    },
    {
        'email': 'doctor@orphanage.com',
        'password': 'Doctor@123',
        'role': 'doctor',
        'name': 'Dr. Rajesh Sharma',
        'phone': '9876543210',
        'gender': 'Male',
        'designation': 'doctor'
    },
    {
        'email': 'teacher@orphanage.com',
        'password': 'Teacher@123',
        'role': 'teacher',
        'name': 'Mr. Anand Rao',
        'phone': '9876543212',
        'gender': 'Male',
        'designation': 'teacher'
    },
]

def seed_users():
    for acc in accounts:
        user, u_created = Users.objects.get_or_create(
            phone_number=acc['phone'],
            defaults={
                'full_name': acc['name'],
                'gender': acc['gender'],
                'address': 'HopeNest Orphanage Campus',
                'designation': acc['designation'],
                'status': 'Active'
            }
        )
        if not u_created:
            user.full_name = acc['name']
            user.designation = acc['designation']
            user.status = 'Active'
            user.save()
            
        login, l_created = Login.objects.get_or_create(
            email=acc['email'],
            defaults={
                'password': acc['password'],
                'role': acc['role'],
                'user': user,
                'status': 'Active'
            }
        )
        if not l_created:
            login.password = acc['password']
            login.role = acc['role']
            login.user = user
            login.status = 'Active'
            login.save()
            
        status_str = "Created" if l_created else "Updated"
        print(f"[{status_str}] {acc['email']} ({acc['role']}) -> {acc['password']}")

if __name__ == '__main__':
    seed_users()
