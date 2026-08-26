# -*- coding: utf-8 -*-
import json
import pymysql

c = pymysql.connect(
    host="localhost",
    user="root",
    password="123456",
    database="dismantling_platform",
    charset="utf8mb4",
)
cur = c.cursor()
cur.execute(
    "SELECT raw_data FROM jdy_form_data WHERE entry_id=%s LIMIT 1",
    ("662dc1c2e0555ac4e79278c3",),
)
row = cur.fetchone()
obj = json.loads(row[0])
with open(
    r"d:\E\project\Zt_dismantling\java-backend\scripts\jdy_sample_receipt.json",
    "w",
    encoding="utf-8",
) as f:
    json.dump(obj, f, ensure_ascii=False, indent=2)
print("keys", list(obj.keys())[:30])
print("sample saved")
c.close()
