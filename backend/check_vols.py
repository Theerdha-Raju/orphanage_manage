import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from api.models import Volunteer, VolunteerAssignment
from datetime import date

today = date.today()
print("Today is:", today)

for name in ["Rahul Singh", "Anita Desai"]:
    v = Volunteer.objects.filter(full_name=name).first()
    print(f"\n=== {v.full_name} (Vol {v.volunteer_id}) ===")
    for a in VolunteerAssignment.objects.filter(volunteer=v).order_by('-scheduled_date'):
        s_date = a.scheduled_date or a.due_date or a.assigned_date
        is_today = (s_date == today)
        is_upcoming = (s_date > today and a.status != 'Completed')
        print(f"[{a.assignment_id}] {a.event_name:<45} | Status: {a.status:<12} | Date: {s_date} | Today: {is_today} | Upcoming: {is_upcoming}")
