import sqlite3

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()

cur.execute('SELECT subject, marks, exam_date, remarks FROM education WHERE child_id = 4')
rows = cur.fetchall()
print('=== Rohan Kumar Education Records ===')
total = 0
for r in rows:
    total += r[1]
    print(f'  {r[0]:25} | Marks: {r[1]}% | Date: {r[2]} | Remarks: {r[3]}')
print(f'Average Score: {total / len(rows):.1f}%')

cur.execute('SELECT height_cm, weight_kg, checkup_date, status, notes FROM health WHERE child_id = 4')
print('\n=== Health Record ===', cur.fetchall())

cur.execute("SELECT COUNT(*), SUM(CASE WHEN attendance_status='Present' THEN 1 ELSE 0 END) FROM attendance WHERE child_id = 4")
att = cur.fetchone()
print(f'\n=== Attendance === {att[1]}/{att[0]} ({att[1]/att[0]*100:.1f}%)')

cur.execute('SELECT title, category, achievement_date FROM achievement WHERE child_id = 4')
print('\n=== Achievements ===', cur.fetchall())

cur.execute('SELECT AVG(marks) FROM education')
print(f'\n=== Orphanage-wide Education Benchmark Average === {cur.fetchone()[0]:.1f}%')
