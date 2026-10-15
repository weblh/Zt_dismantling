# -*- coding: utf-8 -*-
import json
import pymysql

conn = pymysql.connect(host="localhost", user="root", password="123456", database="dismantling_platform", charset="utf8mb4")
cur = conn.cursor()
cur.execute("SELECT entry_id, form_name, raw_data FROM jdy_form_data WHERE raw_data LIKE %s LIMIT 20", ("%A区%",))
rows = cur.fetchall()
print("A区 matches:", len(rows))
for entry_id, form_name, raw in rows[:5]:
    print(entry_id, form_name)

cur.execute("SELECT entry_id, COUNT(*) FROM jdy_form_data GROUP BY entry_id ORDER BY COUNT(*) DESC LIMIT 5")
print("top entries:", cur.fetchall())
conn.close()
