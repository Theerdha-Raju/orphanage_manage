import sqlite3
import os

db_paths = ['backend/db.sqlite3', 'db.sqlite3']

for path in db_paths:
    if os.path.exists(path):
        print(f"--- Checking {path} ---")
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        
        # Check tables
        tables = [row[0] for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        print("Tables:", tables)
        
        for t in ['users', 'api_users']:
            if t in tables:
                cur.execute(f"SELECT user_id, full_name FROM {t} WHERE full_name LIKE '%Admin%'")
                rows = cur.fetchall()
                print(f"Found in {t}:", rows)
                
                # Update 'Admin User' to 'Admin'
                cur.execute(f"UPDATE {t} SET full_name = 'Admin' WHERE full_name = 'Admin User'")
                print(f"Updated {cur.rowcount} rows in {t}")
        
        conn.commit()
        conn.close()
