import sqlite3

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()

# Insert donor user
cur.execute("INSERT OR IGNORE INTO users (full_name, phone_number, gender, address, designation, status) VALUES ('Rahul Donor', '9876543210', 'Other', 'Kerala', 'donor', 'Active')")
user_id = cur.lastrowid

if user_id == 0:
    cur.execute("SELECT user_id FROM users WHERE phone_number='9876543210'")
    user_id = cur.fetchone()[0]

cur.execute("INSERT OR IGNORE INTO login (email, password, role, user_id) VALUES ('donor@orphanage.com', 'Donor@123', 'donor', ?)", (user_id,))

conn.commit()

cur.execute("SELECT email, password, role FROM login WHERE role='donor'")
rows = cur.fetchall()
print("Donor accounts:", rows)
conn.close()
