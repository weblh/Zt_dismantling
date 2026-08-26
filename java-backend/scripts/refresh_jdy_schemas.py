# -*- coding: utf-8 -*-
"""Refresh widget schemas into DB and print field consistency report."""
import json
import urllib.request

import pymysql

API = "jDa1Wmt130o66E4KmQaBv9zydAOdA0vm4E02546786f94FbC50bF74a7aB652C20"
APP = "65c1cb717f6b878acaadd2ab"

FORMS = {
    "receipt": ("业务收货", "662dc1c2e0555ac4e79278c3", [
        "供应商名称", "回车地", "联系电话", "日期时间", "大板车", "车牌号",
        "销户/议价", "车主身份信息", "行车本", "登记证书", "需说明事项", "是否查验",
    ]),
    "weighing-inspection": ("过磅查验", "662dc4486b4c3bc965464bae", [
        "编号", "销户/议价", "过磅日期", "车牌号", "回车日期", "车辆类型", "车辆型号",
        "供应商", "业务员", "回车地", "吨位", "压扁", "营运", "B级", "铁", "铝", "三元", "电瓶", "轮胎", "备注",
    ]),
    "settlement": ("业务结账", "663b3f2ee0b00783765247b2", [
        "结账情况", "编号", "回车日期", "过磅日期", "车牌号", "车辆类型", "车辆型号",
        "供应商", "业务员", "回车地", "吨位", "铁", "铝", "三元", "电瓶", "公斤差",
        "扣净重", "扣电瓶", "车况较好", "扣两厢", "扣面包斗斗", "扣铁圈", "扣柴油",
        "自送", "扣小件", "单价", "总价", "备注",
    ]),
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
    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="123456",
        database="dismantling_platform",
        charset="utf8mb4",
    )
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='jdy_form' AND COLUMN_NAME='widget_schema'"
            )
            if cur.fetchone()[0] == 0:
                cur.execute("ALTER TABLE jdy_form ADD COLUMN widget_schema LONGTEXT")
                print("added widget_schema column")
        conn.commit()

        report = {}
        for key, (name, entry_id, expected) in FORMS.items():
            schema = fetch_widgets(entry_id)
            labels = [w.get("label") for w in (schema.get("widgets") or [])]
            sys_names = [w.get("name") if isinstance(w, dict) else str(w) for w in (schema.get("sysWidgets") or [])]
            missing = [x for x in expected if x not in labels]
            extra = [x for x in labels if x not in expected]
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE jdy_form SET widget_schema=%s, updated_at=NOW() WHERE entry_id=%s",
                    (json.dumps(schema, ensure_ascii=False), entry_id),
                )
                if cur.rowcount == 0:
                    cur.execute(
                        "INSERT INTO jdy_form(app_id, entry_id, form_name, status, data_count, widget_schema) "
                        "VALUES(%s,%s,%s,1,0,%s)",
                        (APP, entry_id, name, json.dumps(schema, ensure_ascii=False)),
                    )
            conn.commit()
            ok = len(missing) == 0
            report[key] = {
                "form": name,
                "consistent": ok,
                "missing": missing,
                "extra": extra,
                "sys": sys_names,
            }
            print(f"{name}: {'OK' if ok else 'DIFF'} missing={missing} extra_count={len(extra)} sys={sys_names}")

        out = r"d:\E\project\Zt_dismantling\java-backend\scripts\jdy_field_align_report.json"
        with open(out, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print("saved", out)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
