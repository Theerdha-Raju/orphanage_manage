import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Users, Login

accounts = [
    # ── Administrator (5 Accounts) ──
    {
        'email': 'alexander.wright@orphanage.com',
        'password': 'Admin@123',
        'role': 'admin',
        'name': 'Alexander Wright',
        'phone': '9800000001',
        'gender': 'Male',
        'designation': 'Administrator'
    },
    {
        'email': 'admin@orphanage.com',
        'password': 'Admin@123',
        'role': 'admin',
        'name': 'Alexander Wright',
        'phone': '9800000001',
        'gender': 'Male',
        'designation': 'Administrator'
    },
    {
        'email': 'neha.sharma@orphanage.com',
        'password': 'Admin@123',
        'role': 'admin',
        'name': 'Neha Sharma',
        'phone': '9800000051',
        'gender': 'Female',
        'designation': 'Administrator'
    },
    {
        'email': 'ravi.kumar@orphanage.com',
        'password': 'Admin@123',
        'role': 'admin',
        'name': 'Ravi Kumar',
        'phone': '9800000052',
        'gender': 'Male',
        'designation': 'Administrator'
    },
    {
        'email': 'sonia.mathew@orphanage.com',
        'password': 'Admin@123',
        'role': 'admin',
        'name': 'Sonia Mathew',
        'phone': '9800000053',
        'gender': 'Female',
        'designation': 'Administrator'
    },
    {
        'email': 'david.thomas@orphanage.com',
        'password': 'Admin@123',
        'role': 'admin',
        'name': 'David Thomas',
        'phone': '9800000054',
        'gender': 'Male',
        'designation': 'Administrator'
    },

    # ── Caregiver / Staff (5 Accounts) ──
    {
        'email': 'sarah.jenkins@orphanage.com',
        'password': 'Staff@123',
        'role': 'staff',
        'name': 'Sarah Jenkins',
        'phone': '9800000002',
        'gender': 'Female',
        'designation': 'Caregiver'
    },
    {
        'email': 'staff@orphanage.com',
        'password': 'Staff@123',
        'role': 'staff',
        'name': 'Sarah Jenkins',
        'phone': '9800000002',
        'gender': 'Female',
        'designation': 'Caregiver'
    },
    {
        'email': 'priya.nair@orphanage.com',
        'password': 'Priya@Staff123',
        'role': 'staff',
        'name': 'Priya Nair',
        'phone': '9800000011',
        'gender': 'Female',
        'designation': 'Caregiver'
    },
    {
        'email': 'heena.kausar@orphanage.com',
        'password': 'Staff@123',
        'role': 'staff',
        'name': 'Heena Kausar',
        'phone': '9800000012',
        'gender': 'Female',
        'designation': 'Caregiver'
    },
    {
        'email': 'veena.kumari@orphanage.com',
        'password': 'Staff@123',
        'role': 'staff',
        'name': 'Veena Kumari',
        'phone': '9800000013',
        'gender': 'Female',
        'designation': 'Caregiver'
    },
    {
        'email': 'suresh.menon@orphanage.com',
        'password': 'Staff@123',
        'role': 'staff',
        'name': 'Suresh Menon',
        'phone': '9800000014',
        'gender': 'Male',
        'designation': 'Caregiver'
    },

    # ── Donor / Sponsor (6 Accounts) ──
    {
        'email': 'eleanor.vance@orphanage.com',
        'password': 'Donor@123',
        'role': 'donor',
        'name': 'Eleanor Vance',
        'phone': '9800000003',
        'gender': 'Female',
        'designation': 'Donor'
    },
    {
        'email': 'donor@orphanage.com',
        'password': 'Donor@123',
        'role': 'donor',
        'name': 'Eleanor Vance',
        'phone': '9800000003',
        'gender': 'Female',
        'designation': 'Donor'
    },
    {
        'email': 'rajesh.mehta@mehta-foundation.org',
        'password': 'Donor@123',
        'role': 'donor',
        'name': 'Rajesh Mehta',
        'phone': '9800000021',
        'gender': 'Male',
        'designation': 'Donor'
    },
    {
        'email': 'techcorp.csr@techcorp.com',
        'password': 'Donor@123',
        'role': 'donor',
        'name': 'TechCorp CSR',
        'phone': '9800000022',
        'gender': 'Other',
        'designation': 'Donor'
    },
    {
        'email': 'anita.desai@gmail.com',
        'password': 'Donor@123',
        'role': 'donor',
        'name': 'Anita Desai',
        'phone': '9800000023',
        'gender': 'Female',
        'designation': 'Donor'
    },
    {
        'email': 'dr.malhotra@healthplus.in',
        'password': 'Donor@123',
        'role': 'donor',
        'name': 'Dr. K. S. Malhotra',
        'phone': '9800000024',
        'gender': 'Male',
        'designation': 'Donor'
    },
    {
        'email': 'sunita.kapoor@trust.org',
        'password': 'Donor@123',
        'role': 'donor',
        'name': 'Sunita Kapoor',
        'phone': '9800000025',
        'gender': 'Female',
        'designation': 'Donor'
    },

    # ── Volunteer (6 Accounts) ──
    {
        'email': 'rahul.singh@orphanage.com',
        'password': 'Volunteer@123',
        'role': 'volunteer',
        'name': 'Rahul Singh',
        'phone': '9800000005',
        'gender': 'Male',
        'designation': 'Volunteer'
    },
    {
        'email': 'volunteer@orphanage.com',
        'password': 'Volunteer@123',
        'role': 'volunteer',
        'name': 'Rahul Singh',
        'phone': '9800000005',
        'gender': 'Male',
        'designation': 'Volunteer'
    },
    {
        'email': 'anita.desai@yahoo.com',
        'password': 'Vol@123',
        'role': 'volunteer',
        'name': 'Anita Desai',
        'phone': '9800000031',
        'gender': 'Female',
        'designation': 'Volunteer'
    },
    {
        'email': 'vikram.patel@outlook.com',
        'password': 'Vikram@Vol123',
        'role': 'volunteer',
        'name': 'Vikram Patel',
        'phone': '9800000032',
        'gender': 'Male',
        'designation': 'Volunteer'
    },
    {
        'email': 'priya.verma@gmail.com',
        'password': 'Vol@123',
        'role': 'volunteer',
        'name': 'Priya Verma',
        'phone': '9800000033',
        'gender': 'Female',
        'designation': 'Volunteer'
    },
    {
        'email': 'siddharth.roy@gmail.com',
        'password': 'Siddharth@Vol123',
        'role': 'volunteer',
        'name': 'Siddharth Roy',
        'phone': '9800000034',
        'gender': 'Male',
        'designation': 'Volunteer'
    },
    {
        'email': 'deepa.s@orphanage.com',
        'password': 'Deepa@Vol123',
        'role': 'volunteer',
        'name': 'Deepa S',
        'phone': '9800000035',
        'gender': 'Female',
        'designation': 'Volunteer'
    },

    # ── Student / Child (6 Accounts) ──
    {
        'email': 'leo.carter@student.org',
        'password': 'Student@123',
        'role': 'child',
        'name': 'Leo Carter',
        'phone': '9800000006',
        'gender': 'Male',
        'designation': 'Student'
    },
    {
        'email': 'student@orphanage.com',
        'password': 'Student@123',
        'role': 'child',
        'name': 'Leo Carter',
        'phone': '9800000006',
        'gender': 'Male',
        'designation': 'Student'
    },
    {
        'email': 'aarav.sharma@student.org',
        'password': 'Student@123',
        'role': 'child',
        'name': 'Aarav Sharma',
        'phone': '9800000041',
        'gender': 'Male',
        'designation': 'Student'
    },
    {
        'email': 'ananya.patel@student.org',
        'password': 'Student@123',
        'role': 'child',
        'name': 'Ananya Patel',
        'phone': '9800000042',
        'gender': 'Female',
        'designation': 'Student'
    },
    {
        'email': 'rohan.verma@student.org',
        'password': 'Student@123',
        'role': 'child',
        'name': 'Rohan Verma',
        'phone': '9800000043',
        'gender': 'Male',
        'designation': 'Student'
    },
    {
        'email': 'diya.iyer@student.org',
        'password': 'Student@123',
        'role': 'child',
        'name': 'Diya Iyer',
        'phone': '9800000044',
        'gender': 'Female',
        'designation': 'Student'
    },
    {
        'email': 'kabir.singh@student.org',
        'password': 'Student@123',
        'role': 'child',
        'name': 'Kabir Singh',
        'phone': '9800000045',
        'gender': 'Male',
        'designation': 'Student'
    },
    # ── Other Roles ──
    {
        'email': 'rajesh.sharma@orphanage.com',
        'password': 'Doctor@123',
        'role': 'doctor',
        'name': 'Dr. Rajesh Sharma',
        'phone': '9876543210',
        'gender': 'Male',
        'designation': 'doctor'
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
        'email': 'anand.rao@orphanage.com',
        'password': 'Teacher@123',
        'role': 'teacher',
        'name': 'Mr. Anand Rao',
        'phone': '9876543212',
        'gender': 'Male',
        'designation': 'teacher'
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
