# -*- coding: utf-8 -*-
"""Sync all Jiandaoyun forms for 汽车拆解-收车 into local MySQL."""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from datetime import datetime

import pymysql

API_KEY = "jDa1Wmt130o66E4KmQaBv9zydAOdA0vm4E02546786f94FbC50bF74a7aB652C20"
APP_ID = "65c1cb717f6b878acaadd2ab"
BASE = "https://api.jiandaoyun.com/api/v5"

DB = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "123456",
    "database": "dismantling_platform",
    "charset": "utf8mb4",
}


def api_post(path: str, body: dict) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        BASE + path,
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {err}") from e


def ensure_tables(cur) -> None:
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS jdy_form (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            app_id VARCHAR(64) NOT NULL,
            entry_id VARCHAR(64) NOT NULL,
            form_name VARCHAR(256),
            status INT DEFAULT 1,
            data_count INT DEFAULT 0,
            last_sync_at TIMESTAMP NULL,
            last_sync_message VARCHAR(512),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_jdy_form_entry (app_id, entry_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS jdy_form_data (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            app_id VARCHAR(64) NOT NULL,
            entry_id VARCHAR(64) NOT NULL,
            data_id VARCHAR(64) NOT NULL,
            form_name VARCHAR(256),
            creator_name VARCHAR(128),
            creator_username VARCHAR(128),
            jdy_create_time VARCHAR(64),
            jdy_update_time VARCHAR(64),
            raw_data LONGTEXT,
            synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_jdy_form_data (app_id, entry_id, data_id),
            INDEX idx_jdy_form_data_entry (entry_id),
            INDEX idx_jdy_form_data_synced (synced_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
    )


def list_forms() -> list[dict]:
    forms = []
    skip = 0
    while True:
        resp = api_post("/app/entry/list", {"app_id": APP_ID, "limit": 100, "skip": skip})
        batch = resp.get("forms") or []
        if not batch:
            break
        forms.extend(batch)
        if len(batch) < 100:
            break
        skip += len(batch)
    return forms


def list_form_data(entry_id: str) -> list[dict]:
    rows = []
    data_id = None
    while True:
        body = {"app_id": APP_ID, "entry_id": entry_id, "limit": 100}
        if data_id:
            body["data_id"] = data_id
        resp = api_post("/app/entry/data/list", body)
        batch = resp.get("data") or []
        if not batch:
            break
        rows.extend(batch)
        data_id = batch[-1].get("_id")
        if not data_id or len(batch) < 100:
            break
        time.sleep(0.05)
    return rows


def upsert_form(cur, entry_id: str, form_name: str, data_count: int, message: str) -> None:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute(
        """
        INSERT INTO jdy_form (app_id, entry_id, form_name, status, data_count, last_sync_at, last_sync_message, created_at, updated_at)
        VALUES (%s, %s, %s, 1, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            form_name=VALUES(form_name),
            data_count=VALUES(data_count),
            last_sync_at=VALUES(last_sync_at),
            last_sync_message=VALUES(last_sync_message),
            updated_at=VALUES(updated_at)
        """,
        (APP_ID, entry_id, form_name, data_count, now, message[:500], now, now),
    )


def upsert_row(cur, entry_id: str, form_name: str, row: dict) -> None:
    data_id = row.get("_id")
    if not data_id:
        return
    creator = row.get("creator") or {}
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute(
        """
        INSERT INTO jdy_form_data (
            app_id, entry_id, data_id, form_name, creator_name, creator_username,
            jdy_create_time, jdy_update_time, raw_data, synced_at, updated_at
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON DUPLICATE KEY UPDATE
            form_name=VALUES(form_name),
            creator_name=VALUES(creator_name),
            creator_username=VALUES(creator_username),
            jdy_create_time=VALUES(jdy_create_time),
            jdy_update_time=VALUES(jdy_update_time),
            raw_data=VALUES(raw_data),
            synced_at=VALUES(synced_at),
            updated_at=VALUES(updated_at)
        """,
        (
            APP_ID,
            entry_id,
            data_id,
            form_name,
            creator.get("name"),
            creator.get("username"),
            row.get("createTime"),
            row.get("updateTime"),
            json.dumps(row, ensure_ascii=False),
            now,
            now,
        ),
    )


def main() -> None:
    print(f"Connecting MySQL {DB['database']} ...")
    conn = pymysql.connect(**DB)
    try:
        with conn.cursor() as cur:
            ensure_tables(cur)
        conn.commit()

        forms = list_forms()
        print(f"Found {len(forms)} forms")

        ok = 0
        fail = 0
        total_rows = 0
        for i, f in enumerate(forms, 1):
            entry_id = f.get("entry_id") or f.get("entryId")
            name = f.get("name") or entry_id
            if not entry_id:
                continue
            print(f"[{i}/{len(forms)}] {name} ({entry_id}) ...", flush=True)
            try:
                rows = list_form_data(entry_id)
                with conn.cursor() as cur:
                    for row in rows:
                        upsert_row(cur, entry_id, name, row)
                    upsert_form(cur, entry_id, name, len(rows), f"同步成功，共 {len(rows)} 条")
                conn.commit()
                total_rows += len(rows)
                ok += 1
                print(f"  -> {len(rows)} rows")
            except Exception as e:
                fail += 1
                with conn.cursor() as cur:
                    upsert_form(cur, entry_id, name, 0, f"失败: {e}")
                conn.commit()
                print(f"  -> FAILED: {e}")
            time.sleep(0.1)

        print("=" * 60)
        print(f"Done. forms_ok={ok}, forms_fail={fail}, rows={total_rows}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
