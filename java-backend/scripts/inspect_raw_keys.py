import json
import pymysql

conn = pymysql.connect(host="localhost", user="root", password="123456", database="dismantling_platform", charset="utf8mb4")
cur = conn.cursor()
cur.execute("SELECT raw_detail FROM dingtalk_approval_form WHERE id=2")
raw = cur.fetchone()[0]
detail = json.loads(raw)
print("top keys:", list(detail.keys())[:20])
print("has formData:", "formData" in detail)
print("has formComponentValues:", "formComponentValues" in detail)
if detail.get("formComponentValues"):
    for c in detail["formComponentValues"]:
        if c.get("bizAlias") == "addReimbursementDetail":
            print("component keys:", c.keys())
conn.close()
