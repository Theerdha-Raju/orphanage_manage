import os
import django
import random
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import (
    Users, Login, Child, Donor, Donation, Volunteer, VolunteerAssignment,
    Attendance, Education, Health, Achievement, Alert, Expense
)
from django.utils import timezone

def seed_all():
    print("--- Clearing old mock data ---")
    Alert.objects.all().delete()
    Achievement.objects.all().delete()
    Education.objects.all().delete()
    Health.objects.all().delete()
    Attendance.objects.all().delete()
    VolunteerAssignment.objects.all().delete()
    Donation.objects.all().delete()
    Expense.objects.all().delete()
    
    # 1. Staff / Caregivers / Doctors / Teachers Users
    print("--- Seeding Users ---")
    staff_data = [
        ("Priya Nair", "priya.nair@orphanage.com", "9876543211", "Female", "Orphanage Wing B", "staff", "Staff@123"),
        ("Dr. Rajesh Sharma", "sharma@orphanage.com", "9876543210", "Male", "Medical Clinic Wing", "doctor", "Doctor@123"),
        ("Mr. Anand Rao", "rao@orphanage.com", "9876543212", "Male", "Education Dept", "teacher", "Teacher@123"),
        ("Ms. Lakshmi Iyer", "iyer@orphanage.com", "9876543213", "Female", "Education Dept", "teacher", "Teacher@123"),
        ("Heena Kausar", "heena@orphanage.com", "7907949368", "Female", "Orphanage Wing A", "staff", "Staff@123"),
        ("Veena Kumari", "veena@orphanage.com", "9839977021", "Female", "Orphanage Wing C", "staff", "Staff@123"),
        ("Suresh Menon", "suresh@orphanage.com", "9447123456", "Male", "Logistics & Facility", "staff", "Staff@123"),
    ]

    for full_name, email, phone, gender, address, designation, password in staff_data:
        u, _ = Users.objects.get_or_create(
            phone_number=phone,
            defaults={'full_name': full_name, 'gender': gender, 'address': address, 'designation': designation, 'status': 'Active'}
        )
        u.full_name = full_name
        u.designation = designation
        u.save()

        login_obj = Login.objects.filter(email=email).first()
        if not login_obj:
            Login.objects.create(email=email, password=password, role=designation, status='Active', user=u)

    # 2. Seed 24 Children
    print("--- Seeding 24 Children ---")
    children_info = [
        ("Aarav Sharma", "2014-05-12", "Male", "2021-06-10", "Sunita Sharma", "A+", "St. Jude Elementary", "Active"),
        ("Ananya Patel", "2015-08-23", "Female", "2022-01-15", "Ramesh Patel", "B+", "City Primary School", "Active"),
        ("Rohan Verma", "2013-11-04", "Male", "2020-08-01", "Kiran Verma", "O+", "Greenwood Academy", "Active"),
        ("Diya Iyer", "2016-02-18", "Female", "2022-07-20", "Meenakshi Iyer", "AB+", "Sunshine Public", "Active"),
        ("Kabir Singh", "2012-09-30", "Male", "2019-04-11", "Harpreet Singh", "O-", "Model High School", "Active"),
        ("Meera Nair", "2017-04-14", "Female", "2023-03-05", "Gopinath Nair", "A-", "Kinder Care Nursery", "Active"),
        ("Vihaan Kumar", "2014-12-01", "Male", "2021-11-12", "Vijay Kumar", "B-", "Holy Cross School", "Active"),
        ("Sneha Das", "2015-07-09", "Female", "2022-05-18", "Subhash Das", "O+", "City Primary School", "Active"),
        ("Aditya Joshi", "2013-03-25", "Male", "2020-10-09", "Prakash Joshi", "A+", "St. Jude Elementary", "Active"),
        ("Kavya Reddy", "2016-10-11", "Female", "2023-01-10", "Venkat Reddy", "B+", "Sunshine Public", "Active"),
        ("Ishaan Gupta", "2014-01-29", "Male", "2021-08-14", "Sunil Gupta", "O+", "Greenwood Academy", "Active"),
        ("Riya Sen", "2015-09-17", "Female", "2022-09-01", "Tapan Sen", "AB-", "City Primary School", "Active"),
        ("Devansh Mehta", "2012-06-05", "Male", "2019-12-01", "Alok Mehta", "A+", "Model High School", "Active"),
        ("Pooja Hegde", "2017-01-22", "Female", "2023-05-15", "Nagesh Hegde", "B+", "Kinder Care Nursery", "Active"),
        ("Arjun Rao", "2013-08-14", "Male", "2021-02-28", "Madhusudan Rao", "O+", "St. Jude Elementary", "Active"),
        ("Tanvi Deshmukh", "2016-06-30", "Female", "2023-02-12", "Sanjay Deshmukh", "A-", "Sunshine Public", "Active"),
        ("Yashvardhan Roy", "2014-04-03", "Male", "2021-09-20", "Bikram Roy", "O-", "Greenwood Academy", "Active"),
        ("Ishita Saxena", "2015-12-19", "Female", "2022-11-05", "Rajan Saxena", "B+", "City Primary School", "Active"),
        ("Siddharth Pillai", "2012-10-08", "Male", "2020-03-17", "Karthik Pillai", "A+", "Model High School", "Active"),
        ("Nisha Agarwal", "2017-07-25", "Female", "2023-06-01", "Mahesh Agarwal", "AB+", "Kinder Care Nursery", "Active"),
        ("Dhruv Pandey", "2013-05-16", "Male", "2021-01-08", "Rajendra Pandey", "O+", "St. Jude Elementary", "Active"),
        ("Shruti Mishra", "2016-09-02", "Female", "2022-12-10", "Pradeep Mishra", "B-", "Sunshine Public", "Active"),
        ("Varun Kulkarni", "2014-11-11", "Male", "2022-03-30", "Milind Kulkarni", "A-", "Greenwood Academy", "Active"),
        ("Avani Tripathi", "2015-03-08", "Female", "2022-08-22", "Devendra Tripathi", "O+", "City Primary School", "Active"),
    ]

    created_children = []
    for full_name, dob, gender, adm_date, guardian, bg, prev_school, status in children_info:
        c, _ = Child.objects.get_or_create(
            full_name=full_name,
            defaults={
                'date_of_birth': dob,
                'gender': gender,
                'admission_date': adm_date,
                'guardian_name': guardian,
                'blood_group': bg,
                'previous_school': prev_school,
                'status': status
            }
        )
        created_children.append(c)

    # 3. Seed Health Records
    print("--- Seeding Health Records ---")
    health_statuses = ['Healthy', 'Healthy', 'Healthy', 'Healthy', 'Mild Risk', 'Underweight', 'Healthy']
    notes_list = [
        "Normal growth milestones, active and energetic.",
        "Routine checkup complete. Vitals stable.",
        "Slight vitamin D deficiency, prescribed multivitamin.",
        "Mild weight drop observed over last month. Under observation.",
        "Dental checkup clean, vision test normal.",
        "Hemoglobin levels good, height and weight tracking 60th percentile."
    ]
    for child in created_children:
        # Generate 1-2 health records per child
        h_cm = round(random.uniform(115.0, 155.0), 1)
        w_kg = round(random.uniform(20.0, 48.0), 1)
        st = random.choice(health_statuses)
        d_str = (datetime.date.today() - datetime.timedelta(days=random.randint(1, 45))).strftime('%Y-%m-%d')
        Health.objects.create(
            child=child,
            height_cm=h_cm,
            weight_kg=w_kg,
            checkup_date=d_str,
            status=st,
            notes=random.choice(notes_list)
        )

    # 4. Seed Education Records
    print("--- Seeding Education Records ---")
    subjects = ["Mathematics", "Science", "English", "Social Studies", "Environmental Studies"]
    classes = ["Class 3", "Class 4", "Class 5", "Class 6", "Class 7"]
    remarks_list = [
        "Excellent analytical skills and enthusiasm in class.",
        "Consistent performer, good homework submission.",
        "Needs extra guidance in geometry and fractions.",
        "Great active reader and strong vocabulary.",
        "Shows remarkable improvement over previous term."
    ]
    for child in created_children:
        cl = random.choice(classes)
        for subj in random.sample(subjects, 3):
            marks = round(random.uniform(58.0, 98.0), 1)
            d_str = (datetime.date.today() - datetime.timedelta(days=random.randint(10, 60))).strftime('%Y-%m-%d')
            Education.objects.create(
                child=child,
                class_name=cl,
                subject=subj,
                marks=marks,
                exam_date=d_str,
                remarks=random.choice(remarks_list)
            )

    # 5. Seed Donors & Donations
    print("--- Seeding Donors and Donations ---")
    donor_list = [
        ("Mehta Family Foundation", "9820011223", "contact@mehta-foundation.org", "Mumbai, MH"),
        ("TechCorp Inc. CSR Initiative", "9811122334", "csr@techcorp.com", "Bengaluru, KA"),
        ("Anita Desai & Friends", "9833344556", "anita.desai@gmail.com", "Pune, MH"),
        ("Dr. K. S. Malhotra", "9844455667", "dr.malhotra@healthplus.in", "Delhi, NCR"),
        ("Apex Global Traders", "9855566778", "info@apexglobal.com", "Hyderabad, TS"),
        ("Sunita Kapoor Welfare Trust", "9866677889", "sunita.kapoor@trust.org", "Chennai, TN"),
    ]

    created_donors = []
    for name, phone, email, addr in donor_list:
        d, _ = Donor.objects.get_or_create(
            email=email,
            defaults={'full_name': name, 'phone_number': phone, 'address': addr, 'status': 'Active'}
        )
        created_donors.append(d)

        # Create donor login account
        u, _ = Users.objects.get_or_create(
            phone_number=phone,
            defaults={'full_name': name, 'gender': 'Other', 'address': addr, 'designation': 'donor'}
        )
        Login.objects.get_or_create(
            email=email,
            defaults={'password': 'Donor@123', 'role': 'donor', 'user': u, 'status': 'Active'}
        )


    donations_data = [
        (created_donors[0], "Money", 50000.00, None, "2026-08-10", "Received"),
        (created_donors[1], "Money", 150000.00, None, "2026-08-01", "Received"),
        (created_donors[2], "Item", None, "50 Sets of Winter Jackets & Blankets", "2026-07-25", "Received"),
        (created_donors[3], "Money", 25000.00, None, "2026-07-15", "Received"),
        (created_donors[4], "Money", 75000.00, None, "2026-06-30", "Received"),
        (created_donors[5], "Item", None, "10 Brand New Desktop Computers for Edu Lab", "2026-06-18", "Received"),
        (created_donors[0], "Money", 40000.00, None, "2026-05-22", "Received"),
        (created_donors[1], "Money", 120000.00, None, "2026-05-05", "Received"),
    ]

    for donor, dtype, amount, item_desc, date_str, status in donations_data:
        Donation.objects.create(
            donor=donor,
            donation_type=dtype,
            amount=amount,
            item_description=item_desc,
            donation_date=date_str,
            status=status
        )

    # 6. Seed Expenses
    print("--- Seeding Expenses ---")
    expense_items = [
        ("Monthly Grocery & Fresh Produce", "Food", 48500.00, "2026-08-12", "Priya Nair", "Bulk purchase from BigBasket Wholesale", "Paid"),
        ("Emergency Pediatric Medicines", "Medical", 12400.00, "2026-08-08", "Dr. Rajesh Sharma", "Pharmacy medical supplies for Wing B clinic", "Paid"),
        ("School Uniforms & Backpacks (Class 4-6)", "Education", 32000.00, "2026-08-02", "Anand Rao", "25 sets of school uniforms and bags", "Paid"),
        ("Electricity & Power Utility Bill", "Utilities", 18600.00, "2026-08-05", "Suresh Menon", "State Electricity Board monthly bill", "Paid"),
        ("Plumbing & Water Tank Maintenance", "Maintenance", 8900.00, "2026-07-28", "Suresh Menon", "Cleaned overhead tanks & repaired leakages", "Paid"),
        ("Winter Sweaters & Footwear", "Clothing", 22000.00, "2026-07-20", "Heena Kausar", "Seasonal clothing for 24 children", "Paid"),
        ("School Van Fuel & Monthly Servicing", "Transportation", 14500.00, "2026-07-15", "Suresh Menon", "Diesel refill and regular vehicle maintenance", "Paid"),
        ("Science Lab Kits & Notebooks", "Education", 9500.00, "2026-07-10", "Lakshmi Iyer", "Science experiment materials for middle school", "Paid"),
        ("Water Purifier Filter Replacement", "Maintenance", 4200.00, "2026-08-14", "Suresh Menon", "RO plant servicing in dining hall", "Pending"),
    ]

    for title, cat, amt, date_str, paid_by, desc, status in expense_items:
        Expense.objects.create(
            title=title,
            category=cat,
            amount=amt,
            expense_date=date_str,
            paid_by=paid_by,
            description=desc,
            status=status
        )

    # 7. Seed Volunteers & Assignments
    print("--- Seeding Volunteers and Assignments ---")
    volunteers_data = [
        ("Rahul Singh", "rahul.singh@gmail.com", "9711223344", "Mathematics Tutoring, Chess", "Weekends", "Active"),
        ("Anita Desai", "anita.desai@yahoo.com", "9722334455", "Art & Craft, Dance", "Weekdays", "Active"),
        ("Vikram Patel", "vikram.patel@outlook.com", "9733445566", "Sports Coaching, Football", "Weekends", "Active"),
        ("Priya Verma", "priya.verma@gmail.com", "9744556677", "English Communication, Public Speaking", "Flexible", "Active"),
        ("Siddharth Roy", "siddharth.roy@gmail.com", "9755667788", "Computer Science, Coding Basics", "Evenings", "Active"),
    ]

    created_vols = []
    for name, email, phone, skills, avail, status in volunteers_data:
        v, _ = Volunteer.objects.get_or_create(
            email=email,
            defaults={'full_name': name, 'phone_number': phone, 'skills': skills, 'availability': avail, 'status': status}
        )
        created_vols.append(v)

    assignments_data = [
        (created_vols[0], "Math Remedial Class (Grade 5)", "2026-08-18", "Tutor 6 students in fractions and decimals", "Assigned"),
        (created_vols[1], "Weekend Clay Modeling Workshop", "2026-08-20", "Creative art activity for junior group", "Assigned"),
        (created_vols[2], "Inter-Wing Football Tournament", "2026-08-22", "Organize matches and referee", "Assigned"),
        (created_vols[3], "English Storytelling & Drama", "2026-08-15", "Successfully conducted drama session", "Completed"),
    ]

    for vol, event, date_str, fb, status in assignments_data:
        VolunteerAssignment.objects.create(
            volunteer=vol,
            event_name=event,
            assigned_date=date_str,
            feedback=fb,
            status=status
        )

    # 8. Seed AI Alerts & Achievements
    print("--- Seeding AI Risk Alerts and Achievements ---")
    Alert.objects.create(
        child=created_children[0], # Aarav
        alert_type="Health",
        message="[SVM Model] Elevated health risk: 4% weight drop over last 3 weeks. Medical review recommended.",
        status="Open"
    )
    Alert.objects.create(
        child=created_children[2], # Rohan
        alert_type="Academic",
        message="[Random Forest] Math score predicted below 60%. 1 extra hour weekly tutoring suggested.",
        status="Open"
    )

    Achievement.objects.create(
        child=created_children[1], # Ananya
        title="1st Rank in Regional Science Quiz",
        description="Scored top marks in inter-school science quiz competition.",
        achievement_date="2026-07-28",
        category="Academic"
    )
    Achievement.objects.create(
        child=created_children[4], # Kabir
        title="Best Sportsman Award - District Athletics",
        description="Won gold medal in 100m sprint sprint event.",
        achievement_date="2026-06-15",
        category="Sports"
    )

    print("--- Database successfully seeded with real values! ---")

if __name__ == '__main__':
    seed_all()
