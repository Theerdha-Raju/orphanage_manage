"""
Seed script to populate enhancements for:
- Behaviour records for all children
- Assignment, internal, and exam marks on Education
- BMI, vaccination status, and doctor remarks on Health
- Priority, assigned staff, and resolution status on Alerts
- Purpose, receipt numbers, and payment methods on Donations
"""

import os
import sys
import django
import random
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import (
    Child, Users, Login, Education, Health, Behaviour, Alert, Donation, Achievement
)

def run_seed():
    print("Starting data enhancements seeding...")

    # 1. Fetch staff members
    caregiver = Users.objects.filter(designation__icontains='caregiver').first() or Users.objects.filter(designation__icontains='staff').first()
    teacher = Users.objects.filter(designation__icontains='teacher').first() or caregiver
    doctor = Users.objects.filter(designation__icontains='doctor').first() or caregiver

    children = list(Child.objects.all())
    print(f"Found {len(children)} children.")

    # 2. Seed Behaviour Records
    behaviour_templates = [
        {
            "category": "Social",
            "obs": "Interacts cooperatively with peers during common hall activities; shared art materials generously.",
            "remarks": "Child exhibits positive social bonding and empathy with younger residents.",
            "social": "Group story circle, board games, community dinner prep",
            "extra": "Origami club, morning yoga",
            "score": 8.5,
            "incidents": 0,
            "participation": "High"
        },
        {
            "category": "Academic",
            "obs": "Engages attentively during study hours; actively asked questions during science practicals.",
            "remarks": "Shows strong curiosity and focus when given hands-on tasks.",
            "social": "Science study group, library book club",
            "extra": "Chess club, robotics workshop",
            "score": 9.0,
            "incidents": 0,
            "participation": "High"
        },
        {
            "category": "Extracurricular",
            "obs": "Demonstrated enthusiasm during football practice; assisted team coach with equipment setup.",
            "remarks": "Great energy and team spirit. Channeling focus effectively through sports.",
            "social": "Sports squad, dormitory maintenance team",
            "extra": "Junior football team, track & field",
            "score": 8.0,
            "incidents": 0,
            "participation": "High"
        },
        {
            "category": "Discipline",
            "obs": "Followed evening routine punctually. Minor reluctance during morning quiet study period resolved smoothly.",
            "remarks": "Responded well to gentle verbal encouragement and completed daily reading quota.",
            "social": "Dining hall duty, evening reflection circle",
            "extra": "Gardening, drawing",
            "score": 7.0,
            "incidents": 1,
            "participation": "Medium"
        },
        {
            "category": "Emotional",
            "obs": "Expressive and cheerful throughout the week. Shared excitement about upcoming annual function.",
            "remarks": "Emotionally resilient and responsive to caregiver guidance.",
            "social": "Music choir, cultural drama rehearsals",
            "extra": "Classical vocal practice, sketching",
            "score": 8.5,
            "incidents": 0,
            "participation": "High"
        }
    ]

    new_behav_count = 0
    today = date.today()
    for child in children:
        existing_count = Behaviour.objects.filter(child=child).count()
        if existing_count < 3:
            for i in range(3):
                tpl = behaviour_templates[(child.child_id + i) % len(behaviour_templates)]
                obs_date = today - timedelta(days=(i * 12 + random.randint(1, 5)))
                Behaviour.objects.create(
                    child=child,
                    recorded_by=caregiver,
                    observation_date=obs_date,
                    behaviour_category=tpl["category"],
                    incident_count=tpl["incidents"],
                    interaction_score=tpl["score"],
                    participation_level=tpl["participation"],
                    social_activities=tpl["social"],
                    extracurricular_activities=tpl["extra"],
                    observations=tpl["obs"],
                    caregiver_remarks=tpl["remarks"],
                    recommended_intervention="Continue positive reinforcement in peer groups." if tpl["score"] >= 8 else "Provide guided mentorship in quiet study blocks."
                )
                new_behav_count += 1
    print(f"Created {new_behav_count} new behaviour observation records.")

    # 3. Enhance Education Records (Assignment, Internal, Exam Marks, Term, Teacher)
    edu_updated = 0
    for edu in Education.objects.all():
        modified = False
        m = float(edu.marks or 70.0)

        if edu.assignment_marks is None:
            edu.assignment_marks = round(min(100.0, max(20.0, m + random.uniform(-4, 6))), 1)
            modified = True
        if edu.internal_marks is None:
            edu.internal_marks = round(min(100.0, max(20.0, m + random.uniform(-5, 4))), 1)
            modified = True
        if edu.exam_marks is None:
            edu.exam_marks = round(m, 1)
            modified = True
        if not edu.term:
            edu.term = "Term 2 Evaluation" if (edu.education_id % 2 == 0) else "Mid-Term Examination"
            modified = True
        if not edu.teacher and teacher:
            edu.teacher = teacher
            modified = True

        if modified:
            edu.save()
            edu_updated += 1
    print(f"Enhanced {edu_updated} education records with assignment, internal, and exam breakdowns.")

    # 4. Enhance Health Records (BMI, Vaccination, Doctor Remarks)
    health_updated = 0
    vacc_options = ["Up to Date (BCG, Polio, MMR, HepB)", "Up to Date (All Scheduled Doses)", "Annual Booster Pending"]
    allergies_options = [None, "None Known", "Dust / Pollen Sensitivity (Mild)", "None", "Mild Lactose Sensitivity"]

    for h in Health.objects.all():
        modified = False
        h_m = float(h.height_cm) / 100.0 if h.height_cm else 1.25
        w_kg = float(h.weight_kg) if h.weight_kg else 28.0
        
        calc_bmi = round(w_kg / (h_m * h_m), 1) if h_m > 0 else 18.0
        if h.bmi is None or float(h.bmi) == 0:
            h.bmi = calc_bmi
            modified = True

        if not h.vaccination_status:
            h.vaccination_status = vacc_options[h.health_id % len(vacc_options)]
            modified = True

        if not h.allergies:
            h.allergies = allergies_options[h.health_id % len(allergies_options)]
            modified = True

        if not h.medical_history:
            h.medical_history = "No chronic medical conditions. Normal developmental milestones."
            modified = True

        if not h.doctor_remarks:
            h.doctor_remarks = "General health satisfactory. Regular outdoor exercise and seasonal fruit intake recommended."
            modified = True

        if not h.doctor and doctor:
            h.doctor = doctor
            modified = True

        if modified:
            h.save()
            health_updated += 1
    print(f"Enhanced {health_updated} health records with BMI, vaccination status, and doctor remarks.")

    # 5. Enhance Alerts (Priority, Assigned Staff)
    alert_updated = 0
    for a in Alert.objects.all():
        modified = False
        if not a.priority:
            msg_lower = (a.message or '').lower()
            if 'critical' in msg_lower or 'high' in msg_lower:
                a.priority = 'High'
            elif 'warning' in msg_lower or 'moderate' in msg_lower:
                a.priority = 'Medium'
            else:
                a.priority = 'Low'
            modified = True

        if not a.assigned_to:
            if 'health' in a.alert_type.lower() and doctor:
                a.assigned_to = doctor
            elif 'academic' in a.alert_type.lower() and teacher:
                a.assigned_to = teacher
            elif caregiver:
                a.assigned_to = caregiver
            modified = True

        if modified:
            a.save()
            alert_updated += 1
    print(f"Enhanced {alert_updated} alerts with priority and assigned staff.")

    # 6. Enhance Donations (Purpose, Receipt, Payment Method)
    donation_updated = 0
    purposes = ["Education & Books", "Healthcare & Nutrition", "Child Welfare & Recreation", "Infrastructure & Winter Clothing"]
    payment_methods = ["UPI / NetBanking", "Bank Direct Transfer", "Corporate CSR Cheque", "Card Payment"]

    for d in Donation.objects.all():
        modified = False
        if not d.purpose or d.purpose == 'General Welfare':
            d.purpose = purposes[d.donation_id % len(purposes)]
            modified = True
        if not d.receipt_number:
            d.receipt_number = f"HN-REC-2026-{1000 + d.donation_id}"
            modified = True
        if not d.payment_method:
            d.payment_method = payment_methods[d.donation_id % len(payment_methods)]
            modified = True

        if modified:
            d.save()
            donation_updated += 1
    print(f"Enhanced {donation_updated} donations with purpose, receipt numbers, and payment methods.")

    print("Data enhancements seeding finished successfully.")

if __name__ == '__main__':
    run_seed()
