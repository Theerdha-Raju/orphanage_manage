import urllib.request
import json

data = json.dumps({"email": "donor@orphanage.com", "password": "Donor@123"}).encode()
req = urllib.request.Request(
    "http://localhost:8000/api/auth/login/",
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    with urllib.request.urlopen(req) as resp:
        print("Status:", resp.status)
        print("Response:", resp.read().decode())
except urllib.error.HTTPError as e:
    print("Error:", e.code, e.read().decode())
except Exception as e:
    print("Exception:", e)
