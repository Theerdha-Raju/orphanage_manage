import sqlite3

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()

# Create users table (SQLite version)
cur.execute('''
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    gender VARCHAR(10) NOT NULL DEFAULT 'Other',
    address VARCHAR(255) NOT NULL DEFAULT '',
    designation VARCHAR(100) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Create login table (SQLite version)
cur.execute('''
CREATE TABLE IF NOT EXISTS login (
    login_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Insert admin user
cur.execute('''
INSERT OR IGNORE INTO users (full_name, phone_number, gender, address, designation, status)
VALUES ('Admin User', '0000000000', 'Other', 'Orphanage HQ', 'admin', 'Active')
''')

user_id = cur.lastrowid
if user_id == 0:
    cur.execute("SELECT user_id FROM users WHERE phone_number='0000000000'")
    user_id = cur.fetchone()[0]

cur.execute('''
INSERT OR IGNORE INTO login (email, password, role, user_id)
VALUES ('admin@orphanage.com', 'Admin@123', 'admin', ?)
''', (user_id,))

conn.commit()

# Verify
cur.execute("SELECT * FROM users")
print("Users:", cur.fetchall())
cur.execute("SELECT login_id, email, password, role, user_id FROM login")
print("Login:", cur.fetchall())

conn.close()
print("\nSetup complete!")
