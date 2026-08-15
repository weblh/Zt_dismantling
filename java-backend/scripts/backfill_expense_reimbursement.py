#!/usr/bin/env python3
"""Backfill expense reimbursement records from stored dingtalk approval forms."""

import json
import re

import pymysql

ALIASES = {
    "expense_type": ("reimbursementType", "费用类型", "报销类型"),
    "expense_date": ("occurDate", "费用发生日期", "发生日期"),
    "amount": ("reimbursementMoney", "报销金额（元）", "金额"),
    "description": ("expenseDetail", "费用说明", "说明"),
    "invoice_info": ("reimbursementAttachement", "附件", "发票"),
}


def parse_amount(value):
    if not value:
        return None
    try:
        return float(re.sub(r"[,元]", "", str(value)).strip())
    except ValueError:
        return None


def format_cell(value):
    if value is None:
        return None
    if isinstance(value, list):
        names = []
        for item in value:
            if isinstance(item, dict):
                names.append(item.get("fileName") or item.get("name") or json.dumps(item, ensure_ascii=False))
            else:
                names.append(str(item))
        return ", ".join(names)
    if isinstance(value, dict):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def row_to_field_map(row):
    field_map = {}
    if isinstance(row, dict) and "rowValue" in row:
        for cell in row["rowValue"]:
            label = cell.get("label")
            biz_alias = cell.get("bizAlias")
            value = format_cell(cell.get("value"))
            if label:
                field_map[label] = value
            if biz_alias:
                field_map[biz_alias] = value
    elif isinstance(row, list):
        for cell in row:
            if isinstance(cell, dict):
                for key in ("name", "label", "bizAlias"):
                    if cell.get(key):
                        field_map[cell[key]] = format_cell(cell.get("value"))
    elif isinstance(row, dict):
        for key, value in row.items():
            field_map[key] = format_cell(value)
    return field_map


def first_value(field_map, *aliases):
    for alias in aliases:
        for key, value in field_map.items():
            if value and (key == alias or alias in key):
                return value
    return None


def parse_header_component(header, component):
    biz_alias = component.get("bizAlias")
    value = component.get("value")
    ext_value = component.get("extValue")

    if biz_alias == "recordDept":
        header["department"] = value
        if ext_value:
            try:
                arr = json.loads(ext_value)
                if arr:
                    header["department"] = arr[0].get("deptName") or arr[0].get("name") or value
            except json.JSONDecodeError:
                pass
    elif biz_alias == "remark":
        header["reason"] = value
    elif biz_alias == "principal" and value:
        header["submitter_name"] = value
    elif biz_alias == "company":
        header["company_name"] = value
    elif biz_alias == "recipientAccount":
        if ext_value:
            try:
                account = json.loads(ext_value)
                header["bank_account"] = account.get("cardNo") or value
                header["bank_name"] = account.get("instBranchName") or account.get("instName")
                return
            except json.JSONDecodeError:
                pass
        header["bank_account"] = value

    if biz_alias == "addReimbursementDetail" and ext_value:
        try:
            ext = json.loads(ext_value)
            stat = ext.get("statValue") or []
            if stat:
                header["total_amount"] = parse_amount(stat[0].get("num"))
        except json.JSONDecodeError:
            pass


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
        "biz_category_id": form["biz_category_id"],
    }
    items = []

    components = json.loads(form["form_components"] or "[]")
    for component in components:
        ctype = component.get("componentType")
        biz_alias = component.get("bizAlias")
        if ctype == "TableField" or biz_alias == "addReimbursementDetail":
            rows = json.loads(component.get("value") or "[]")
            for idx, row in enumerate(rows, start=1):
                field_map = row_to_field_map(row)
                if not field_map:
                    continue
                items.append({
                    "row_index": idx,
                    "expense_type": first_value(field_map, *ALIASES["expense_type"]),
                    "expense_date": first_value(field_map, *ALIASES["expense_date"]),
                    "amount": parse_amount(first_value(field_map, *ALIASES["amount"])),
                    "description": first_value(field_map, *ALIASES["description"]),
                    "invoice_info": first_value(field_map, *ALIASES["invoice_info"]),
                    "raw_row_json": json.dumps(field_map, ensure_ascii=False),
                })
            parse_header_component(header, component)
        else:
            parse_header_component(header, component)

    if header.get("total_amount") is None and items:
        total = sum(i["amount"] or 0 for i in items)
        if total > 0:
            header["total_amount"] = total

    return header, items


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
                "approval_result, biz_category_id, form_components "
                "FROM dingtalk_approval_form WHERE form_components IS NOT NULL"
            )
            forms = cursor.fetchall()

        count = 0
        for form in forms:
            header, items = parse_form(form)
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id FROM expense_reimbursement WHERE process_instance_id = %s",
                    (header["process_instance_id"],),
                )
                existing = cursor.fetchone()
                if existing:
                    rid = existing["id"]
                    cursor.execute(
                        "UPDATE expense_reimbursement SET approval_form_id=%s, process_code=%s, business_id=%s, "
                        "title=%s, submitter_id=%s, submitter_name=%s, department=%s, reason=%s, total_amount=%s, "
                        "bank_account=%s, bank_name=%s, company_name=%s, biz_category_id=%s, approval_result=%s "
                        "WHERE id=%s",
                        (
                            header["approval_form_id"], header.get("process_code"), header.get("business_id"),
                            header.get("title"), header.get("submitter_id"), header.get("submitter_name"),
                            header.get("department"), header.get("reason"), header.get("total_amount"),
                            header.get("bank_account"), header.get("bank_name"), header.get("company_name"),
                            header.get("biz_category_id"), header.get("approval_result"), rid,
                        ),
                    )
                    cursor.execute("DELETE FROM expense_reimbursement_item WHERE reimbursement_id=%s", (rid,))
                else:
                    cursor.execute(
                        "INSERT INTO expense_reimbursement (approval_form_id, process_instance_id, process_code, "
                        "business_id, title, submitter_id, submitter_name, department, reason, total_amount, "
                        "bank_account, bank_name, company_name, biz_category_id, approval_result) "
                        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                        (
                            header["approval_form_id"], header["process_instance_id"], header.get("process_code"),
                            header.get("business_id"), header.get("title"), header.get("submitter_id"),
                            header.get("submitter_name"), header.get("department"), header.get("reason"),
                            header.get("total_amount"), header.get("bank_account"), header.get("bank_name"),
                            header.get("company_name"), header.get("biz_category_id"), header.get("approval_result"),
                        ),
                    )
                    rid = cursor.lastrowid

                for item in items:
                    cursor.execute(
                        "INSERT INTO expense_reimbursement_item (reimbursement_id, row_index, expense_type, "
                        "expense_date, amount, description, invoice_info, raw_row_json) "
                        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                        (
                            rid, item["row_index"], item.get("expense_type"), item.get("expense_date"),
                            item.get("amount"), item.get("description"), item.get("invoice_info"),
                            item.get("raw_row_json"),
                        ),
                    )
            conn.commit()
            count += 1
            print(
                f"Reparsed {header['process_instance_id']}: items={len(items)}, "
                f"amount={header.get('total_amount')}, type={items[0].get('expense_type') if items else None}"
            )

        print(f"Done. Updated {count} records.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
