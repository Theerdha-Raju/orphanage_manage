import urllib.request
import json

test_users = [
    ('admin@orphanage.com', 'Admin@123', 'admin'),
    ('staff@orphanage.com', 'Staff@123', 'staff'),
    ('donor@orphanage.com', 'Donor@123', 'donor'),
    ('volunteer@orphanage.com', 'Volunteer@123', 'volunteer'),
    ('volunteer@orphanage.com', 'Vol@123', 'volunteer'),
    ('student@orphanage.com', 'Student@123', 'child'),
    ('child@orphanage.com', 'Student@123', 'child'),
    ('doctor@orphanage.com', 'Doctor@123', 'doctor'),
    ('teacher@orphanage.com', 'Teacher@123', 'teacher'),
]

all_passed = True
for email, pwd, expected_role in test_users:
    data = json.dumps({'email': email, 'password': pwd}).encode()
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/login/',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode())
            role = body.get('role')
            name = body.get('name')
            print(f"PASS: {email:30} | Role: {role:10} | Name: {name}")
    except Exception as e:
        print(f"FAIL: {email:30} | Error: {e}")
        all_passed = False

print("\n--- Summary ---")
print("All users connected successfully:", all_passed)
