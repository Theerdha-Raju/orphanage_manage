import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Users, Login, Volunteer, Child

def setup_logins():
    # 1. Volunteer Logins
    volunteers = Volunteer.objects.all()
    print("--- Volunteer Logins ---")
    for v in volunteers:
        if v.email:
            u, _ = Users.objects.get_or_create(
                phone_number=v.phone_number or f"97000000{v.volunteer_id}",
                defaults={'full_name': v.full_name, 'gender': 'Other', 'address': '', 'designation': 'volunteer'}
            )
            l, created = Login.objects.get_or_create(
                email=v.email,
                defaults={'password': 'Vol@123', 'role': 'volunteer', 'user': u, 'status': 'Active'}
            )
            if not created:
                l.password = 'Vol@123'
                l.role = 'volunteer'
                l.save()
            print(f"Volunteer: {v.full_name} | Email: {v.email} | Password: Vol@123")

    # 2. Student / Child Logins
    children = Child.objects.all()
    print("\n--- Student Logins ---")
    for c in children:
        clean_name = c.full_name.lower().replace(' ', '.')
        student_email = f"{clean_name}@student.org"
        u, _ = Users.objects.get_or_create(
            phone_number=f"96000000{c.child_id}",
            defaults={'full_name': c.full_name, 'gender': c.gender, 'address': '', 'designation': 'child'}
        )
        l, created = Login.objects.get_or_create(
            email=student_email,
            defaults={'password': 'Student@123', 'role': 'child', 'user': u, 'status': 'Active'}
        )
        if not created:
            l.password = 'Student@123'
            l.role = 'child'
            l.save()
        print(f"Student: {c.full_name} | Email: {student_email} | Password: Student@123")

if __name__ == '__main__':
    setup_logins()
