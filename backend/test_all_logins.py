import urllib.request
import json

test_users = [
    ('admin@orphanage.com',     'Admin@123',     'admin',     'Administrator'),
    ('staff@orphanage.com',     'Staff@123',     'staff',     'Caregiver/Staff'),
    ('donor@orphanage.com',     'Donor@123',     'donor',     'Donor/Sponsor'),
    ('volunteer@orphanage.com', 'Volunteer@123', 'volunteer', 'Volunteer'),
    ('volunteer@orphanage.com', 'Vol@123',       'volunteer', 'Volunteer (short pwd)'),
    ('student@orphanage.com',   'Student@123',   'child',     'Student'),
    ('child@orphanage.com',     'Student@123',   'child',     'Student (child alias)'),
    ('doctor@orphanage.com',    'Doctor@123',    'doctor',    'Doctor'),
    ('teacher@orphanage.com',   'Teacher@123',   'teacher',   'Teacher'),
]

print("==================================================")
print("TESTING VIA VITE DEV SERVER PROXY (Port 5173)")
print("==================================================")
all_proxy_passed = True
for email, pwd, expected_role, label in test_users:
    data = json.dumps({'email': email, 'password': pwd}).encode()
    req = urllib.request.Request(
        'http://127.0.0.1:5173/api/auth/login/',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode())
            role = body.get('role')
            name = body.get('name')
            status = "PASS" if role == expected_role else "FAIL (Role mismatch)"
            print(f"[{status}] {label:24} | Email: {email:26} | Role: {role:10} | Name: {name}")
    except Exception as e:
        print(f"[FAIL] {label:24} | Email: {email:26} | Error: {e}")
        all_proxy_passed = False

print("\nAll users verified through Vite Proxy:", all_proxy_passed)
