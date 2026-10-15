# -*- coding: utf-8 -*-
import json
import urllib.request

API = "jDa1Wmt130o66E4KmQaBv9zydAOdA0vm4E02546786f94FbC50bF74a7aB652C20"
APP = "65c1cb717f6b878acaadd2ab"
BASE = "https://api.jiandaoyun.com/api/v5"

FORMS = {
    "disassembly": "662df865bf6b4a2bd11c9d6e",
    "comprehensive-disassembly": "662df8672ff334b695e36ea7",
    "finished-product-ledger": "663b3b4ad1a1f61d38420867",
}


def post(path, body):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {API}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def widgets(entry_id):
    data = post("/app/entry/widget/list", {"app_id": APP, "entry_id": entry_id})
    return [w.get("label") for w in (data.get("widgets") or [])]


def sample_data(entry_id, limit=2):
    data = post("/app/entry/data/list", {"app_id": APP, "entry_id": entry_id, "limit": limit})
    return data.get("data") or []


out = {}
for name, entry_id in FORMS.items():
    out[name] = {
        "widgets": widgets(entry_id),
        "sample": sample_data(entry_id, 1),
    }

with open(r"d:\E\project\Zt_dismantling\java-backend\scripts\inventory_form_probe.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print("saved inventory_form_probe.json")
