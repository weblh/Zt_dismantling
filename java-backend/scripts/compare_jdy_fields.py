# -*- coding: utf-8 -*-
import json
import urllib.request

API = "jDa1Wmt130o66E4KmQaBv9zydAOdA0vm4E02546786f94FbC50bF74a7aB652C20"
APP = "65c1cb717f6b878acaadd2ab"
FORMS = {
    "receipt": ("业务收货", "662dc1c2e0555ac4e79278c3"),
    "weighing-inspection": ("过磅查验", "662dc4486b4c3bc965464bae"),
    "scrapped-vehicle": ("报废车入库", "662dc901bcd3aaaab61ba2c5"),
    "pick-top-photo": ("挑顶照片", "662df863bf6b4a2bd11c9bc1"),
    "disassembly": ("拆解", "662df865bf6b4a2bd11c9d6e"),
    "comprehensive-disassembly": ("综合拆解", "662df8672ff334b695e36ea7"),
    "settlement": ("业务结账", "663b3f2ee0b00783765247b2"),
    "payment-application": ("业务结账付款申请", "66f8e827c75fa95816c2bef3"),
    "price-change": ("修改价格", "66a1feb91fcd7c001cc5682f"),
    "weighing-sync": ("过磅同步数据", "66a20b980183b692cab589c9"),
}

UI_FIELDS = {
    "receipt": [
        "供应商名称", "回车地", "联系电话", "日期时间", "大板车", "车牌号",
        "销户/议价", "车主身份信息", "行车本", "登记证书", "需说明事项", "是否查验",
        "提交人", "提交时间", "更新时间",
    ],
}


def fetch_widgets(entry_id: str) -> dict:
    body = json.dumps({"app_id": APP, "entry_id": entry_id}).encode()
    req = urllib.request.Request(
        "https://api.jiandaoyun.com/api/v5/app/entry/widget/list",
        data=body,
        headers={"Authorization": f"Bearer {API}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def main():
    out = {}
    for key, (name, entry_id) in FORMS.items():
        data = fetch_widgets(entry_id)
        widgets = data.get("widgets") or []
        sys_widgets = data.get("sysWidgets") or []
        biz_labels = [w.get("label") for w in widgets]
        sys_labels = []
        for w in sys_widgets:
            if isinstance(w, dict):
                sys_labels.append(w.get("label") or w.get("name") or w.get("title"))
            else:
                sys_labels.append(str(w))
        item = {
            "formName": name,
            "entryId": entry_id,
            "bizFields": [{"label": w.get("label"), "name": w.get("name"), "type": w.get("type")} for w in widgets],
            "sysFields": sys_widgets,
            "bizLabels": biz_labels,
            "sysLabels": sys_labels,
        }
        if key in UI_FIELDS:
            ui = UI_FIELDS[key]
            biz_set = set(biz_labels)
            # system fields often: creator/createTime/updateTime mapped to 提交人/提交时间/更新时间
            missing = [x for x in ui if x not in biz_set and x not in ("提交人", "提交时间", "更新时间")]
            extra = [x for x in biz_labels if x not in ui]
            item["uiCompare"] = {
                "uiFields": ui,
                "missingInJdyBiz": missing,
                "extraInJdyBiz": extra,
            }
            print(f"\n==== {name} ====")
            print("biz:", " | ".join(biz_labels))
            print("sys:", sys_labels)
            print("UI missing in JDY biz:", missing)
            print("JDY extra vs UI:", extra)
        out[key] = item

    path = r"d:\E\project\Zt_dismantling\java-backend\scripts\jdy_field_compare.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("\nsaved", path)


if __name__ == "__main__":
    main()
