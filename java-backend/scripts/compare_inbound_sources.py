# -*- coding: utf-8 -*-
import json
import pymysql
from collections import defaultdict
from datetime import datetime

COMP_ENTRY = "662df8672ff334b695e36ea7"
INBOUND_ENTRY = "6673a90143926f2102b79392"

PRODUCTS = ["撕碎料", "废钢", "底盘料", "铜线", "铝件", "塑料", "小件", "橡胶", "其他"]
COMP_WIDGETS = {
    "撕碎料": "_widget_1718855405330",
    "废钢": "_widget_1718855405332",
    "底盘料": "_widget_1718855405333",
    "铜线": "_widget_1718855405334",
    "铝件": "_widget_1718855405335",
    "塑料": "_widget_1718855405336",
    "小件": "_widget_1718855405337",
    "橡胶": "_widget_1718855405338",
    "其他": "_widget_1718855405340",
}

conn = pymysql.connect(host="localhost", user="root", password="123456", database="dismantling_platform", charset="utf8mb4")
cur = conn.cursor()

def sum_entry(entry_id, widgets, date_field=None, year=None):
    totals = defaultdict(float)
    count = 0
    cur.execute("SELECT raw_data FROM jdy_form_data WHERE entry_id=%s", (entry_id,))
    for (raw,) in cur.fetchall():
        d = json.loads(raw)
        if year and date_field:
            dt = d.get(date_field) or d.get("createTime") or ""
            if not str(dt).startswith(str(year)):
                continue
        count += 1
        for name, key in widgets.items():
            v = d.get(key)
            if isinstance(v, (int, float)) and v:
                totals[name] += float(v)
    return totals, count

for label, entry, widgets in [
    ("product-inbound all", INBOUND_ENTRY, {k: f"_widget_171885597996{5+i}" for i, k in enumerate(PRODUCTS)}),
    ("comprehensive all", COMP_ENTRY, COMP_WIDGETS),
]:
    totals, cnt = sum_entry(entry, widgets)
    print(label, "rows", cnt, "sum", round(sum(totals.values()), 2))
    for p in PRODUCTS:
        if totals.get(p):
            print(" ", p, round(totals[p], 2))

print("\n--- 2026 product-inbound ---")
widgets = {k: f"_widget_171885597996{5+i}" for i, k in enumerate(PRODUCTS)}
totals, cnt = sum_entry(INBOUND_ENTRY, widgets, "_widget_1718855979964", 2026)
print("rows", cnt, "sum", round(sum(totals.values()), 2))

conn.close()
