#!/usr/bin/env python3
"""Backfill a single missed approval from DingTalk API."""

import json
import re
import sys
import urllib.request

import pymysql

CLIENT_ID = "dinge2crzcy7wrhadluq"
CLIENT_SECRET = "8iTpaPtWH0cGFFCOyTYl1KnvtqzuV124swwJL10cCHSeCaNPkgpt_54fYXzsEne8"
FUND_USAGE_PROCESS_CODE = "PROC-7CE13F4F-CCE0-4D21-9288-907C82977140"


def parse_amount(value):
    if not value:
        return None
    try:
        return float(re.sub(r"[,元]", "", str(value)).strip())
    except ValueError:
        return None


def row_to_field_map(row):
    field_map = {}
    if isinstance(row, dict) and "rowValue" in row:
        for cell in row["rowValue"]:
            label = cell.get("label")
            value = cell.get("value")
            if label:
                field_map[label] = value
            key = cell.get("key")
            if key:
                field_map[key] = value
    return field_map


def first_value(field_map, *aliases):
    for alias in aliases:
        for key, value in field_map.items():
            if value and (key == alias or alias in key):
                return value
    return None


def get_access_token():
    req = urllib.request.Request(
        "https://api.dingtalk.com/v1.0/oauth2/accessToken",
        data=json.dumps({"appKey": CLIENT_ID, "appSecret": CLIENT_SECRET}).encode(),
        headers={"Content-Type": "application/json"},
    )
    return json.loads(urllib.request.urlopen(req).read())["accessToken"]


def fetch_detail(process_instance_id, token):
    url = (
        "https://api.dingtalk.com/v1.0/workflow/processInstances"
        f"?processInstanceId={process_instance_id}&includeFormComponentValues=true"
    )
    req = urllib.request.Request(url, headers={"x-acs-dingtalk-access-token": token})
    resp = json.loads(urllib.request.urlopen(req).read())
    return resp.get("result", resp)


def parse_detail(detail):
    title = detail.get("title") or ""
    header = {
        "process_instance_id": detail.get("processInstanceId"),
        "process_code": detail.get("processCode") or FUND_USAGE_PROCESS_CODE,
        "business_id": detail.get("businessId"),
        "title": title,
        "staff_id": detail.get("originatorUserId"),
        "submitter_name": title.split("提交")[0] if "提交" in title else None,
        "approval_result": detail.get("result"),
        "originator_dept": detail.get("originatorDeptName"),
    }
    items = []

    for component in detail.get("formComponentValues") or []:
        ctype = component.get("componentType")
        name = component.get("name")
        value = component.get("value")
        ext_value = component.get("extValue")

        if ctype == "TableField":
            rows = json.loads(value or "[]")
            for idx, row in enumerate(rows, start=1):
                field_map = row_to_field_map(row)
                if not field_map:
                    continue
                items.append(
                    {
                        "row_index": idx,
                        "payment_type": first_value(field_map, "付款类型"),
                        "payment_reason": first_value(field_map, "付款事由"),
                        "payment_method": first_value(field_map, "付款方式"),
                        "amount": parse_amount(first_value(field_map, "金额（元）", "金额")),
                        "payee_name": first_value(field_map, "收款单位"),
                        "payee_account": first_value(field_map, "收款账号"),
                        "bank_name": first_value(field_map, "开户行", "开户银行"),
                        "raw_row_json": json.dumps(field_map, ensure_ascii=False),
                    }
                )
        elif ctype == "CalculateField":
            header["total_amount"] = parse_amount(value)
        elif name == "部门":
            header["department"] = value
        elif name == "付款类型":
            header["payment_type"] = value
        elif name == "付款事由":
            header["payment_reason"] = value

    if header.get("total_amount") is None and items:
        total = sum(item.get("amount") or 0 for item in items)
        if total > 0:
            header["total_amount"] = total
    if not header.get("payment_type") and items:
        header["payment_type"] = items[0].get("payment_type")
    if not header.get("payment_reason") and items:
        header["payment_reason"] = items[0].get("payment_reason")

    return header, items, detail


def save(conn, header, items, detail):
    form_components = json.dumps(detail.get("formComponentValues") or [], ensure_ascii=False)
    raw_detail = json.dumps(detail, ensure_ascii=False)
    pid = header["process_instance_id"]

    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT id FROM dingtalk_approval_form WHERE process_instance_id = %s",
            (pid,),
        )
        existing_form = cursor.fetchone()
        if existing_form:
            form_id = existing_form["id"]
            cursor.execute(
                "UPDATE dingtalk_approval_form SET business_id=%s, title=%s, approval_result=%s, "
                "form_components=%s, raw_detail=%s WHERE id=%s",
                (
                    header["business_id"],
                    header["title"],
                    header["approval_result"],
                    form_components,
                    raw_detail,
                    form_id,
                ),
            )
        else:
            cursor.execute(
                "INSERT INTO dingtalk_approval_form "
                "(process_instance_id, process_code, business_id, title, staff_id, approval_result, "
                "form_components, raw_detail, created_at) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW())",
                (
                    pid,
                    header["process_code"],
                    header["business_id"],
                    header["title"],
                    header["staff_id"],
                    header["approval_result"],
                    form_components,
                    raw_detail,
                ),
            )
            form_id = cursor.lastrowid

        header["approval_form_id"] = form_id
        app_fields = [
            "approval_form_id",
            "process_instance_id",
            "process_code",
            "business_id",
            "title",
            "submitter_id",
            "submitter_name",
            "department",
            "originator_dept",
            "payment_type",
            "payment_reason",
            "total_amount",
            "approval_result",
        ]
        app_values = [header.get(field.replace("originator_dept", "originator_dept")) for field in app_fields]
        app_values = [
            form_id,
            pid,
            header["process_code"],
            header["business_id"],
            header["title"],
            header["staff_id"],
            header["submitter_name"],
            header.get("department"),
            header.get("originator_dept"),
            header.get("payment_type"),
            header.get("payment_reason"),
            header.get("total_amount"),
            header["approval_result"],
        ]

        cursor.execute(
            "SELECT id FROM fund_usage_application WHERE process_instance_id = %s",
            (pid,),
        )
        existing_app = cursor.fetchone()
        if existing_app:
            app_id = existing_app["id"]
            set_clause = ", ".join(f"{field}=%s" for field in app_fields[1:])
            cursor.execute(
                f"UPDATE fund_usage_application SET {set_clause} WHERE id=%s",
                app_values[1:] + [app_id],
            )
            cursor.execute(
                "DELETE FROM fund_usage_application_item WHERE application_id=%s",
                (app_id,),
            )
        else:
            placeholders = ", ".join(["%s"] * len(app_fields))
            cursor.execute(
                f"INSERT INTO fund_usage_application ({', '.join(app_fields)}) VALUES ({placeholders})",
                app_values,
            )
            app_id = cursor.lastrowid

        for item in items:
            cursor.execute(
                "INSERT INTO fund_usage_application_item "
                "(application_id, row_index, payment_type, payment_reason, payment_method, "
                "amount, payee_name, payee_account, bank_name, raw_row_json, created_at) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())",
                (
                    app_id,
                    item["row_index"],
                    item.get("payment_type"),
                    item.get("payment_reason"),
                    item.get("payment_method"),
                    item.get("amount"),
                    item.get("payee_name"),
                    item.get("payee_account"),
                    item.get("bank_name"),
                    item.get("raw_row_json"),
                ),
            )

    conn.commit()
    return app_id


def main():
    process_instance_id = sys.argv[1] if len(sys.argv) > 1 else "T3Kf3q2gRB2JhMxym7hSVA08241782698906"
    token = get_access_token()
    detail = fetch_detail(process_instance_id, token)
    detail["processInstanceId"] = detail.get("processInstanceId") or process_instance_id
    header, items, detail = parse_detail(detail)

    conn = pymysql.connect(
        host="localhost",
        user="root",
        password="123456",
        database="dismantling_platform",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        app_id = save(conn, header, items, detail)
        print(
            f"Backfilled {header['business_id']} ({header['submitter_name']}): "
            f"application_id={app_id}, items={len(items)}, amount={header.get('total_amount')}"
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
