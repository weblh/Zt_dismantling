# -*- coding: utf-8 -*-
"""Validate inventory aggregation against dashboard mock targets."""
import json
import pymysql
from collections import defaultdict

INBOUND_ENTRY = "6673a90143926f2102b79392"
LEDGER_ENTRY = "663b3b4ad1a1f61d38420867"

PRODUCT_WIDGETS = {
    "撕碎料": "_widget_1718855979965",
    "废钢": "_widget_1718855979966",
    "底盘料": "_widget_1718855979967",
    "铜线": "_widget_1718855979968",
    "铝件": "_widget_1718855979969",
    "塑料": "_widget_1718855979970",
    "小件": "_widget_1718855979971",
    "橡胶": "_widget_1718855979972",
    "其他": "_widget_1718855979973",
}

conn = pymysql.connect(host="localhost", user="root", password="123456", database="dismantling_platform", charset="utf8mb4")
cur = conn.cursor()

inbound = defaultdict(float)
cur.execute("SELECT raw_data FROM jdy_form_data WHERE entry_id=%s", (INBOUND_ENTRY,))
for (raw,) in cur.fetchall():
    d = json.loads(raw)
    for name, key in PRODUCT_WIDGETS.items():
        v = d.get(key)
        if isinstance(v, (int, float)) and v:
            inbound[name] += float(v)

outbound = defaultdict(float)
prices = defaultdict(list)
cur.execute("SELECT raw_data FROM jdy_form_data WHERE entry_id=%s", (LEDGER_ENTRY,))
for (raw,) in cur.fetchall():
    d = json.loads(raw)
    prod = d.get("category") or ""
    w = d.get("net_weight") or d.get("_widget_1747795452009") or 0
    try:
        w = float(w)
    except (TypeError, ValueError):
        w = 0
    if prod and w:
        outbound[prod] += w
    tp = d.get("total_price")
    up = d.get("unit_price")
    if prod and tp:
        try:
            prices[prod].append(float(tp))
        except (TypeError, ValueError):
            pass

print("=== inbound totals (tons) ===")
for k, v in sorted(inbound.items(), key=lambda x: -x[1]):
    print(k, round(v, 2))

print("\n=== outbound totals (tons) ===")
for k, v in sorted(outbound.items(), key=lambda x: -x[1]):
    print(k, round(v, 2))

print("\n=== remaining (tons) ===")
all_prods = set(inbound) | set(outbound)
total_value = 0
for p in sorted(all_prods):
    rem = inbound.get(p, 0) - outbound.get(p, 0)
    print(p, round(rem, 2))
    
print("\ntotal inbound sum:", round(sum(inbound.values()), 2))
print("total outbound sum:", round(sum(outbound.values()), 2))
conn.close()
