import sqlite3

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()

print("=== ALL USERS ===")
cur.execute("SELECT * FROM users")
for r in cur.fetchall():
    print(r)

print("\n=== ALL LOGINS ===")
cur.execute("SELECT login_id, email, password, role, user_id FROM login")
for r in cur.fetchall():
    print(r)

conn.close()
