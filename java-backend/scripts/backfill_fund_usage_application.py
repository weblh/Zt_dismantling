#!/usr/bin/env python3
"""Backfill fund usage application records from stored dingtalk approval forms."""

import json
import re

import pymysql

FUND_USAGE_PROCESS_CODE = "PROC-7CE13F4F-CCE0-4D21-9288-907C82977140"


def parse_amount(value):
    if not value:
        return None
    try:
        return float(re.sub(r"[,元]", "", str(value)).strip())
    except ValueError:
        return None


def first_non_blank(*values):
    for value in values:
        if value:
            return value
    return None


def parse_attachment(value):
    if not value:
        return None
    try:
        files = json.loads(value)
        if isinstance(files, list):
            names = [f.get("fileName") for f in files if isinstance(f, dict) and f.get("fileName")]
            return ", ".join(names) if names else None
    except json.JSONDecodeError:
        pass
    return value


def parse_amount_upper(ext_value):
    if not ext_value:
        return None
    try:
        ext = json.loads(ext_value)
        return ext.get("upper")
    except json.JSONDecodeError:
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


def is_fund_usage_form(form):
    if form.get("process_code") == FUND_USAGE_PROCESS_CODE:
        return True
    title = form.get("title") or ""
    return "资金使用申请" in title


def parse_form(form):
    title = form["title"]
    header = {
        "approval_form_id": form["id"],
        "process_instance_id": form["process_instance_id"],
        "process_code": form["process_code"],
        "business_id": form["business_id"],
        "title": title,
        "submitter_id": form["staff_id"],
        "submitter_name": title.split("提交")[0] if title and "提交" in title else None,
        "approval_result": form["approval_result"],
        "biz_category_id": form.get("biz_category_id"),
        "submit_time": form.get("submit_time"),
        "finish_time": form.get("finish_time"),
    }
    items = []

    raw_detail = form.get("raw_detail")
    if raw_detail:
        try:
            detail = json.loads(raw_detail)
            header["originator_dept"] = first_non_blank(
                detail.get("originatorDeptName"),
                detail.get("originatorDeptNameLastStage"),
            )
        except json.JSONDecodeError:
            pass

    components = json.loads(form["form_components"] or "[]")
    for component in components:
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
                items.append({
                    "row_index": idx,
                    "payment_type": first_value(field_map, "付款类型"),
                    "payment_reason": first_value(field_map, "付款事由"),
                    "payment_method": first_value(field_map, "付款方式"),
                    "amount": parse_amount(first_value(field_map, "金额（元）", "金额")),
                    "payee_name": first_value(field_map, "收款单位"),
                    "payee_account": first_value(field_map, "收款账号"),
                    "bank_name": first_value(field_map, "开户行", "开户银行"),
                    "bank_code": first_value(field_map, "银行行号"),
                    "raw_row_json": json.dumps(field_map, ensure_ascii=False),
                })
        elif ctype == "CalculateField":
            header["total_amount"] = parse_amount(value)
            header["total_amount_upper"] = parse_amount_upper(ext_value)
        elif ctype == "DDAttachment":
            header["attachment_info"] = parse_attachment(value)
        elif name == "部门":
            header["department"] = value
        elif name == "付款类型":
            header["payment_type"] = value
        elif name == "付款事由":
            header["payment_reason"] = value

    if header.get("total_amount") is None and items:
        total = sum(i["amount"] or 0 for i in items)
        if total > 0:
            header["total_amount"] = total
    if not header.get("payment_type") and items:
        header["payment_type"] = items[0].get("payment_type")
    if not header.get("payment_reason") and items:
        header["payment_reason"] = items[0].get("payment_reason")

    return header, items


def remove_misplaced_expense(cursor, process_instance_id):
    cursor.execute(
        "SELECT id FROM expense_reimbursement WHERE process_instance_id = %s",
        (process_instance_id,),
    )
    row = cursor.fetchone()
    if not row:
        return
    rid = row["id"]
    cursor.execute("DELETE FROM expense_reimbursement_item WHERE reimbursement_id = %s", (rid,))
    cursor.execute("DELETE FROM expense_reimbursement WHERE id = %s", (rid,))
    print(f"Removed misplaced expense_reimbursement id={rid}")


def save_application(cursor, header, items):
    cursor.execute(
        "SELECT id FROM fund_usage_application WHERE process_instance_id = %s",
        (header["process_instance_id"],),
    )
    existing = cursor.fetchone()
    fields = (
        "approval_form_id", "process_instance_id", "process_code", "business_id", "title",
        "submitter_id", "submitter_name", "department", "originator_dept", "payment_type",
        "payment_reason", "total_amount", "total_amount_upper", "attachment_info",
        "biz_category_id", "approval_result", "submit_time", "finish_time",
    )
    values = tuple(header.get(f) for f in fields)

    if existing:
        aid = existing["id"]
        set_clause = ", ".join(f"{f}=%s" for f in fields[1:])
        cursor.execute(
            f"UPDATE fund_usage_application SET {set_clause} WHERE id=%s",
            values[1:] + (aid,),
        )
        cursor.execute("DELETE FROM fund_usage_application_item WHERE application_id=%s", (aid,))
    else:
        placeholders = ", ".join(["%s"] * len(fields))
        cursor.execute(
            f"INSERT INTO fund_usage_application ({', '.join(fields)}) VALUES ({placeholders})",
            values,
        )
        aid = cursor.lastrowid

    for item in items:
        cursor.execute(
            "INSERT INTO fund_usage_application_item "
            "(application_id, row_index, payment_type, payment_reason, payment_method, "
            "amount, payee_name, payee_account, bank_name, bank_code, raw_row_json) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (
                aid, item["row_index"], item.get("payment_type"), item.get("payment_reason"),
                item.get("payment_method"), item.get("amount"), item.get("payee_name"),
                item.get("payee_account"), item.get("bank_name"), item.get("bank_code"),
                item.get("raw_row_json"),
            ),
        )
    return aid


def main():
    conn = pymysql.connect(
        host="localhost", user="root", password="123456",
        database="dismantling_platform", charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, process_instance_id, process_code, business_id, title, staff_id, "
                "approval_result, biz_category_id, form_components, raw_detail, "
                "submit_time, finish_time "
                "FROM dingtalk_approval_form WHERE form_components IS NOT NULL"
            )
            forms = cursor.fetchall()

        count = 0
        for form in forms:
            if not is_fund_usage_form(form):
                continue
            header, items = parse_form(form)
            with conn.cursor() as cursor:
                remove_misplaced_expense(cursor, header["process_instance_id"])
                aid = save_application(cursor, header, items)
            conn.commit()
            count += 1
            print(
                f"Migrated {header['business_id']} ({header['submitter_name']}): "
                f"application_id={aid}, items={len(items)}, amount={header.get('total_amount')}"
            )

        print(f"Done. Migrated {count} fund usage application(s).")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
