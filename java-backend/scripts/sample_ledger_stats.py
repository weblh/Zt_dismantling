# -*- coding: utf-8 -*-
import json
import pymysql
from collections import Counter

DB = dict(host="localhost", user="root", password="123456", database="dismantling_platform", charset="utf8mb4")
conn = pymysql.connect(**DB)
cur = conn.cursor()
cur.execute(
    "SELECT raw_data FROM jdy_form_data WHERE entry_id=%s LIMIT 200",
    ("663b3b4ad1a1f61d38420867",),
)
warehouses = Counter()
products = Counter()
for (raw,) in cur.fetchall():
    d = json.loads(raw)
    wh = d.get("_widget_1730183130200") or d.get("warehouse") or ""
    prod = d.get("category") or ""
    if wh:
        warehouses[wh] += 1
    if prod:
        products[prod] += 1

print("warehouses:", warehouses.most_common(20))
print("products:", products.most_common(20))
conn.close()
