# -*- coding: utf-8 -*-
"""增量同步简道云「过磅同步数据」表单（大磅系统 → 简道云 → 平台）。"""
import json
import urllib.request
from datetime import datetime

import pymysql

API = "jDa1Wmt130o66E4KmQaBv9zydAOdA0vm4E02546786f94FbC50bF74a7aB652C20"
APP = "65c1cb717f6b878acaadd2ab"
ENTRY_ID = "66a20b980183b692cab589c9"
FORM_NAME = "1、过磅同步数据"


def jdy_post(path: str, body: dict) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"https://api.jiandaoyun.com/api/v5{path}",
        data=data,
        headers={"Authorization": f"Bearer {API}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def fetch_all_rows() -> list:
    rows = []
    data_id = None
    while True:
        body = {"app_id": APP, "entry_id": ENTRY_ID, "limit": 100}
        if data_id:
            body["data_id"] = data_id
        resp = jdy_post("/app/entry/data/list", body)
        batch = resp.get("data") or []
        if not batch:
            break
        rows.extend(batch)
        data_id = batch[-1].get("_id")
        if len(batch) < 100:
            break
    return rows


def upsert(cur, row: dict) -> str:
    data_id = row.get("_id")
    creator = row.get("creator") or {}
    creator_name = creator.get("name") if isinstance(creator, dict) else None
    creator_username = creator.get("username") if isinstance(creator, dict) else None
    create_time = row.get("createTime")
    update_time = row.get("updateTime")
    raw = json.dumps(row, ensure_ascii=False)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute(
        "SELECT id FROM jdy_form_data WHERE app_id=%s AND entry_id=%s AND data_id=%s",
        (APP, ENTRY_ID, data_id),
    )
    existing = cur.fetchone()
    if existing:
        cur.execute(
            "UPDATE jdy_form_data SET raw_data=%s, creator_name=%s, creator_username=%s, "
            "jdy_create_time=%s, jdy_update_time=%s, synced_at=%s, updated_at=%s WHERE id=%s",
            (raw, creator_name, creator_username, create_time, update_time, now, now, existing[0]),
        )
        return "updated"
    cur.execute(
        "INSERT INTO jdy_form_data(app_id, entry_id, data_id, form_name, creator_name, "
        "creator_username, jdy_create_time, jdy_update_time, raw_data, synced_at, updated_at) "
        "VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (
            APP,
            ENTRY_ID,
            data_id,
            FORM_NAME,
            creator_name,
            creator_username,
            create_time,
            update_time,
            raw,
            now,
            now,
        ),
    )
    return "inserted"


def main():
    print("Fetching remote weighing-sync data from Jiandaoyun...")
    remote = fetch_all_rows()
    print(f"Remote rows: {len(remote)}")

    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="123456",
        database="dismantling_platform",
        charset="utf8mb4",
    )
    inserted = updated = 0
    try:
        with conn.cursor() as cur:
            for row in remote:
                action = upsert(cur, row)
                if action == "inserted":
                    inserted += 1
                else:
                    updated += 1
            cur.execute(
                "UPDATE jdy_form SET data_count=%s, last_sync_at=NOW(), "
                "last_sync_message=%s, updated_at=NOW() WHERE entry_id=%s",
                (len(remote), f"sync ok: {inserted} new, {updated} updated", ENTRY_ID),
            )
            if cur.rowcount == 0:
                cur.execute(
                    "INSERT INTO jdy_form(app_id, entry_id, form_name, status, data_count, "
                    "last_sync_at, created_at, updated_at) "
                    "VALUES(%s,%s,%s,1,%s,NOW(),NOW(),NOW())",
                    (APP, ENTRY_ID, FORM_NAME, len(remote)),
                )
        conn.commit()
        print(f"Done: inserted={inserted}, updated={updated}, total={len(remote)}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
