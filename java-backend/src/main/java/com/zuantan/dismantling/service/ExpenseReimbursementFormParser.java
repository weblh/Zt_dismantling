package com.zuantan.dismantling.service;



import com.alibaba.fastjson.JSON;

import com.alibaba.fastjson.JSONArray;

import com.alibaba.fastjson.JSONObject;

import com.zuantan.dismantling.entity.DingtalkApprovalForm;

import com.zuantan.dismantling.entity.ExpenseReimbursement;

import com.zuantan.dismantling.entity.ExpenseReimbursementItem;

import com.zuantan.dismantling.util.DingtalkApprovalDetailNormalizer;
import com.zuantan.dismantling.util.DingtalkApprovalDetailUtil;
import com.zuantan.dismantling.util.DingtalkAttachmentUtil;

import org.springframework.stereotype.Component;

import org.springframework.util.StringUtils;



import java.math.BigDecimal;

import java.time.Instant;

import java.time.LocalDate;

import java.time.LocalDateTime;

import java.time.ZoneId;

import java.time.format.DateTimeFormatter;

import java.time.format.DateTimeParseException;

import java.util.ArrayList;

import java.util.HashMap;

import java.util.List;

import java.util.Map;

import java.util.stream.Collectors;



@Component

public class ExpenseReimbursementFormParser {



  private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");



  private static final DateTimeFormatter[] DATE_FORMATTERS = new DateTimeFormatter[]{

      DateTimeFormatter.ofPattern("yyyy-MM-dd"),

      DateTimeFormatter.ofPattern("yyyy/MM/dd"),

      DateTimeFormatter.ofPattern("yyyy年MM月dd日")

  };



  public ParsedReimbursement parse(DingtalkApprovalForm approvalForm) {

    ParsedReimbursement parsed = new ParsedReimbursement();

    ExpenseReimbursement header = buildHeader(approvalForm);



    List<ExpenseReimbursementItem> items = new ArrayList<>();

    if (StringUtils.hasText(approvalForm.getFormComponents())) {

      JSONArray components = JSON.parseArray(approvalForm.getFormComponents());

      if (components != null) {

        for (int i = 0; i < components.size(); i++) {

          JSONObject component = components.getJSONObject(i);

          if (component == null) {

            continue;

          }



          String name = component.getString("name");

          String value = firstNonBlank(component.getString("value"), formatCellValue(component.get("value")));

          String componentType = component.getString("componentType");

          String bizAlias = component.getString("bizAlias");

          String extValue = getExtValue(component);



          if (isTableField(componentType, bizAlias, name)) {

            items.addAll(parseTableRows(value, component.get("value"), extValue));

            applyTableTotal(header, extValue);

            applyHeaderComponent(header, component);

            continue;

          }



          applyHeaderComponent(header, component);

          applyHeaderField(header, name, value);

        }

      }

    }



    mergeRawDetail(header, items, approvalForm.getRawDetail());



    if (header.getTotalAmount() == null && !items.isEmpty()) {

      BigDecimal sum = BigDecimal.ZERO;

      for (ExpenseReimbursementItem item : items) {

        if (item.getAmount() != null) {

          sum = sum.add(item.getAmount());

        }

      }

      if (sum.compareTo(BigDecimal.ZERO) > 0) {

        header.setTotalAmount(sum);

      }

    }



    parsed.setHeader(header);

    parsed.setItems(items);

    return parsed;

  }



  private ExpenseReimbursement buildHeader(DingtalkApprovalForm approvalForm) {

    ExpenseReimbursement header = new ExpenseReimbursement();

    header.setApprovalFormId(approvalForm.getId());

    header.setProcessInstanceId(approvalForm.getProcessInstanceId());

    header.setProcessCode(approvalForm.getProcessCode());

    header.setBusinessId(approvalForm.getBusinessId());

    header.setTitle(approvalForm.getTitle());

    header.setSubmitterId(approvalForm.getStaffId());

    header.setSubmitterName(parseSubmitterName(approvalForm.getTitle()));

    header.setApprovalResult(approvalForm.getApprovalResult());

    header.setBizCategoryId(approvalForm.getBizCategoryId());

    header.setApprovalUrl(approvalForm.getApprovalUrl());

    header.setSubmitTime(approvalForm.getSubmitTime());

    header.setFinishTime(approvalForm.getFinishTime());

    header.setCreatedAt(LocalDateTime.now());

    return header;

  }



  private void mergeRawDetail(ExpenseReimbursement header, List<ExpenseReimbursementItem> items, String rawDetail) {

    if (!StringUtils.hasText(rawDetail)) {

      return;

    }

    try {

      JSONObject detail = unwrapDetail(JSON.parseObject(rawDetail));

      if (detail == null) {

        return;

      }

      enrichHeaderFromDetail(header, detail);

      String formSchema = detail.getString("formSchema");

      List<ExpenseReimbursementItem> rawItems = new ArrayList<>();

      JSONObject formData = detail.getJSONObject("formData");

      if (formData != null) {

        parseItemsFromFormData(header, rawItems, formData, formSchema);

      }

      JSONArray formComponents = detail.getJSONArray("formComponentValues");

      if (formComponents == null) {

        formComponents = detail.getJSONArray("form_component_values");

      }

      if (formComponents != null) {

        parseItemsFromFormComponents(header, rawItems, formComponents);

      }

      mergeParsedItems(items, rawItems, formData);

      if (formData != null) {

        mergeHeaderFromFormData(header, formData, formSchema);

      }

    } catch (Exception ignored) {

      // ignore malformed raw detail

    }

  }



  private JSONObject unwrapDetail(JSONObject raw) {

    if (raw == null) {

      return null;

    }

    return DingtalkApprovalDetailNormalizer.normalize(raw);

  }



  private void enrichHeaderFromDetail(ExpenseReimbursement header, JSONObject detail) {

    if (!StringUtils.hasText(header.getBusinessId())) {

      header.setBusinessId(DingtalkApprovalDetailUtil.extractBusinessId(detail));

    }

    JSONObject originatorInfo = detail.getJSONObject("originatorInfo");

    if (originatorInfo != null && !StringUtils.hasText(header.getSubmitterName())) {

      header.setSubmitterName(originatorInfo.getString("name"));

    }

    if (!StringUtils.hasText(header.getDepartment())) {

      header.setDepartment(firstNonBlank(

          detail.getString("originatorDeptName"),

          detail.getString("originatorDeptNameLastStage")));

    }

  }



  private void mergeHeaderFromFormData(ExpenseReimbursement header, JSONObject formData, String formSchema) {

    for (String key : formData.keySet()) {

      JSONObject field = formData.getJSONObject(key);

      if (field == null) {

        continue;

      }

      String value = field.getString("value");

      String extValue = field.getString("extendValue");

      if ("pmc_business_id".equals(key) && StringUtils.hasText(value)) {

        header.setBusinessId(value);

        continue;

      }

      if (key.startsWith("RecipientAccountField")) {

        applyRecipientAccount(header, value, extValue);

        continue;

      }

      if (key.startsWith("DepartmentField") && !StringUtils.hasText(header.getDepartment())) {

        header.setDepartment(firstNonBlank(value, parseDeptName(extValue)));

        continue;

      }

      if (key.startsWith("InnerContactField") && !StringUtils.hasText(header.getSubmitterName())) {

        header.setSubmitterName(value);

        continue;

      }

      if (key.startsWith("TableField")) {

        applyTableTotal(header, extValue);

        continue;

      }

      String bizAlias = resolveBizAliasFromSchema(formSchema, key);

      if (StringUtils.hasText(bizAlias)) {

        JSONObject component = new JSONObject();

        component.put("bizAlias", bizAlias);

        component.put("value", value);

        component.put("extValue", extValue);

        applyHeaderComponent(header, component);

      }

      String label = DingtalkApprovalDetailUtil.resolveLabelFromSchema(formSchema, key);

      applyHeaderField(header, label, value);

    }

  }



  private void parseItemsFromFormData(ExpenseReimbursement header, List<ExpenseReimbursementItem> items,

                                      JSONObject formData, String formSchema) {

    for (String key : formData.keySet()) {

      if (!key.startsWith("TableField")) {

        continue;

      }

      JSONObject field = formData.getJSONObject(key);

      if (field == null) {

        continue;

      }

      items.addAll(parseTableRows(field.getString("value"), field.getString("value"), field.getString("extendValue")));

      applyTableTotal(header, field.getString("extendValue"));

    }

  }



  private void parseItemsFromFormComponents(ExpenseReimbursement header, List<ExpenseReimbursementItem> items,

                                            JSONArray formComponents) {

    if (formComponents == null || formComponents.isEmpty()) {

      return;

    }

    for (int i = 0; i < formComponents.size(); i++) {

      JSONObject component = formComponents.getJSONObject(i);

      if (component == null) {

        continue;

      }

      String name = component.getString("name");

      String componentType = component.getString("componentType");

      String bizAlias = component.getString("bizAlias");

      if (!isTableField(componentType, bizAlias, name)) {

        continue;

      }

      String value = firstNonBlank(component.getString("value"), formatCellValue(component.get("value")));

      String extValue = getExtValue(component);

      items.addAll(parseTableRows(value, component.get("value"), extValue));

      applyTableTotal(header, extValue);

      applyHeaderComponent(header, component);

    }

  }



  private void mergeParsedItems(List<ExpenseReimbursementItem> target, List<ExpenseReimbursementItem> rawItems,

                                JSONObject formData) {

    if (rawItems == null || rawItems.isEmpty()) {

      return;

    }

    if (target.isEmpty()) {

      target.addAll(rawItems);

      return;

    }

    if (rawItems.size() > target.size()) {

      target.clear();

      target.addAll(rawItems);

      return;

    }

    if (formData != null) {

      enrichItemsFromFormData(target, formData);

    }

    mergeItemsByRowIndex(target, rawItems);

  }



  private void mergeItemsByRowIndex(List<ExpenseReimbursementItem> target, List<ExpenseReimbursementItem> rawItems) {

    for (ExpenseReimbursementItem item : target) {

      for (ExpenseReimbursementItem parsed : rawItems) {

        if (parsed.getRowIndex() != null && parsed.getRowIndex().equals(item.getRowIndex())) {

          if (!StringUtils.hasText(item.getAttachmentFiles())) {

            item.setAttachmentFiles(parsed.getAttachmentFiles());

          }

          if (!StringUtils.hasText(item.getAttachmentInfo())) {

            item.setAttachmentInfo(parsed.getAttachmentInfo());

          }

          if (!StringUtils.hasText(item.getInvoiceInfo())) {

            item.setInvoiceInfo(parsed.getInvoiceInfo());

          }

          if (!StringUtils.hasText(item.getDescription())) {

            item.setDescription(parsed.getDescription());

          }

          if (item.getAmount() == null) {

            item.setAmount(parsed.getAmount());

          }

          if (item.getExpenseDate() == null) {

            item.setExpenseDate(parsed.getExpenseDate());

          }

          if (!StringUtils.hasText(item.getExpenseType())) {

            item.setExpenseType(parsed.getExpenseType());

          }

        }

      }

    }

  }



  private void enrichItemsFromFormData(List<ExpenseReimbursementItem> items, JSONObject formData) {

    for (String key : formData.keySet()) {

      if (!key.startsWith("TableField")) {

        continue;

      }

      JSONObject field = formData.getJSONObject(key);

      if (field == null) {

        continue;

      }

      List<ExpenseReimbursementItem> parsedItems = parseTableRows(

          field.getString("value"), field.getString("value"), field.getString("extendValue"));

      for (ExpenseReimbursementItem item : items) {

        for (ExpenseReimbursementItem parsed : parsedItems) {

          if (parsed.getRowIndex() != null && parsed.getRowIndex().equals(item.getRowIndex())) {

            if (!StringUtils.hasText(item.getAttachmentFiles())) {

              item.setAttachmentFiles(parsed.getAttachmentFiles());

            }

            if (!StringUtils.hasText(item.getAttachmentInfo())) {

              item.setAttachmentInfo(parsed.getAttachmentInfo());

            }

            if (!StringUtils.hasText(item.getInvoiceInfo())) {

              item.setInvoiceInfo(parsed.getInvoiceInfo());

            }

            if (!StringUtils.hasText(item.getDescription())) {

              item.setDescription(parsed.getDescription());

            }

          }

        }

      }

    }

  }



  private String getExtValue(JSONObject component) {

    if (component == null) {

      return null;

    }

    return firstNonBlank(component.getString("extValue"), component.getString("ext_value"));

  }



  private String resolveBizAliasFromSchema(String formSchema, String fieldId) {

    return DingtalkApprovalDetailUtil.resolveBizAliasFromSchema(formSchema, fieldId);

  }



  private void applyHeaderComponent(ExpenseReimbursement header, JSONObject component) {

    String bizAlias = component.getString("bizAlias");

    String value = component.getString("value");

    String extValue = getExtValue(component);



    if (!StringUtils.hasText(bizAlias)) {

      return;

    }



    switch (bizAlias) {

      case "recordDept":

        header.setDepartment(firstNonBlank(value, parseDeptName(extValue)));

        break;

      case "remark":

        header.setReason(value);

        break;

      case "principal":

        if (StringUtils.hasText(value)) {

          header.setSubmitterName(value);

        }

        break;

      case "company":

        header.setCompanyName(value);

        break;

      case "recipientAccount":

        applyRecipientAccount(header, value, extValue);

        break;

      default:

        break;

    }

  }



  private void applyRecipientAccount(ExpenseReimbursement header, String value, String extValue) {

    if (StringUtils.hasText(extValue)) {

      try {

        JSONObject account = JSON.parseObject(extValue);

        if (account != null) {

          header.setBankAccount(firstNonBlank(account.getString("cardNo"), value));

          String bankName = firstNonBlank(account.getString("instBranchName"), account.getString("instName"));

          header.setBankName(bankName);

          return;

        }

      } catch (Exception ignored) {

        // fall through

      }

    }

    header.setBankAccount(value);

  }



  private void applyTableTotal(ExpenseReimbursement header, String extValue) {

    if (header.getTotalAmount() != null || !StringUtils.hasText(extValue)) {

      return;

    }

    try {

      JSONObject ext = JSON.parseObject(extValue);

      JSONArray statValue = ext.getJSONArray("statValue");

      if (statValue == null || statValue.isEmpty()) {

        return;

      }

      JSONObject stat = statValue.getJSONObject(0);

      if (stat != null) {

        header.setTotalAmount(parseAmount(stat.getString("num")));

      }

    } catch (Exception ignored) {

      // ignore malformed extValue

    }

  }



  private void applyHeaderField(ExpenseReimbursement header, String name, String value) {

    if (!StringUtils.hasText(name) || !StringUtils.hasText(value)) {

      return;

    }



    if (matches(name, "报销事由", "事由", "备注说明", "备注")) {

      header.setReason(firstNonBlank(header.getReason(), value));

    } else if (matches(name, "总金额", "报销总金额", "合计金额", "报销金额", "总报销金额")) {

      header.setTotalAmount(parseAmount(value));

    } else if (matches(name, "所属部门", "部门", "费用归属部门", "报销部门", "归属部门")) {

      header.setDepartment(value);

    } else if (matches(name, "收款账户", "银行卡号", "银行账号", "账号")) {

      header.setBankAccount(value);

    } else if (matches(name, "开户行", "开户银行", "银行名称", "收款银行")) {

      header.setBankName(value);

    } else if (matches(name, "企业主体", "公司", "企业")) {

      header.setCompanyName(value);

    }

  }



  private List<ExpenseReimbursementItem> parseTableRows(String stringValue, Object rawValue, String extValue) {

    List<ExpenseReimbursementItem> items = new ArrayList<>();

    JSONArray rows = toRowArray(stringValue, rawValue);

    JSONArray extRows = toRowArrayFromExtValue(extValue);

    if ((rows == null || rows.isEmpty()) && extRows != null && !extRows.isEmpty()) {

      rows = extRows;

    } else if (rows != null && extRows != null && extRows.size() > rows.size()) {

      rows = extRows;

    }

    if (rows == null || rows.isEmpty()) {

      return items;

    }



    for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {

      Map<String, String> fieldMap = toFieldMap(rows.get(rowIndex));

      if (fieldMap.isEmpty()) {

        continue;

      }



      ExpenseReimbursementItem item = new ExpenseReimbursementItem();

      item.setRowIndex(rowIndex + 1);

      item.setExpenseType(firstValue(fieldMap,

          "reimbursementType", "费用类型", "类型", "报销类型", "费用类别"));

      item.setExpenseDate(parseDate(firstValue(fieldMap,

          "occurDate", "发生日期", "日期", "费用日期", "报销日期", "费用发生日期", "消费日期")));

      item.setAmount(parseAmount(firstValue(fieldMap,

          "reimbursementMoney", "金额", "报销金额", "费用金额", "金额（元）", "报销金额（元）")));

      item.setDescription(firstValue(fieldMap,

          "expenseDetail", "费用说明", "说明", "备注", "摘要"));

      Object rawRow = rows.get(rowIndex);

      JSONArray attachmentArray = DingtalkAttachmentUtil.extractAttachments(rawRow);

      item.setAttachmentFiles(attachmentArray.isEmpty() ? null : attachmentArray.toJSONString());

      item.setAttachmentInfo(DingtalkAttachmentUtil.formatAttachmentNames(attachmentArray));

      item.setInvoiceInfo(firstValue(fieldMap,

          "electronicInvoice", "electronicInvoiceOut", "发票", "发票信息", "发票号码", "发票号"));

      item.setRawRowJson(JSON.toJSONString(fieldMap));

      item.setCreatedAt(LocalDateTime.now());

      items.add(item);

    }

    return items;

  }



  private JSONArray toRowArrayFromExtValue(String extValue) {

    if (!StringUtils.hasText(extValue)) {

      return null;

    }

    try {

      JSONObject ext = JSON.parseObject(extValue);

      if (ext == null) {

        return null;

      }

      JSONArray data = ext.getJSONArray("data");

      if (data != null && !data.isEmpty()) {

        return data;

      }

    } catch (Exception ignored) {

      // ignore malformed extValue

    }

    return null;

  }



  private JSONArray toRowArray(String stringValue, Object rawValue) {

    if (rawValue instanceof JSONArray) {

      return (JSONArray) rawValue;

    }

    if (rawValue instanceof JSONObject) {

      JSONObject rowObject = (JSONObject) rawValue;

      if (rowObject.containsKey("rowValue")) {

        JSONArray rows = new JSONArray();

        rows.add(rowObject);

        return rows;

      }

    }

    if (StringUtils.hasText(stringValue)) {

      JSONArray parsed = tryParseJsonArray(stringValue);

      if (parsed != null && !parsed.isEmpty()) {

        return parsed;

      }

    }

    return null;

  }



  private JSONArray tryParseJsonArray(String text) {

    if (!StringUtils.hasText(text)) {

      return null;

    }

    try {

      Object parsed = JSON.parse(text.trim());

      if (parsed instanceof JSONArray) {

        return (JSONArray) parsed;

      }

      if (parsed instanceof String) {

        return tryParseJsonArray((String) parsed);

      }

      if (parsed instanceof JSONObject) {

        JSONObject obj = (JSONObject) parsed;

        JSONArray data = obj.getJSONArray("data");

        if (data != null && !data.isEmpty()) {

          return data;

        }

        if (obj.containsKey("rowValue")) {

          JSONArray rows = new JSONArray();

          rows.add(obj);

          return rows;

        }

      }

    } catch (Exception ignored) {

      // try next strategy

    }

    return null;

  }



  private Map<String, String> toFieldMap(Object rowObj) {

    Map<String, String> fieldMap = new HashMap<>();

    if (rowObj instanceof JSONObject) {

      JSONObject row = (JSONObject) rowObj;

      if (row.containsKey("rowValue")) {

        JSONArray rowValue = row.getJSONArray("rowValue");

        if (rowValue != null) {

          for (int i = 0; i < rowValue.size(); i++) {

            JSONObject cell = rowValue.getJSONObject(i);

            if (cell == null) {

              continue;

            }

            putTableCell(fieldMap, cell);

          }

        }

        return fieldMap;

      }

      for (String key : row.keySet()) {

        fieldMap.put(key, row.getString(key));

      }

      return fieldMap;

    }

    if (rowObj instanceof JSONArray) {

      JSONArray row = (JSONArray) rowObj;

      for (int i = 0; i < row.size(); i++) {

        JSONObject cell = row.getJSONObject(i);

        if (cell != null) {

          putTableCell(fieldMap, cell);

        }

      }

    }

    return fieldMap;

  }



  private void putTableCell(Map<String, String> fieldMap, JSONObject cell) {

    if (cell == null) {

      return;

    }

    putCell(fieldMap, cell.getString("label"), cell.get("value"));

    putCell(fieldMap, cell.getString("bizAlias"), cell.get("value"));

    putCell(fieldMap, cell.getString("key"), cell.get("value"));

    putCell(fieldMap, cell.getString("name"), cell.get("value"));

    String extValue = firstNonBlank(cell.getString("extendValue"), cell.getString("ext_value"));

    if (!StringUtils.hasText(extValue)) {

      return;

    }

    try {

      Object extParsed = JSON.parse(extValue);

      if (extParsed instanceof JSONObject) {

        JSONObject extObj = (JSONObject) extParsed;

        String text = firstNonBlank(

            extObj.getString("label"),

            extObj.getString("name"),

            extObj.getString("value"),

            extObj.getString("text"));

        if (StringUtils.hasText(text)) {

          putCell(fieldMap, cell.getString("bizAlias"), text);

          putCell(fieldMap, cell.getString("label"), text);

        }

      } else if (extParsed != null) {

        putCell(fieldMap, cell.getString("bizAlias"), extParsed);

      }

    } catch (Exception ignored) {

      putCell(fieldMap, cell.getString("bizAlias"), extValue);

    }

  }



  private void putCell(Map<String, String> fieldMap, String key, Object value) {

    if (!StringUtils.hasText(key) || value == null) {

      return;

    }

    fieldMap.put(key, formatCellValue(value));

  }



  private String formatCellValue(Object value) {

    if (value == null) {

      return null;

    }

    if (value instanceof String) {

      return (String) value;

    }

    if (value instanceof JSONArray) {

      return formatAttachmentNames((JSONArray) value);

    }

    if (value instanceof JSONObject) {

      return ((JSONObject) value).toJSONString();

    }

    return String.valueOf(value);

  }



  private String formatAttachmentNames(JSONArray array) {

    if (array == null || array.isEmpty()) {

      return null;

    }

    return array.stream()

        .map(element -> {

          if (element instanceof JSONObject) {

            JSONObject obj = (JSONObject) element;

            return cleanFileName(firstNonBlank(obj.getString("fileName"), obj.getString("name")));

          }

          return cleanFileName(String.valueOf(element));

        })

        .filter(StringUtils::hasText)

        .collect(Collectors.joining(", "));

  }



  private String cleanFileName(String fileName) {

    if (!StringUtils.hasText(fileName)) {

      return fileName;

    }

    return fileName.replaceAll("_\\d*_\\[B@[0-9a-fA-F]+", "")

        .replaceAll("\\[B@[0-9a-fA-F]+", "");

  }



  private boolean isTableField(String componentType, String bizAlias, String name) {

    if ("TableField".equalsIgnoreCase(componentType)) {

      return true;

    }

    if ("addReimbursementDetail".equals(bizAlias)) {

      return true;

    }

    return matches(name, "报销明细", "费用明细", "明细", "报销详情");

  }



  private boolean matches(String name, String... aliases) {

    if (!StringUtils.hasText(name)) {

      return false;

    }

    for (String alias : aliases) {

      if (name.equals(alias) || name.contains(alias)) {

        return true;

      }

    }

    return false;

  }



  private String firstValue(Map<String, String> fieldMap, String... aliases) {

    for (String alias : aliases) {

      for (Map.Entry<String, String> entry : fieldMap.entrySet()) {

        if (matches(entry.getKey(), alias) && StringUtils.hasText(entry.getValue())) {

          return entry.getValue();

        }

      }

    }

    return null;

  }



  private BigDecimal parseAmount(String value) {

    if (!StringUtils.hasText(value)) {

      return null;

    }

    try {

      String normalized = value.replace(",", "").replace("元", "").trim();

      return new BigDecimal(normalized);

    } catch (NumberFormatException e) {

      return null;

    }

  }



  private LocalDate parseDate(String value) {

    if (!StringUtils.hasText(value)) {

      return null;

    }

    String normalized = value.trim();

    for (DateTimeFormatter formatter : DATE_FORMATTERS) {

      try {

        return LocalDate.parse(normalized, formatter);

      } catch (DateTimeParseException ignored) {

        // try next formatter

      }

    }

    if (normalized.length() >= 10) {

      try {

        return LocalDate.parse(normalized.substring(0, 10));

      } catch (DateTimeParseException ignored) {

        return null;

      }

    }

    return null;

  }



  private String parseSubmitterName(String title) {

    if (!StringUtils.hasText(title) || !title.contains("提交")) {

      return null;

    }

    return title.substring(0, title.indexOf("提交")).trim();

  }



  private String parseDeptName(String extValue) {

    if (!StringUtils.hasText(extValue)) {

      return null;

    }

    try {

      JSONArray array = JSON.parseArray(extValue);

      if (array != null && !array.isEmpty()) {

        JSONObject dept = array.getJSONObject(0);

        if (dept != null) {

          return firstNonBlank(dept.getString("deptName"), dept.getString("name"));

        }

      }

    } catch (Exception ignored) {

      // ignore malformed extValue

    }

    return null;

  }



  private String firstNonBlank(String... values) {
    if (values == null) {
      return null;
    }
    for (String value : values) {
      if (StringUtils.hasText(value)) {
        return value;
      }
    }
    return null;
  }



  public static LocalDateTime parseEventTime(Long epochMillis) {

    if (epochMillis == null || epochMillis <= 0) {

      return null;

    }

    return LocalDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), ZONE);

  }



  public static LocalDateTime parseIsoTime(String isoTime) {

    if (!StringUtils.hasText(isoTime)) {

      return null;

    }

    try {

      return LocalDateTime.ofInstant(Instant.parse(isoTime), ZONE);

    } catch (Exception ignored) {

      return null;

    }

  }



  public static class ParsedReimbursement {

    private ExpenseReimbursement header;

    private List<ExpenseReimbursementItem> items;



    public ExpenseReimbursement getHeader() {

      return header;

    }



    public void setHeader(ExpenseReimbursement header) {

      this.header = header;

    }



    public List<ExpenseReimbursementItem> getItems() {

      return items;

    }



    public void setItems(List<ExpenseReimbursementItem> items) {

      this.items = items;

    }

  }

}

