"""
seed_staff.py
=============
Seeds all real staff members into the database.
Run from the backend directory:
    python seed_staff.py

Each staff member gets:
  - A row in `users` table
  - A row in `login` table with email and password
  - Default password format: FirstName@Staff123  (e.g. Priya@Staff123)
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

# Staff to seed — (full_name, phone, gender, designation, email, password, role)
# role must be one of: staff | teacher | doctor
STAFF_LIST = [
    ('Priya Nair',       '9876543211', 'Female', 'staff',   'priya.nair@orphanage.com',       'Priya@Staff123',   'staff'),
    ('Heena Kausar',     '7907949368', 'Female', 'staff',   'heena.kausar@orphanage.com',     'Heena@Staff123',   'staff'),
    ('Dr. Rajesh Sharma','9876543210', 'Male',   'doctor',  'rajesh.sharma@orphanage.com',    'Rajesh@Doctor123', 'doctor'),
    ('Mr. Anand Rao',    '9876543212', 'Male',   'teacher', 'anand.rao@orphanage.com',        'Anand@Teacher123', 'teacher'),
    ('Ms. Lakshmi Iyer', '9876543213', 'Female', 'teacher', 'lakshmi.iyer@orphanage.com',     'Lakshmi@Teacher123','teacher'),
    ('Veena Kumari',     '9839977021', 'Female', 'staff',   'veena.kumari@orphanage.com',     'Veena@Staff123',   'staff'),
    ('Suresh Menon',     '9447123456', 'Male',   'staff',   'suresh.menon@orphanage.com',     'Suresh@Staff123',  'staff'),
]

def seed():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()

    added   = []
    skipped = []

    for (full_name, phone, gender, designation, email, password, role) in STAFF_LIST:
        # ── 1. Upsert into users ─────────────────────────────────────
        cur.execute("SELECT user_id FROM users WHERE phone_number = ?", (phone,))
        row = cur.fetchone()

        if row:
            user_id = row[0]
            # Update designation in case it changed
            cur.execute(
                "UPDATE users SET designation = ?, full_name = ? WHERE user_id = ?",
                (designation, full_name, user_id)
            )
        else:
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cur.execute(
                """INSERT INTO users (full_name, phone_number, gender, address, designation, status, created_at, updated_at)
                   VALUES (?, ?, ?, '', ?, 'Active', ?, ?)""",
                (full_name, phone, gender, designation, now, now)
            )
            user_id = cur.lastrowid

        # ── 2. Upsert into login ──────────────────────────────────────
        cur.execute("SELECT login_id FROM login WHERE email = ?", (email,))
        login_row = cur.fetchone()

        if login_row:
            # Update role/password in case they changed
            cur.execute(
                "UPDATE login SET role = ?, password = ?, user_id = ? WHERE email = ?",
                (role, password, user_id, email)
            )
            skipped.append(email)
        else:
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cur.execute(
                """INSERT INTO login (email, password, role, status, user_id, created_at, updated_at)
                   VALUES (?, ?, ?, 'Active', ?, ?, ?)""",
                (email, password, role, user_id, now, now)
            )
            added.append(email)

        # ── 3. Remove the old generic staff@orphanage.com ────────────
        cur.execute("DELETE FROM login WHERE email = 'staff@orphanage.com'")

    conn.commit()
    conn.close()

    print("\n[OK] Staff seeding complete!")
    print(f"   Added   : {added   or 'none (all already existed)'}")
    print(f"   Updated : {skipped or 'none'}")
    print("\n[Credentials]")
    print(f"{'Name':<22} {'Email':<36} {'Password':<20} {'Role'}")
    print("-" * 90)
    for (full_name, _, _, _, email, password, role) in STAFF_LIST:
        print(f"{full_name:<22} {email:<36} {password:<20} {role}")

if __name__ == '__main__':
    seed()
