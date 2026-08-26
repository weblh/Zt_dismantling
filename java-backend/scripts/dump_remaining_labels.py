# -*- coding: utf-8 -*-
import json
import urllib.request

API = "jDa1Wmt130o66E4KmQaBv9zydAOdA0vm4E02546786f94FbC50bF74a7aB652C20"
APP = "65c1cb717f6b878acaadd2ab"
forms = {
    "comprehensive": "662df8672ff334b695e36ea7",
    "payment": "66f8e827c75fa95816c2bef3",
    "weighing-sync": "66a20b980183b692cab589c9",
    "scrapped": "662dc901bcd3aaaab61ba2c5",
    "disassembly": "662df865bf6b4a2bd11c9d6e",
    "price-change": "66a1feb91fcd7c001cc5682f",
    "settlement": "663b3f2ee0b00783765247b2",
}
out = {}
for k, eid in forms.items():
    body = json.dumps({"app_id": APP, "entry_id": eid}).encode()
    req = urllib.request.Request(
        "https://api.jiandaoyun.com/api/v5/app/entry/widget/list",
        data=body,
        headers={"Authorization": f"Bearer {API}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read().decode())
    out[k] = {
        "labels": [w.get("label") for w in data.get("widgets") or []],
        "sys": data.get("sysWidgets"),
    }
path = r"d:\E\project\Zt_dismantling\java-backend\scripts\jdy_remaining_labels.json"
with open(path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print("saved", path)
for k, v in out.items():
    print(k, "=>", " | ".join(v["labels"]))
