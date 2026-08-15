import json
import pymysql

conn = pymysql.connect(
    host="localhost", user="root", password="123456",
    database="dismantling_platform", charset="utf8mb4",
)
cur = conn.cursor()
cur.execute("SELECT id, title, form_components FROM dingtalk_approval_form WHERE id=2")
row = cur.fetchone()
comps = json.loads(row[2])
for c in comps:
    if c.get("bizAlias") == "addReimbursementDetail":
        print("=== value (first 300) ===")
        print((c.get("value") or "")[:300])
        print("=== extValue (first 800) ===")
        ext = c.get("extValue") or c.get("ext_value")
        print((ext or "")[:800])
        if ext:
            try:
                obj = json.loads(ext)
                print("ext keys:", obj.keys())
                if "data" in obj:
                    print("ext.data rows:", len(obj["data"]))
            except Exception as e:
                print("ext parse err", e)
conn.close()
