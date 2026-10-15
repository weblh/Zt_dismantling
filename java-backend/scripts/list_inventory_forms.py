# -*- coding: utf-8 -*-
import json
import urllib.request

API = "jDa1Wmt130o66E4KmQaBv9zydAOdA0vm4E02546786f94FbC50bF74a7aB652C20"
APP = "65c1cb717f6b878acaadd2ab"
BASE = "https://api.jiandaoyun.com/api/v5"


def post(path, body):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {API}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


forms = []
skip = 0
while True:
    batch = post("/app/entry/list", {"app_id": APP, "limit": 100, "skip": skip}).get("forms") or []
    if not batch:
        break
    forms.extend(batch)
    if len(batch) < 100:
        break
    skip += len(batch)

keywords = ["入库", "出库", "库存", "成品", "台账", "仓库", "产品", "产成品"]
print("=== inventory related forms ===")
for f in forms:
    name = f.get("name", "")
    if any(k in name for k in keywords):
        entry_id = f.get("entry_id")
        print(f"{name}\t{entry_id}")

# fetch widgets for key forms
targets = {
    "finished-product-ledger": "663b3b4ad1a1f61d38420867",
    "finished-product-approval": "67b5879e92f4293f780e230c",
    "warehouse": "66f8b152abee705881eec3a5",
    "comprehensive-disassembly": "662df8672ff334b695e36ea7",
}
for key, entry_id in targets.items():
    data = post("/app/entry/widget/list", {"app_id": APP, "entry_id": entry_id})
    labels = [w.get("label") for w in (data.get("widgets") or [])]
    print(f"\n=== {key} ({entry_id}) ===")
    print(" | ".join(labels))
