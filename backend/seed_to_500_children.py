import os
import django
import random
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import (
    Child, Users, Login, Health, Education, Attendance, Behaviour, Alert
)

MALE_FIRST_NAMES = [
    "Aarav", "Advait", "Arjun", "Aryan", "Ayaan", "Dev", "Dhruv", "Ishaan",
    "Kabir", "Krishna", "Manav", "Neil", "Pranav", "Reyansh", "Rohan", "Samar",
    "Shaurya", "Tejas", "Veer", "Vihaan", "Yash", "Vivaan", "Aadi", "Aniket",
    "Ritvik", "Parth", "Madhav", "Sahil", "Kunal", "Sameer", "Tanmay", "Varun",
    "Ayush", "Gautam", "Siddharth", "Chirag", "Harshit", "Nikhil", "Aditya",
    "Abhay", "Akash", "Alok", "Amey", "Anand", "Anmol", "Anurag", "Arnav",
    "Bhavin", "Bhuvan", "Chetan", "Chinmay", "Darshan", "Deepak", "Devansh",
    "Dhanush", "Dhairya", "Divyansh", "Ganesh", "Girish", "Hardik", "Harish",
    "Hemant", "Himanshu", "Hiren", "Jayant", "Jitendra", "Kalyan", "Kamal",
    "Karan", "Kartik", "Kaustubh", "Lalit", "Lokesh", "Mandar", "Manish",
    "Mayank", "Mihir", "Mohan", "Mukesh", "Naveen", "Neeraj", "Nirav",
    "Omkar", "Pankaj", "Paresh", "Piyush", "Pradeep", "Prakash", "Prashant",
    "Praveen", "Pushkar", "Rahul", "Raj", "Rajan", "Rajeev", "Rajesh", "Rakesh",
    "Raman", "Ramesh", "Ranjit", "Ravi", "Rishi", "Ritesh", "Rohit", "Sachin",
    "Sanjay", "Sanket", "Santosh", "Sarvesh", "Satish", "Shantanu", "Shashi",
    "Shivam", "Shravan", "Shrikant", "Somesh", "Sourabh", "Subhash", "Sudhir",
    "Sujay", "Sumit", "Suraj", "Suresh", "Swapnil", "Tarun", "Uday", "Utkarsh",
    "Vasant", "Vedant", "Vikas", "Vinay", "Vineet", "Vinod", "Vipin", "Vishal"
]

FEMALE_FIRST_NAMES = [
    "Aanya", "Aadhya", "Ananya", "Diya", "Isha", "Kavya", "Kiara", "Myra",
    "Navya", "Pari", "Riya", "Saanvi", "Sara", "Shanaya", "Sneha", "Tanvi",
    "Veda", "Zara", "Avani", "Divya", "Meera", "Neha", "Pooja", "Priya",
    "Rashi", "Shreya", "Swara", "Trisha", "Vandana", "Vidhi", "Bhavna",
    "Deepika", "Charvi", "Janhvi", "Mehak", "Aanchal", "Aarti", "Aditi",
    "Aishwarya", "Akanksha", "Amrita", "Anamika", "Ankita", "Anshika", "Anushka",
    "Aparna", "Archana", "Arpita", "Barkha", "Bharti", "Bhumika", "Chaitali",
    "Chhavi", "Damini", "Dharini", "Disha", "Drishti", "Garima", "Gayatri",
    "Geeta", "Gauri", "Gunjan", "Harini", "Harshita", "Himani", "Indira",
    "Ishani", "Ishita", "Jagriti", "Jaya", "Jyoti", "Kajol", "Kalpana",
    "Kamini", "Kanika", "Karishma", "Kashish", "Komal", "Kritika", "Lavanya",
    "Leela", "Madhavi", "Madhuri", "Mahima", "Malini", "Mallika", "Mamta",
    "Manisha", "Megha", "Mitali", "Monika", "Muskan", "Naina", "Nalini",
    "Namrata", "Nandini", "Neelam", "Neetu", "Nikita", "Nimisha", "Nirupama",
    "Pallavi", "Payal", "Prachi", "Pragya", "Pratibha", "Preeti", "Prerana",
    "Radha", "Radhika", "Ragini", "Rakhi", "Rashmi", "Reena", "Renuka",
    "Richa", "Ritu", "Roshni", "Rupal", "Sakshi", "Saloni", "Samiksha",
    "Sandhya", "Sangita", "Sanjana", "Sapna", "Sarita", "Seema", "Shalini",
    "Sharanya", "Sheetal", "Shikha", "Shivani", "Shraddha", "Shweta", "Simran",
    "Smriti", "Sonal", "Sonali", "Srishti", "Sunita", "Supriya", "Sushmita",
    "Tejaswini", "Urvashi", "Vaishnavi", "Vandita", "Varsha", "Vedika", "Yamini"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Singh", "Kumar", "Rao", "Nair", "Gupta",
    "Joshi", "Reddy", "Mehta", "Roy", "Pillai", "Agarwal", "Mishra", "Kulkarni",
    "Tripathi", "Das", "Sen", "Hegde", "Deshmukh", "Saxena", "Pandey", "Bhat",
    "Nambiar", "Choudhury", "Bhattacharya", "Mukherjee", "Bose", "Chatterjee",
    "Ghosh", "Dutta", "Banerjee", "Iyer", "Srinivasan", "Raman", "Menon",
    "Chawla", "Kapoor", "Malhotra", "Khanna", "Sethi", "Bajaj", "Singhania",
    "Mittal", "Jain", "Goyal", "Shah", "Modi", "Bansal", "Mahajan", "Kashyap",
    "Bhardwaj", "Trivedi", "Dwivedi", "Upadhyay", "Tiwari", "Shukla", "Pandit",
    "Chauhan", "Thakur", "Rathore", "Solanki", "Chaudhary", "Yadav", "Lodha",
    "Khatri", "Soni", "Parekh", "Desai", "Vyas", "Panchal", "Bhatt", "Patil",
    "Jadhav", "Shinde", "Pawar", "Kadam", "Sawant", "Chavan", "Gaekwad"
]

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
RELATIONS = ["Uncle", "Aunt", "Grandparent", "Mother", "Father", "Government", "None"]
SCHOOLS = [
    "Government Primary School",
    "St. Mary's Convent School",
    "City Public School",
    "Kendriya Vidyalaya",
    "National Open Model School",
    "Vidya Mandir Trust School",
    "Sunshine Model Public School",
    "Holy Cross Academy",
    "Greenwood Foundation School",
    "Mother Teresa Community School"
]

SUBJECTS = ["Mathematics", "Science", "English", "Social Studies"]

def seed_to_500():
    current_count = Child.objects.count()
    target_count = 500
    needed = target_count - current_count

    print(f"Current children count: {current_count}")
    if needed <= 0:
        print(f"Database already has {current_count} children. Target 500 already reached or exceeded.")
        return

    print(f"Adding {needed} children to reach a total of {target_count} children...")

    # Fetch reference doctors and teachers
    doctor = Users.objects.filter(designation__icontains='doctor').first()
    teacher = Users.objects.filter(designation__icontains='teacher').first()
    admin_user = Users.objects.filter(designation__icontains='admin').first() or Users.objects.first()

    existing_names = set(Child.objects.values_list('full_name', flat=True))

    today = date.today()
    created_count = 0

    batch_children = []
    
    # Generate needed unique names
    generated_names = []
    attempts = 0
    while len(generated_names) < needed and attempts < 10000:
        attempts += 1
        is_female = (random.random() < 0.48)
        first = random.choice(FEMALE_FIRST_NAMES if is_female else MALE_FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        full_name = f"{first} {last}"
        
        # If collision, try with middle initial
        if full_name in existing_names or full_name in [n[0] for n in generated_names]:
            initial = chr(random.randint(65, 90))
            full_name = f"{first} {initial}. {last}"

        if full_name not in existing_names and full_name not in [n[0] for n in generated_names]:
            generated_names.append((full_name, "Female" if is_female else "Male"))

    print(f"Generated {len(generated_names)} unique identities.")

    # Dates for attendance
    att_dates = [
        today - timedelta(days=4),
        today - timedelta(days=3),
        today - timedelta(days=2),
        today - timedelta(days=1),
        today
    ]

    for idx, (full_name, gender) in enumerate(generated_names, start=1):
        # Age between 4 and 16
        age_years = random.randint(4, 16)
        birth_year = today.year - age_years
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        dob = date(birth_year, birth_month, birth_day)

        # Admission date: at least 1 year after birth, between 2020 and 2026
        adm_year = min(today.year, max(dob.year + 2, random.randint(2020, 2026)))
        adm_month = random.randint(1, 12)
        adm_day = random.randint(1, 28)
        adm_date = date(adm_year, adm_month, adm_day)
        if adm_date > today:
            adm_date = today - timedelta(days=random.randint(10, 180))

        relation = random.choice(RELATIONS)
        if relation in ['None', 'Government']:
            guardian_name = "Department of Child Welfare"
        else:
            g_first = random.choice(MALE_FIRST_NAMES if random.random() < 0.5 else FEMALE_FIRST_NAMES)
            guardian_name = f"{g_first} {full_name.split()[-1]}"

        blood_group = random.choice(BLOOD_GROUPS)
        prev_school = random.choice(SCHOOLS)
        aadhar_num = f"{random.randint(2000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}"

        status = "Active" if random.random() < 0.96 else random.choice(["Adopted", "Transferred"])

        # Create Child
        child = Child.objects.create(
            full_name=full_name,
            date_of_birth=dob,
            gender=gender,
            admission_date=adm_date,
            guardian_name=guardian_name,
            guardian_relation=relation,
            blood_group=blood_group,
            aadhar_number=aadhar_num,
            previous_school=prev_school,
            status=status
        )

        # 1. Create linked Users & Login
        clean_name = ''.join(c.lower() for c in full_name if c.isalnum() or c == ' ').replace(' ', '.')
        phone_key = f"child_{child.child_id}"[:15]
        user_obj, _ = Users.objects.get_or_create(
            phone_number=phone_key,
            defaults={
                'full_name': full_name,
                'gender': gender,
                'address': 'Orphanage Resident Block',
                'designation': 'child',
                'status': status
            }
        )

        login_email = f"child{child.child_id}@child.orphanage.com"
        if not Login.objects.filter(email=login_email).exists():
            Login.objects.create(
                email=login_email,
                password="Student@123",
                role="child",
                status="Active",
                user=user_obj
            )

        # 2. Create Health Record
        # Height based roughly on age: 80cm + age * 6cm + variance
        height = round(min(178.0, max(85.0, 75.0 + (age_years * 6.2) + random.uniform(-4, 4))), 1)
        # Weight based roughly on height: BMI between 15.5 and 22.5
        target_bmi = random.uniform(16.0, 21.0)
        weight = round(target_bmi * ((height / 100.0) ** 2), 1)
        computed_bmi = round(weight / ((height / 100.0) ** 2), 1)

        health_status = "Healthy" if computed_bmi >= 16.0 else "Mild Risk"

        Health.objects.create(
            child=child,
            height_cm=height,
            weight_kg=weight,
            bmi=computed_bmi,
            checkup_date=today - timedelta(days=random.randint(5, 60)),
            medical_history="No chronic conditions" if random.random() < 0.9 else "Mild seasonal asthma",
            vaccination_status="Up to Date",
            allergies="None reported" if random.random() < 0.85 else "Dust allergy",
            medications="None" if health_status == "Healthy" else "Multivitamin supplement",
            doctor_remarks="Normal developmental trajectory, active and attentive.",
            doctor=doctor,
            notes="Routine pediatric examination completed.",
            status=health_status
        )

        # 3. Create Education Records
        if age_years >= 5:
            class_num = min(12, max(1, age_years - 5))
            class_str = f"Class {class_num}"
            for subj in SUBJECTS:
                base_score = random.uniform(50.0, 92.0)
                marks_val = round(min(99.0, max(35.0, base_score + random.uniform(-8, 8))), 1)
                Education.objects.create(
                    child=child,
                    class_name=class_str,
                    subject=subj,
                    marks=marks_val,
                    exam_marks=marks_val,
                    term="Quarterly Assessment 2026",
                    teacher=teacher,
                    exam_date=today - timedelta(days=random.randint(15, 75)),
                    remarks="Consistent performance" if marks_val >= 60 else "Recommended remedial tutoring"
                )

        # 4. Create Attendance Records for last 5 days
        for a_date in att_dates:
            roll = random.random()
            att_stat = "Present" if roll < 0.90 else ("Leave" if roll < 0.96 else "Absent")
            Attendance.objects.create(
                child=child,
                attendance_date=a_date,
                attendance_status=att_stat,
                marked_by=admin_user
            )

        # 5. Create Behaviour Record
        Behaviour.objects.create(
            child=child,
            recorded_by=admin_user,
            observation_date=today - timedelta(days=random.randint(2, 30)),
            behaviour_category=random.choice(["Social", "Emotional", "Extracurricular", "Academic"]),
            incident_count=0 if random.random() < 0.9 else 1,
            interaction_score=round(random.uniform(7.0, 9.8), 1)
        )

        created_count += 1
        if created_count % 50 == 0 or created_count == needed:
            print(f"Progress: {created_count}/{needed} children created...")

    # Cleanup duplicate Ajay D alerts so dashboard displays clean, distinct child alerts
    print("--- Cleaning up duplicate Ajay D alerts ---")
    ajay_alerts = list(Alert.objects.filter(child__full_name="Ajay D", alert_type="Academic").order_by('alert_id'))
    if len(ajay_alerts) > 1:
        # Keep the newest one, delete the earlier duplicates
        to_delete = [a.alert_id for a in ajay_alerts[:-1]]
        deleted_cnt, _ = Alert.objects.filter(alert_id__in=to_delete).delete()
        print(f"Deleted {deleted_cnt} duplicate Ajay D alert records.")

    final_count = Child.objects.count()
    print(f"\nSuccessfully completed! Total children in database: {final_count}")

if __name__ == '__main__':
    seed_to_500()
