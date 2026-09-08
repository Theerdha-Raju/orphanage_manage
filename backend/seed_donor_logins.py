"""
seed_donor_logins.py
====================
Creates login accounts for all existing donors who don't have one yet.
Password format: FirstName@Donor123  (e.g. Mehta@Donor123)
Run from the backend directory:
    python seed_donor_logins.py
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

def make_password(full_name):
    first = full_name.strip().split()[0]
    # Remove special chars, keep alpha
    first = ''.join(c for c in first if c.isalpha())
    return f"{first}@Donor123"

def seed():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()

    cur.execute("SELECT donor_id, full_name, email FROM donor WHERE email IS NOT NULL AND email != ''")
    donors = cur.fetchall()

    added   = []
    skipped = []

    for (donor_id, full_name, email) in donors:
        # Skip if login already exists for this email
        cur.execute("SELECT login_id FROM login WHERE email = ?", (email,))
        if cur.fetchone():
            skipped.append(email)
            continue

        password = make_password(full_name)

        # We need a user_id — create a Users row for this donor
        cur.execute("SELECT user_id FROM users WHERE phone_number = ?", (f"donor_{donor_id}",))
        row = cur.fetchone()
        if row:
            user_id = row[0]
        else:
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cur.execute(
                """INSERT INTO users (full_name, phone_number, gender, address, designation, status, created_at, updated_at)
                   VALUES (?, ?, 'Other', '', 'donor', 'Active', ?, ?)""",
                (full_name, f"donor_{donor_id}", now, now)
            )
            user_id = cur.lastrowid

        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cur.execute(
            """INSERT INTO login (email, password, role, status, user_id, created_at, updated_at)
               VALUES (?, ?, 'donor', 'Active', ?, ?, ?)""",
            (email, password, user_id, now, now)
        )
        added.append((full_name, email, password))

    conn.commit()
    conn.close()

    print("\n[OK] Donor login seeding complete!")
    print(f"   Skipped (already have login): {skipped or 'none'}")
    print(f"\n[New accounts created: {len(added)}]")
    if added:
        print(f"{'Name':<35} {'Email':<40} {'Password'}")
        print("-" * 95)
        for (name, email, pwd) in added:
            print(f"{name:<35} {email:<40} {pwd}")

if __name__ == '__main__':
    seed()
