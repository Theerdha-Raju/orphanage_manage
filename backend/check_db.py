import sqlite3

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()

# List all tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cur.fetchall()
print("Tables:", tables)

# Check login table
for table in tables:
    t = table[0]
    if 'login' in t.lower() or 'user' in t.lower():
        print(f"\n--- {t} ---")
        cur.execute(f"SELECT * FROM {t} LIMIT 10")
        rows = cur.fetchall()
        # Get column names
        col_names = [description[0] for description in cur.description]
        print("Columns:", col_names)
        for row in rows:
            print(row)

conn.close()
