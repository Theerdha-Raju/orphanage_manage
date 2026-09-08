"""
seed_volunteers_and_children.py
===============================
Seeds unique login accounts for all Volunteers and Children/Students.
Removes generic demo accounts (volunteer@orphanage.com, child@orphanage.com, student@orphanage.com).

Run from the backend directory:
    python seed_volunteers_and_children.py
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

def make_first_name(full_name):
    first = full_name.strip().split()[0]
    return ''.join(c for c in first if c.isalpha()) or 'User'

def seed():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()

    # 1. Delete legacy generic demo logins
    cur.execute("DELETE FROM login WHERE email IN ('volunteer@orphanage.com', 'child@orphanage.com', 'student@orphanage.com')")

    # 2. Seed Volunteers
    cur.execute("SELECT volunteer_id, full_name, email, phone_number FROM volunteer")
    volunteers = cur.fetchall()

    vol_added = []
    for (v_id, full_name, email, phone) in volunteers:
        # Use existing email or generate one
        if not email or 'example.com' in email:
            clean_name = ''.join(c.lower() for c in full_name if c.isalnum() or c == ' ').replace(' ', '.')
            v_email = f"{clean_name}@volunteer.orphanage.com"
            # Update volunteer table as well
            cur.execute("UPDATE volunteer SET email = ? WHERE volunteer_id = ?", (v_email, v_id))
        else:
            v_email = email

        first = make_first_name(full_name)
        password = f"{first}@Vol123"

        # Ensure Users record exists for Foreign Key constraint
        phone_val = phone or f"vol_{v_id}"
        cur.execute("SELECT user_id FROM users WHERE phone_number = ?", (phone_val,))
        row = cur.fetchone()
        if row:
            user_id = row[0]
        else:
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cur.execute(
                """INSERT INTO users (full_name, phone_number, gender, address, designation, status, created_at, updated_at)
                   VALUES (?, ?, 'Other', '', 'volunteer', 'Active', ?, ?)""",
                (full_name, phone_val, now, now)
            )
            user_id = cur.lastrowid

        # Upsert into Login
        cur.execute("SELECT login_id FROM login WHERE email = ?", (v_email,))
        login_row = cur.fetchone()
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if login_row:
            cur.execute("UPDATE login SET password = ?, role = 'volunteer', user_id = ? WHERE email = ?", (password, user_id, v_email))
        else:
            cur.execute(
                """INSERT INTO login (email, password, role, status, user_id, created_at, updated_at)
                   VALUES (?, ?, 'volunteer', 'Active', ?, ?, ?)""",
                (v_email, password, user_id, now, now)
            )
        vol_added.append((full_name, v_email, password))

    # 3. Seed Children / Students
    cur.execute("SELECT child_id, full_name, gender FROM child")
    children = cur.fetchall()

    child_added = []
    for (c_id, full_name, gender) in children:
        clean_name = ''.join(c.lower() for c in full_name if c.isalnum() or c == ' ').replace(' ', '.')
        c_email = f"{clean_name}@child.orphanage.com"

        first = make_first_name(full_name)
        password = f"{first}@Child123"

        phone_val = f"child_{c_id}"
        cur.execute("SELECT user_id FROM users WHERE phone_number = ?", (phone_val,))
        row = cur.fetchone()
        if row:
            user_id = row[0]
        else:
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cur.execute(
                """INSERT INTO users (full_name, phone_number, gender, address, designation, status, created_at, updated_at)
                   VALUES (?, ?, ?, '', 'child', 'Active', ?, ?)""",
                (full_name, phone_val, gender or 'Other', now, now)
            )
            user_id = cur.lastrowid

        cur.execute("SELECT login_id FROM login WHERE email = ?", (c_email,))
        login_row = cur.fetchone()
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if login_row:
            cur.execute("UPDATE login SET password = ?, role = 'child', user_id = ? WHERE email = ?", (password, user_id, c_email))
        else:
            cur.execute(
                """INSERT INTO login (email, password, role, status, user_id, created_at, updated_at)
                   VALUES (?, ?, 'child', 'Active', ?, ?, ?)""",
                (c_email, password, user_id, now, now)
            )
        child_added.append((full_name, c_email, password))

    conn.commit()
    conn.close()

    print("\n[OK] Volunteer & Child login seeding complete!")
    print(f"\n[Volunteers ({len(vol_added)})]")
    print(f"{'Name':<25} {'Email':<38} {'Password'}")
    print("-" * 75)
    for (name, email, pwd) in vol_added:
        print(f"{name:<25} {email:<38} {pwd}")

    print(f"\n[Children / Students ({len(child_added)})]")
    print(f"{'Name':<25} {'Email':<38} {'Password'}")
    print("-" * 75)
    for (name, email, pwd) in child_added:
        print(f"{name:<25} {email:<38} {pwd}")

if __name__ == '__main__':
    seed()
