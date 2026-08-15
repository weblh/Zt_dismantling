import json
import pymysql

conn = pymysql.connect(
    host="localhost", user="root", password="123456",
    database="dismantling_platform", charset="utf8mb4",
)
cur = conn.cursor()
cur.execute(
    "SELECT id, process_instance_id, title, form_components, raw_detail "
    "FROM dingtalk_approval_form ORDER BY id"
)
rows = cur.fetchall()
print("total forms:", len(rows))
for fid, pid, title, fc, raw_detail in rows:
    if not title or "报销" not in title:
        continue
    comps = json.loads(fc) if fc else []
    table_count = 0
    for c in comps:
        if c.get("componentType") != "TableField" and c.get("bizAlias") != "addReimbursementDetail":
            continue
        val = c.get("value")
        ext = c.get("extValue") or c.get("ext_value")
        parsed = None
        for src in (val, ext):
            if not src:
                continue
            try:
                parsed = json.loads(src) if isinstance(src, str) else src
                break
            except json.JSONDecodeError:
                pass
        if isinstance(parsed, dict):
            if "rowValue" in parsed:
                parsed = [parsed]
            elif "data" in parsed:
                parsed = parsed.get("data")
        if isinstance(parsed, list):
            table_count = len(parsed)
        print(f"form={fid} title={title[:30]} table_rows_in_components={table_count}")

    if raw_detail:
        detail = json.loads(raw_detail)
        detail = detail.get("result") or detail
        form_data = detail.get("formData") or {}
        for key, field in form_data.items():
            if not key.startswith("TableField"):
                continue
            val = field.get("value") if isinstance(field, dict) else None
            ext = field.get("extendValue") if isinstance(field, dict) else None
            parsed = None
            for src in (val, ext):
                if not src:
                    continue
                try:
                    parsed = json.loads(src) if isinstance(src, str) else src
                    break
                except json.JSONDecodeError:
                    pass
            if isinstance(parsed, dict) and "rowValue" in parsed:
                parsed = [parsed]
            cnt = len(parsed) if isinstance(parsed, list) else 0
            print(f"  raw_detail {key} rows={cnt}")

conn.close()
