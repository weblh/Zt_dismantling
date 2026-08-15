#!/usr/bin/env python3
import json
import pymysql

FUND_USAGE = "PROC-7CE13F4F-CCE0-4D21-9288-907C82977140"

conn = pymysql.connect(
    host="localhost", user="root", password="123456",
    database="dismantling_platform", charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor,
)
with conn.cursor() as cur:
    cur.execute("SELECT id, event_data FROM dingtalk_event WHERE event_type='bpms_instance_change'")
    events = cur.fetchall()
    cur.execute("SELECT process_instance_id FROM dingtalk_approval_form")
    forms = {r["process_instance_id"] for r in cur.fetchall()}
    cur.execute("SELECT process_instance_id FROM fund_usage_application")
    apps = {r["process_instance_id"] for r in cur.fetchall()}

missing = []
for event in events:
    data = json.loads(event["event_data"])
    if data.get("processCode") != FUND_USAGE:
        continue
    pid = data.get("processInstanceId")
    if pid not in forms or pid not in apps:
        missing.append(
            (event["id"], data.get("type"), data.get("businessId"), pid, pid in forms, pid in apps)
        )

print(f"Missing fund usage sync: {len(missing)}")
for row in missing:
    print(row)
conn.close()
