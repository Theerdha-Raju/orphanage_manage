import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Volunteer, VolunteerAssignment, Login

def seed_tasks():
    print("Seeding volunteer tasks...")
    
    # 1. Ensure Login credentials for all volunteers
    vols = Volunteer.objects.all()
    for v in vols:
        if v.email:
            first = (v.full_name or 'Vol').strip().split()[0]
            first = ''.join(c for c in first if c.isalpha()) or 'Vol'
            pwd = f"{first}@Vol123"
            
            login_obj = Login.objects.filter(email__iexact=v.email).first()
            if not login_obj:
                Login.objects.create(
                    email=v.email,
                    password=pwd,
                    role='volunteer',
                    status='Active',
                    user_id=1
                )
                print(f"Created login for {v.email} -> Password: {pwd}")

    # 2. Clear old test assignments and create rich assignments
    VolunteerAssignment.objects.all().delete()

    task_data = [
        {
            "vol_email": "rahul.singh@volunteer.orphanage.com",
            "vol_name": "Rahul Singh",
            "event_name": "Grade 5 Mathematics Remedial Class",
            "description": "Conduct 2-hour interactive math session focusing on fractions and long division.",
            "assigned_date": "2026-08-25",
            "due_date": "2026-08-30",
            "location": "Education Center - Room 3",
            "assigned_by": "Academic Head",
            "instructions": "Use visual fraction charts and conduct a 15-minute quick quiz at the end of class.",
            "status": "Pending"
        },
        {
            "vol_email": "rahul.singh@volunteer.orphanage.com",
            "vol_name": "Rahul Singh",
            "event_name": "Science Exhibition Model Mentorship",
            "description": "Guide Class 6 children on building renewable solar energy models.",
            "assigned_date": "2026-08-20",
            "due_date": "2026-08-29",
            "location": "Science & Innovation Lab",
            "assigned_by": "Admin Office",
            "instructions": "Assist students with wiring solar cells and testing motor outputs.",
            "status": "In Progress"
        },
        {
            "vol_email": "anita.desai@volunteer.orphanage.com",
            "vol_name": "Anita Desai",
            "event_name": "English Vocabulary & Story Reading Workshop",
            "description": "Conduct interactive story reading session for Class 3 & 4 children.",
            "assigned_date": "2026-08-24",
            "due_date": "2026-08-31",
            "location": "Orphanage Library",
            "assigned_by": "Education Coordinator",
            "instructions": "Read 'The Lion & The Mouse' storybook and conduct vocabulary flashcard exercises.",
            "status": "In Progress"
        },
        {
            "vol_email": "priya.verma@volunteer.orphanage.com",
            "vol_name": "Priya Verma",
            "event_name": "Watercolor Painting & Creative Art Workshop",
            "description": "Teach basic color mixing and landscape painting to primary grade children.",
            "assigned_date": "2026-08-26",
            "due_date": "2026-09-01",
            "location": "Art & Activity Hall",
            "assigned_by": "Care Coordinator",
            "instructions": "Distribute brushes, watercolors, and drawing sheets. Ensure clean cleanup after session.",
            "status": "Pending"
        },
        {
            "vol_email": "vikram.patel@outlook.com",
            "vol_name": "Vikram Patel",
            "event_name": "Inter-Wing Football Tournament & Drills",
            "description": "Organize outdoor football training, fitness drills, and friendly match fixtures.",
            "assigned_date": "2026-08-22",
            "due_date": "2026-08-28",
            "location": "Main Sports Ground",
            "assigned_by": "Sports Director",
            "instructions": "Lead 15-min warm-up stretch, practice passing drills, and referee 2 match halves.",
            "status": "In Progress"
        },
        {
            "vol_email": "siddharth.roy@gmail.com",
            "vol_name": "Siddharth Roy",
            "event_name": "Scratch Coding & Computer Literacy Class",
            "description": "Teach basic computer operations and Scratch drag-and-drop programming concepts.",
            "assigned_date": "2026-08-24",
            "due_date": "2026-08-30",
            "location": "IT Computer Lab",
            "assigned_by": "Tech Coordinator",
            "instructions": "Help students create their first animated sprite game using Scratch blocks.",
            "status": "Pending"
        },
        {
            "vol_email": "deepa6@gmail.com",
            "vol_name": "Deepa",
            "event_name": "Evening Homework Supervision & Mentoring",
            "description": "Supervise evening quiet study hour and help children complete daily school homework.",
            "assigned_date": "2026-08-15",
            "due_date": "2026-08-18",
            "location": "Study Center Room B",
            "assigned_by": "Staff Nurse",
            "instructions": "Verify homework logs and clear student doubts in Science and Social Studies.",
            "status": "Completed"
        }
    ]

    for t in task_data:
        vol = Volunteer.objects.filter(email__iexact=t["vol_email"]).first()
        if not vol:
            vol = Volunteer.objects.filter(full_name__icontains=t["vol_name"]).first()
        if not vol:
            vol = Volunteer.objects.first()

        if vol:
            assignment = VolunteerAssignment.objects.create(
                volunteer=vol,
                event_name=t["event_name"],
                description=t["description"],
                assigned_date=t["assigned_date"],
                due_date=t["due_date"],
                location=t["location"],
                assigned_by=t["assigned_by"],
                instructions=t["instructions"],
                status=t["status"]
            )
            print(f"Created Task #{assignment.assignment_id}: '{t['event_name']}' assigned to {vol.full_name} ({t['status']})")

    print("\nSuccessfully seeded volunteer tasks!")

if __name__ == '__main__':
    seed_tasks()
