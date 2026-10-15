# -*- coding: utf-8 -*-
import json
import urllib.request

API = "jDa1Wmt130o66E4KmQaBv9zydAOdA0vm4E02546786f94FbC50bF74a7aB652C20"
APP = "65c1cb717f6b878acaadd2ab"
BASE = "https://api.jiandaoyun.com/api/v5"
ENTRY = "6673a90143926f2102b79392"


def post(path, body):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {API}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


widgets = post("/app/entry/widget/list", {"app_id": APP, "entry_id": ENTRY})
labels = [(w.get("label"), w.get("name"), w.get("type")) for w in (widgets.get("widgets") or [])]
sample = post("/app/entry/data/list", {"app_id": APP, "entry_id": ENTRY, "limit": 3}).get("data") or []

out = {"labels": labels, "sample": sample}
with open(r"d:\E\project\Zt_dismantling\java-backend\scripts\product_inbound_probe.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print("saved")
