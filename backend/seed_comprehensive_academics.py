import os
import django
from datetime import date, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Users, Login, Child, Education, Health, Attendance, Achievement

def seed_all_student_data():
    print("=== 1. Ensuring Leo Carter Child Record exists ===")
    leo_child, created = Child.objects.get_or_create(
        full_name='Leo Carter',
        defaults={
            'date_of_birth': date(2014, 5, 12),
            'gender': 'Male',
            'admission_date': date(2022, 6, 1),
            'blood_group': 'A+',
            'status': 'Active',
            'guardian_name': 'HopeNest Trust',
            'previous_school': 'City Elementary',
            'photo': '/media/children/default_boy.jpg'
        }
    )
    if created:
        print("Created Child record for Leo Carter (ID:", leo_child.child_id, ")")
    else:
        print("Leo Carter Child record exists (ID:", leo_child.child_id, ")")

    # Link Leo's user account
    leo_user = Users.objects.filter(full_name='Leo Carter').first()
    if leo_user:
        leo_user.phone_number = f"child_{leo_child.child_id}"
        leo_user.save()

    all_children = list(Child.objects.all().order_by('child_id'))
    print(f"\n=== 2. Seeding Academic Records for {len(all_children)} Children ===")

    # Define standard subjects and remarks templates
    subject_templates = [
        ("Mathematics", "Strong analytical skills and quick problem-solving in mental math."),
        ("General Science", "Enthusiastic participation in lab experiments and natural sciences."),
        ("English Language", "Strong comprehension skills and excellent creative essay writing."),
        ("Social Studies", "Demonstrates good grasp of history timelines and civic concepts."),
        ("Computer Science", "Rapid progress in keyboarding, coding logic, and internet research."),
        ("Environmental Studies", "Active member in campus botanical garden and ecology projects.")
    ]

    # Specific profile for Rohan Kumar (child_id 4)
    rohan_scores = {
        "Mathematics": (84.0, "Outstanding logic in algebra and geometry exercises."),
        "General Science": (79.5, "Strong conceptual clarity in physics and chemistry demonstrations."),
        "English Language": (76.0, "Good comprehension; working on expressive vocabulary building."),
        "Social Studies": (81.5, "High interest in world history and geographical map studies."),
        "Computer Science": (88.0, "Quick learner in beginner algorithms and multimedia editing."),
        "Environmental Studies": (75.0, "Passionate about recycling projects and campus tree planting.")
    }

    # Specific profile for Leo Carter
    leo_scores = {
        "Mathematics": (82.5, "Consistent homework completion and high quiz performance."),
        "General Science": (86.0, "Excellent curiosity during science club activities."),
        "English Language": (79.0, "Strong phonics and eloquent speech presentation."),
        "Social Studies": (77.5, "Good understanding of environmental preservation."),
        "Computer Science": (85.0, "Displays solid understanding of computer hardware and software."),
        "Environmental Studies": (79.5, "Shows great teamwork in environmental care workshops.")
    }

    for child in all_children:
        class_str = f"Class {random.choice([4, 5, 6, 7])} - Sec A"

        if child.child_id == 4: # Rohan Kumar
            Education.objects.filter(child=child).delete()
            for subj, (marks, remark) in rohan_scores.items():
                Education.objects.create(
                    child=child,
                    class_name="Class 5 - Sec A",
                    subject=subj,
                    marks=marks,
                    exam_date=date(2026, 8, 20),
                    remarks=remark
                )
            print(f"Seeded 6 subjects for Rohan Kumar (ID 4)")
        elif child.full_name == 'Leo Carter':
            Education.objects.filter(child=child).delete()
            for subj, (marks, remark) in leo_scores.items():
                Education.objects.create(
                    child=child,
                    class_name="Class 5 - Sec B",
                    subject=subj,
                    marks=marks,
                    exam_date=date(2026, 8, 20),
                    remarks=remark
                )
            print(f"Seeded 6 subjects for Leo Carter (ID {child.child_id})")
        else:
            # If child has less than 4 subjects, fill them up
            existing_count = Education.objects.filter(child=child).count()
            if existing_count < 4:
                Education.objects.filter(child=child).delete()
                for subj, default_remark in subject_templates:
                    score = round(random.uniform(70.0, 92.0), 1)
                    Education.objects.create(
                        child=child,
                        class_name=class_str,
                        subject=subj,
                        marks=score,
                        exam_date=date(2026, 8, 15) + timedelta(days=random.randint(1, 10)),
                        remarks=default_remark
                    )

    print("\n=== 3. Seeding Health Records ===")
    for child in all_children:
        h = Health.objects.filter(child=child).first()
        if not h:
            Health.objects.create(
                child=child,
                height_cm=round(random.uniform(130.0, 155.0), 1),
                weight_kg=round(random.uniform(32.0, 48.0), 1),
                checkup_date=date(2026, 8, 10) + timedelta(days=random.randint(1, 15)),
                status='Healthy',
                notes='General physical vitals normal. Vision and dental checks clear. Vaccinations up-to-date.'
            )
    print("Health records updated for all children.")

    print("\n=== 4. Seeding Attendance Records ===")
    admin_user = Users.objects.filter(designation='admin').first()
    # Seed 30 days of attendance for each child
    base_date = date(2026, 8, 1)
    for child in all_children:
        att_count = Attendance.objects.filter(child=child).count()
        if att_count < 20:
            for day_offset in range(25):
                curr_date = base_date + timedelta(days=day_offset)
                if curr_date.weekday() >= 5: # skip weekends
                    continue
                # Attendance distribution: Present ~90%, Leave ~6%, Absent ~4%
                rnd_val = random.random()
                if rnd_val < 0.90:
                    att_status = 'Present'
                elif rnd_val < 0.96:
                    att_status = 'Leave'
                else:
                    att_status = 'Absent'
                Attendance.objects.get_or_create(
                    child=child,
                    attendance_date=curr_date,
                    defaults={
                        'attendance_status': att_status,
                        'marked_by': admin_user
                    }
                )
    print("Attendance records populated for all children.")

    print("\n=== 5. Seeding Achievements for Rohan Kumar & Leo Carter ===")
    rohan_child = Child.objects.filter(child_id=4).first()
    if rohan_child:
        Achievement.objects.get_or_create(
            child=rohan_child,
            title='1st Place - Inter-School Science Fair 2026',
            defaults={
                'description': 'Designed an innovative solar-powered drip irrigation model that won top honors.',
                'achievement_date': date(2026, 8, 18),
                'category': 'Academic'
            }
        )
        Achievement.objects.get_or_create(
            child=rohan_child,
            title='Math Star of the Month (August 2026)',
            defaults={
                'description': 'Maintained a 100% score on weekly speed-math and logical reasoning quizzes.',
                'achievement_date': date(2026, 8, 28),
                'category': 'Academic'
            }
        )
        Achievement.objects.get_or_create(
            child=rohan_child,
            title='Junior Football Tournament Runner-Up',
            defaults={
                'description': 'Key mid-fielder representation in the City Youth Inter-Wing Championship.',
                'achievement_date': date(2026, 7, 30),
                'category': 'Sports'
            }
        )
        print("Seeded achievements for Rohan Kumar.")

    leo_child_obj = Child.objects.filter(full_name='Leo Carter').first()
    if leo_child_obj:
        Achievement.objects.get_or_create(
            child=leo_child_obj,
            title='Best Orator & Debate Award',
            defaults={
                'description': 'Represented HopeNest in the regional youth debate on Environmental Sustainability.',
                'achievement_date': date(2026, 8, 14),
                'category': 'Academic'
            }
        )

    print("\nAll student data seeded successfully!")

if __name__ == '__main__':
    seed_all_student_data()
