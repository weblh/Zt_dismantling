#!/usr/bin/env python3
"""Cross-check fund usage approvals across logs, dingtalk_event, and database."""

import json
import os
import re
from glob import glob

import pymysql

FUND_USAGE = "PROC-7CE13F4F-CCE0-4D21-9288-907C82977140"
LOG_ROOT = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "deploy",
    "package",
    "backend",
    "logs",
)


def parse_logs():
    events = {}
    for path in glob(os.path.join(LOG_ROOT, "**", "backend.log*"), recursive=True):
        if not os.path.isfile(path):
            continue
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            for line in fh:
                if FUND_USAGE not in line or '"type":"' not in line:
                    continue
                match = re.search(r'\{.*"processInstanceId".*\}', line)
                if not match:
                    continue
                try:
                    data = json.loads(match.group())
                except json.JSONDecodeError:
                    continue
                if data.get("processCode") != FUND_USAGE:
                    continue
                pid = data.get("processInstanceId")
                if not pid:
                    continue
                entry = events.setdefault(
                    pid,
                    {
                        "business_id": data.get("businessId"),
                        "title": data.get("title"),
                        "log_types": set(),
                    },
                )
                entry["log_types"].add(data.get("type"))
                if data.get("businessId"):
                    entry["business_id"] = data.get("businessId")
    return events


def load_db():
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
            cur.execute(
                "SELECT process_instance_id, business_id, title, approval_result "
                "FROM dingtalk_approval_form WHERE process_code=%s",
                (FUND_USAGE,),
            )
            forms = {r["process_instance_id"]: r for r in cur.fetchall()}

            cur.execute(
                "SELECT process_instance_id, business_id, title, total_amount "
                "FROM fund_usage_application"
            )
            apps = {r["process_instance_id"]: r for r in cur.fetchall()}

            cur.execute(
                "SELECT event_data FROM dingtalk_event WHERE event_type='bpms_instance_change'"
            )
            db_events = {}
            for row in cur.fetchall():
                try:
                    data = json.loads(row["event_data"])
                except json.JSONDecodeError:
                    continue
                if data.get("processCode") != FUND_USAGE:
                    continue
                pid = data.get("processInstanceId")
                if not pid:
                    continue
                entry = db_events.setdefault(
                    pid,
                    {
                        "business_id": data.get("businessId"),
                        "title": data.get("title"),
                        "db_types": set(),
                    },
                )
                entry["db_types"].add(data.get("type"))
                if data.get("businessId"):
                    entry["business_id"] = data.get("businessId")
        return forms, apps, db_events
    finally:
        conn.close()


def main():
    log_events = parse_logs()
    forms, apps, db_events = load_db()
    all_pids = sorted(set(log_events) | set(db_events) | set(forms) | set(apps))

    print("=== Fund usage approval sync report ===\n")
    missing = []
    for pid in all_pids:
        log_types = sorted(log_events.get(pid, {}).get("log_types", set()))
        db_types = sorted(db_events.get(pid, {}).get("db_types", set()))
        in_form = pid in forms
        in_app = pid in apps
        biz = (
            log_events.get(pid, {}).get("business_id")
            or db_events.get(pid, {}).get("business_id")
            or forms.get(pid, {}).get("business_id")
            or apps.get(pid, {}).get("business_id")
        )
        if not in_app and "finish" in db_types + log_types:
            status = "MISSING_APP"
            missing.append((biz, pid, log_types, db_types, in_form, in_app))
        elif not in_app and "start" in db_types + log_types and "finish" not in db_types + log_types:
            status = "ONLY_START"
            missing.append((biz, pid, log_types, db_types, in_form, in_app))
        else:
            status = "OK" if in_app else "SKIP"

        if status != "OK":
            print(
                f"[{status}] business_id={biz}\n"
                f"  processInstanceId={pid}\n"
                f"  log_types={log_types or '-'}\n"
                f"  db_event_types={db_types or '-'}\n"
                f"  in_approval_form={in_form}, in_fund_usage_app={in_app}\n"
            )

    print(f"Total issues: {len(missing)}")

    print("\n=== Log coverage for target approval 202606291008000262308 ===")
    target = "T3Kf3q2gRB2JhMxym7hSVA08241782698906"
    print(f"in_logs={target in log_events}, log_types={sorted(log_events.get(target, {}).get('log_types', []))}")
    print(f"in_db_events={target in db_events}, db_types={sorted(db_events.get(target, {}).get('db_types', []))}")
    print(f"in_approval_form={target in forms}, in_fund_usage_app={target in apps}")


if __name__ == "__main__":
    main()
