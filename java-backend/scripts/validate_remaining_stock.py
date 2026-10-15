# -*- coding: utf-8 -*-
import json
import pymysql
import re
from collections import defaultdict

INBOUND_ENTRY = "6673a90143926f2102b79392"
LEDGER_ENTRY = "663b3b4ad1a1f61d38420867"

STANDARD = ["撕碎料", "废钢", "底盘料", "铜线", "铝件", "塑料", "小件", "橡胶", "其他"]
IN_W = {n: f"_widget_171885597996{5+i}" for i, n in enumerate(STANDARD)}

def norm(name):
    if not name:
        return "其他"
    name = str(name).strip().replace(".", "")
    if name.startswith("其他"):
        return "其他"
    for s in STANDARD:
        if s in name or name in s:
            return s
    return "其他"

conn = pymysql.connect(host="localhost", user="root", password="123456", database="dismantling_platform", charset="utf8mb4")
cur = conn.cursor()

inbound = defaultdict(float)
cur.execute("SELECT raw_data FROM jdy_form_data WHERE entry_id=%s", (INBOUND_ENTRY,))
for (raw,) in cur.fetchall():
    d = json.loads(raw)
    for n, k in IN_W.items():
        v = d.get(k)
        if isinstance(v, (int, float)) and v:
            inbound[n] += float(v)

outbound = defaultdict(float)
unit_prices = defaultdict(list)
cur.execute("SELECT raw_data FROM jdy_form_data WHERE entry_id=%s", (LEDGER_ENTRY,))
for (raw,) in cur.fetchall():
    d = json.loads(raw)
    prod = norm(d.get("category"))
    w = d.get("net_weight")
    try:
        w = float(w) if w else 0
    except (TypeError, ValueError):
        w = 0
    if w:
        outbound[prod] += w
    up = d.get("unit_price")
    if up:
        try:
            unit_prices[prod].append(float(up))
        except (TypeError, ValueError):
            pass

print("=== remaining (normalized) ===")
total_rem = 0
total_value = 0
for p in STANDARD:
    rem = max(0, inbound.get(p, 0) - outbound.get(p, 0))
    avg_price = sum(unit_prices[p]) / len(unit_prices[p]) if unit_prices[p] else 2500
    val = rem * avg_price / 10000  # wan yuan
    total_rem += rem
    total_value += val
    print(f"{p}: rem={rem:.2f}t, avg_price={avg_price:.0f}, value={val:.1f}万")

print(f"\ntotal remaining: {total_rem:.2f}t")
print(f"total value: {total_value:.1f} 万元")
conn.close()
