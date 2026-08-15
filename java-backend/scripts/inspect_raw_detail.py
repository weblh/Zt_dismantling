import json
import pymysql

conn = pymysql.connect(host="localhost", user="root", password="123456", database="dismantling_platform", charset="utf8mb4")
cur = conn.cursor()
cur.execute("SELECT id, title, raw_detail, form_components FROM dingtalk_approval_form WHERE id>=2")
for fid, title, raw, fc in cur.fetchall():
    detail = json.loads(raw)
    print("\n=== form", fid, title[:40] if title else "", "===")
    fcv = detail.get("formComponentValues") or detail.get("form_component_values")
    if fcv:
        for c in fcv:
            if c.get("componentType") == "TableField" or c.get("bizAlias") == "addReimbursementDetail":
                val = c.get("value")
                ext = c.get("extValue") or c.get("ext_value")
                rows = []
                for src in (val, ext):
                    if not src:
                        continue
                    try:
                        p = json.loads(src) if isinstance(src, str) else src
                    except Exception:
                        continue
                    if isinstance(p, list):
                        rows = p
                        break
                    if isinstance(p, dict) and "data" in p:
                        rows = p["data"]
                        break
                print("  raw_detail TableField rows:", len(rows))
    comps = json.loads(fc) if fc else []
    for c in comps:
        if c.get("bizAlias") == "addReimbursementDetail":
            val = c.get("value")
            try:
                rows = json.loads(val) if val else []
                print("  form_components rows:", len(rows))
            except Exception as e:
                print("  form_components parse err", e)
conn.close()
