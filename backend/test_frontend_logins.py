import urllib.request, json

BASE = "http://127.0.0.1:8000/api/auth/login/"

tests = [
    {"email": "alexander.wright@orphanage.com", "password": "Admin@123", "role": "admin"},
    {"email": "sarah.jenkins@orphanage.com",    "password": "Staff@123",     "role": "staff"},
    {"email": "eleanor.vance@orphanage.com",    "password": "Donor@123",     "role": "donor"},
    {"email": "rahul.singh@orphanage.com",      "password": "Volunteer@123", "role": "volunteer"},
    {"email": "leo.carter@student.org",         "password": "Student@123",   "role": "child"},
    # Secondary accounts
    {"email": "neha.sharma@orphanage.com",      "password": "Admin@123",     "role": "admin"},
    {"email": "priya.nair@orphanage.com",       "password": "Priya@Staff123","role": "staff"},
    {"email": "anita.desai@yahoo.com",          "password": "Vol@123",       "role": "volunteer"},
    {"email": "aarav.sharma@student.org",       "password": "Student@123",   "role": "child"},
    {"email": "rajesh.mehta@mehta-foundation.org", "password": "Donor@123", "role": "donor"},
]

print(f"{'ROLE':12} | {'EMAIL':45} | RESULT")
print("-" * 90)
for t in tests:
    payload = json.dumps(t).encode()
    req = urllib.request.Request(BASE, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
            status = "OK" if data.get("success") else "FAIL"
            name = data.get("name", "?")
            print(f"{t['role']:12} | {t['email']:45} | {status} -> {name}")
    except Exception as ex:
        print(f"{t['role']:12} | {t['email']:45} | ERROR: {ex}")
