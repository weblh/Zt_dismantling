#!/usr/bin/env python3
"""Find completed fund usage approvals missing from platform and backfill them."""

import json
import subprocess
import sys
import urllib.request

import pymysql

FUND_USAGE = "PROC-7CE13F4F-CCE0-4D21-9288-907C82977140"
CLIENT_ID = "dinge2crzcy7wrhadluq"
CLIENT_SECRET = "8iTpaPtWH0cGFFCOyTYl1KnvtqzuV124swwJL10cCHSeCaNPkgpt_54fYXzsEne8"
BACKFILL_SCRIPT = __file__.replace("sync_completed_from_dingtalk.py", "backfill_single_approval.py")


def get_token():
    req = urllib.request.Request(
        "https://api.dingtalk.com/v1.0/oauth2/accessToken",
        data=json.dumps({"appKey": CLIENT_ID, "appSecret": CLIENT_SECRET}).encode(),
        headers={"Content-Type": "application/json"},
    )
    return json.loads(urllib.request.urlopen(req).read())["accessToken"]


def fetch_status(token, process_instance_id):
    url = (
        "https://api.dingtalk.com/v1.0/workflow/processInstances"
        f"?processInstanceId={process_instance_id}&includeFormComponentValues=false"
    )
    req = urllib.request.Request(url, headers={"x-acs-dingtalk-access-token": token})
    resp = json.loads(urllib.request.urlopen(req).read())
    detail = resp.get("result", resp)
    return detail.get("status"), detail.get("result"), detail.get("businessId")


def list_candidates():
    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="123456",
        database="dismantling_platform",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT process_instance_id FROM fund_usage_application")
            apps = {r["process_instance_id"] for r in cur.fetchall()}
            cur.execute(
                "SELECT event_data FROM dingtalk_event WHERE event_type='bpms_instance_change'"
            )
            candidates = {}
            for row in cur.fetchall():
                data = json.loads(row["event_data"])
                if data.get("processCode") != FUND_USAGE:
                    continue
                pid = data.get("processInstanceId")
                if not pid or pid in apps:
                    continue
                entry = candidates.setdefault(pid, set())
                entry.add(data.get("type"))
            return {
                pid: types
                for pid, types in candidates.items()
                if "terminate" not in types
            }
    finally:
        conn.close()


def main():
    dry_run = "--dry-run" in sys.argv
    candidates = list_candidates()
    token = get_token()
    completed = []

    print(f"Checking {len(candidates)} candidate process instance(s)...")
    for pid, types in sorted(candidates.items()):
        status, result, business_id = fetch_status(token, pid)
        marker = f"types={sorted(types)}, dingtalk_status={status}, result={result}, business_id={business_id}"
        if status == "COMPLETED" and result == "agree":
            completed.append((pid, business_id))
            print(f"[NEED_BACKFILL] {pid} {marker}")
        else:
            print(f"[SKIP] {pid} {marker}")

    print(f"\nCompleted but missing locally: {len(completed)}")
    if dry_run or not completed:
        return

    for pid, business_id in completed:
        print(f"Backfilling {business_id} ({pid})...")
        subprocess.check_call([sys.executable, BACKFILL_SCRIPT, pid])


if __name__ == "__main__":
    main()
