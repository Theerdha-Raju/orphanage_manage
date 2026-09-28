import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from api.models import Login

logins = Login.objects.all().values('email', 'role', 'password').order_by('role')
for l in logins:
    print(l['role'], '|', l['email'], '|', l['password'])
