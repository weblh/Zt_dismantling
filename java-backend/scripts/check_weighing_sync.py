# -*- coding: utf-8 -*-
import json
import pymysql

EID = "66a20b980183b692cab589c9"

conn = pymysql.connect(
    host="localhost",
    user="root",
    password="123456",
    database="dismantling_platform",
    charset="utf8mb4",
)
cur = conn.cursor()
cur.execute(
    "SELECT form_name, data_count, last_sync_at FROM jdy_form WHERE entry_id=%s",
    (EID,),
)
print("form:", cur.fetchone())
cur.execute("SELECT COUNT(*) FROM jdy_form_data WHERE entry_id=%s", (EID,))
print("data rows:", cur.fetchone()[0])
cur.execute(
    "SELECT id, data_id, creator_name, jdy_create_time, raw_data "
    "FROM jdy_form_data WHERE entry_id=%s ORDER BY id DESC LIMIT 2",
    (EID,),
)
for row in cur.fetchall():
    rid, data_id, creator, ctime, raw = row
    obj = json.loads(raw)
    print(
        rid,
        data_id,
        creator,
        ctime,
        obj.get("_widget_1721895833885"),
        obj.get("_widget_1721895833886"),
        obj.get("_widget_1721895833887"),
        obj.get("_widget_1721986619625"),
    )
