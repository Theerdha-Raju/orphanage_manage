import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Volunteer, VolunteerAssignment, Login, Users

def seed_tasks():
    print("Seeding volunteer tasks and profiles...")
    
    # 1. Ensure dedicated default volunteer exists
    default_vol = Volunteer.objects.filter(email__iexact='volunteer@orphanage.com').first()
    if not default_vol:
        default_vol = Volunteer.objects.create(
            full_name='Rahul Singh',
            phone_number='+91 98765 43210',
            email='volunteer@orphanage.com',
            address='Room 12, Volunteer Quarters, Orphanage Campus',
            skills='Mathematics Tutoring, STEM Mentorship, Basic First Aid',
            areas_of_interest='Education, Computer Learning, Extracurricular',
            availability='Weekends & Evenings',
            status='Active'
        )
    else:
        default_vol.full_name = 'Rahul Singh'
        default_vol.phone_number = default_vol.phone_number or '+91 98765 43210'
        default_vol.skills = default_vol.skills or 'Mathematics Tutoring, STEM Mentorship, Basic First Aid'
        default_vol.areas_of_interest = 'Education, Computer Learning, Extracurricular'
        default_vol.availability = default_vol.availability or 'Weekends & Evenings'
        default_vol.status = 'Active'
        default_vol.save()

    # Ensure associated User and Login
    usr = Users.objects.filter(full_name=default_vol.full_name).first()
    if not usr:
        usr = Users.objects.create(
            full_name=default_vol.full_name,
            phone_number=default_vol.phone_number or 'vol_default',
            gender='Male',
            address=default_vol.address or '',
            designation='volunteer',
            status='Active'
        )

    logins_to_ensure = [
        ('volunteer@orphanage.com', 'Volunteer@123', default_vol.full_name),
        ('rahul.singh@volunteer.orphanage.com', 'Rahul@Vol123', 'Rahul Singh'),
        ('anita.desai@volunteer.orphanage.com', 'Anita@Vol123', 'Anita Desai'),
        ('priya.verma@volunteer.orphanage.com', 'Priya@Vol123', 'Priya Verma'),
    ]

    for em, pwd, name in logins_to_ensure:
        v = Volunteer.objects.filter(email__iexact=em).first()
        if not v:
            v = Volunteer.objects.create(
                full_name=name,
                email=em,
                phone_number=f"+91 987{len(em)}0 12345",
                skills="Education, Arts, Sports",
                areas_of_interest="Education, Child Development",
                availability="Weekends",
                status="Active"
            )
        else:
            if not v.areas_of_interest:
                v.areas_of_interest = "Education, Child Mentorship, Sports"
                v.save()

        l = Login.objects.filter(email__iexact=em).first()
        if not l:
            Login.objects.create(
                email=em,
                password=pwd,
                role='volunteer',
                status='Active',
                user=usr
            )
        else:
            l.password = pwd
            l.role = 'volunteer'
            l.user = usr
            l.save()

    # 2. Re-create structured assignments
    VolunteerAssignment.objects.all().delete()

    activities_dataset = [
        {
            "vol_email": "volunteer@orphanage.com",
            "event_name": "Mathematics Learning Support",
            "description": "Conduct remedial mathematics tutoring for Class 5 students focusing on fractions, percentages, and basic algebra.",
            "activity_type": "Education",
            "priority": "High",
            "assigned_date": "2026-09-15",
            "scheduled_date": "2026-09-20",
            "due_date": "2026-09-20",
            "assigned_children": "5 Children",
            "location": "Education Center - Room 3",
            "assigned_by": "Academic Coordinator",
            "instructions": "Use interactive fraction cards and conduct a 10-minute mental arithmetic game.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "vol_email": "volunteer@orphanage.com",
            "event_name": "Arts and Crafts Activity",
            "description": "Engage primary group children in creative origami, clay modeling, and watercolor greeting card design.",
            "activity_type": "Extracurricular",
            "priority": "Medium",
            "assigned_date": "2026-09-18",
            "scheduled_date": "2026-09-22",
            "due_date": "2026-09-22",
            "assigned_children": "8 Children",
            "location": "Activity Hall B",
            "assigned_by": "Child Care Lead",
            "instructions": "Distribute safe child-friendly art supplies. Ensure all children participate in the gallery display.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Supplies collected from main store. Children started working on origami models."
        },
        {
            "vol_email": "volunteer@orphanage.com",
            "event_name": "Sports Activity",
            "description": "Organize outdoor fitness drills, friendly football scrimmage, and team relay games.",
            "activity_type": "Sports",
            "priority": "Medium",
            "assigned_date": "2026-09-10",
            "scheduled_date": "2026-09-25",
            "due_date": "2026-09-25",
            "assigned_children": "10 Children",
            "location": "Campus Sports Ground",
            "assigned_by": "Physical Education Instructor",
            "instructions": "Lead warm-up stretches, emphasize fair play, and distribute hydration drinks during half-time.",
            "status": "Completed",
            "completion_date": "2026-09-25",
            "remarks": "Successfully organized football match. All 10 children showed great teamwork and high enthusiasm."
        },
        {
            "vol_email": "volunteer@orphanage.com",
            "event_name": "English Learning Support",
            "description": "Read illustrated storybooks and practice conversational English pronunciation with Class 4 learners.",
            "activity_type": "Education",
            "priority": "High",
            "assigned_date": "2026-09-21",
            "scheduled_date": "2026-09-28",
            "due_date": "2026-09-28",
            "assigned_children": "6 Children",
            "location": "Orphanage Library",
            "assigned_by": "Education Coordinator",
            "instructions": "Focus on vocabulary building and encourage each child to narrate one story paragraph.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "vol_email": "volunteer@orphanage.com",
            "event_name": "Computer Learning",
            "description": "Introduce basic computer skills, typing practice, and Scratch block-based animations.",
            "activity_type": "Computer Learning",
            "priority": "High",
            "assigned_date": "2026-09-22",
            "scheduled_date": "2026-09-30",
            "due_date": "2026-09-30",
            "assigned_children": "7 Children",
            "location": "IT & Computer Lab",
            "assigned_by": "Tech Coordinator",
            "instructions": "Guide students through moving sprite characters and creating interactive sounds in Scratch.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "vol_email": "volunteer@orphanage.com",
            "event_name": "Extracurricular Activity",
            "description": "Coordinate interactive drama workshop and group musical rhythm practice for upcoming festival.",
            "activity_type": "Extracurricular",
            "priority": "Low",
            "assigned_date": "2026-09-23",
            "scheduled_date": "2026-10-02",
            "due_date": "2026-10-02",
            "assigned_children": "12 Children",
            "location": "Main Auditorium",
            "assigned_by": "Cultural Secretary",
            "instructions": "Rehearse play script characters and coordinate stage prop preparation.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        # Also assign some to other volunteers for multi-user realism
        {
            "vol_email": "anita.desai@volunteer.orphanage.com",
            "event_name": "Grammar & Creative Writing Workshop",
            "description": "Sentence formation and short essay composition exercise for junior school students.",
            "activity_type": "Education",
            "priority": "Medium",
            "assigned_date": "2026-09-18",
            "scheduled_date": "2026-09-24",
            "due_date": "2026-09-24",
            "assigned_children": "6 Children",
            "location": "Reading Room A",
            "assigned_by": "Education Coordinator",
            "instructions": "Distribute notebooks and evaluate handwritten creative sentences.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Initial brainstorming round completed."
        },
        {
            "vol_email": "priya.verma@volunteer.orphanage.com",
            "event_name": "Clay Modeling & Sculpture Fun",
            "description": "Sensory development through colorful non-toxic clay animal figurines.",
            "activity_type": "Arts and Crafts",
            "priority": "Low",
            "assigned_date": "2026-09-19",
            "scheduled_date": "2026-09-26",
            "due_date": "2026-09-26",
            "assigned_children": "8 Children",
            "location": "Art Studio",
            "assigned_by": "Care Coordinator",
            "instructions": "Provide apron to each child and ensure cleanup after session.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        }
    ]

    for act in activities_dataset:
        vol = Volunteer.objects.filter(email__iexact=act["vol_email"]).first()
        if not vol:
            vol = default_vol

        created_act = VolunteerAssignment.objects.create(
            volunteer=vol,
            event_name=act["event_name"],
            description=act["description"],
            activity_type=act["activity_type"],
            priority=act["priority"],
            assigned_date=act["assigned_date"],
            scheduled_date=act["scheduled_date"],
            due_date=act["due_date"],
            assigned_children=act["assigned_children"],
            location=act["location"],
            assigned_by=act["assigned_by"],
            instructions=act["instructions"],
            status=act["status"],
            completion_date=act["completion_date"],
            remarks=act["remarks"],
            feedback=act["remarks"]
        )
        print(f"Created Activity #{created_act.assignment_id}: '{created_act.event_name}' ({created_act.activity_type}) -> {vol.full_name} [{created_act.status}]")

    print("\nVolunteer activities and logins successfully seeded!")

if __name__ == '__main__':
    seed_tasks()
