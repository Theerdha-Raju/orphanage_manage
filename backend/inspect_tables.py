import sqlite3

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in cur.fetchall()]

for t in tables:
    try:
        cnt = cur.execute(f"SELECT COUNT(*) FROM `{t}`").fetchone()[0]
        print(f"{t}: {cnt} rows")
    except Exception as e:
        print(f"{t}: Error {e}")

conn.close()
