package com.zuantan.dismantling.service;

import com.zuantan.dismantling.vo.VoucherDetailVO;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Service
public class KingdeeVoucherQueryService {

    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");
    private static final String SESSION_HEADER = "kdservice-sessionid";
    private static final String EXECUTE_BILL_QUERY_PATH =
            "Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc";
    private static final String VIEW_PATH =
            "Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.View.common.kdsvc";

    public static final String ORG_FIELD_KEY = "FAccountBookID.FNumber";

    private static final String BASE_FIELD_KEYS =
            "FDate,FYear,FPeriod,FVOUCHERGROUPID.FName,FVOUCHERGROUPNO,FExplanation,"
                    + "FAccountID.FNumber,FAccountID.FName,FCurrencyID.FName,FAmountFor,FDebit,FCredit,"
                    + "FCreatorId.FName,FCheckerId.FName";

    private static final List<String> ORG_FIELD_CANDIDATES = Arrays.asList(
            "FAccountBookID.FNumber",
            "FAccountBookID",
            "FAcctOrgId.FNumber",
            "FBookOrgId.FNumber",
            "FOrgId.FNumber",
            "FBookID.FNumber"
    );

    private static final Pattern ORG_KEY_PATTERN =
            Pattern.compile("(?i).*(Org|Book|AccountBook).*");

    private final OkHttpClient client;

    private volatile String resolvedOrgFieldKey = ORG_FIELD_KEY;

    public KingdeeVoucherQueryService() {
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .build();
    }

    public String getResolvedOrgFieldKey() {
        return resolvedOrgFieldKey;
    }

    public Map<String, Object> probeOrgField(String kingdeeUrl, String sessionId, String formId,
                                              String year, String period, String orgCodeHint) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("formId", formId);
        result.put("probeSteps", new ArrayList<Map<String, Object>>());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> steps = (List<Map<String, Object>>) result.get("probeSteps");

        Map<String, Object> wildcardStep = runProbeStep(kingdeeUrl, sessionId, formId, year, period,
                "*", null, 1, "wildcard");
        steps.add(wildcardStep);

        if (Boolean.TRUE.equals(wildcardStep.get("success"))) {
            String orgField = extractOrgFieldFromWildcardResponse(
                    (String) wildcardStep.get("rawResponse"), orgCodeHint);
            if (orgField != null) {
                resolvedOrgFieldKey = orgField;
                result.put("success", true);
                result.put("orgFieldKey", orgField);
                result.put("method", "wildcard");
                result.put("rawResponsePreview", truncate((String) wildcardStep.get("rawResponse"), 2000));
                return result;
            }
        }

        if (orgCodeHint != null && !orgCodeHint.isEmpty()) {
            for (String candidate : ORG_FIELD_CANDIDATES) {
                Map<String, Object> candidateStep = runProbeStep(kingdeeUrl, sessionId, formId, year, period,
                        BASE_FIELD_KEYS + "," + candidate,
                        buildOrgFilter(candidate, orgCodeHint, year, period),
                        1, "candidate:" + candidate);
                steps.add(candidateStep);
                if (Boolean.TRUE.equals(candidateStep.get("success"))) {
                    resolvedOrgFieldKey = candidate.contains(".") ? candidate : candidate + ".FNumber";
                    result.put("success", true);
                    result.put("orgFieldKey", resolvedOrgFieldKey);
                    result.put("method", "candidate_filter");
                    result.put("rawResponsePreview", truncate((String) candidateStep.get("rawResponse"), 2000));
                    return result;
                }
            }
        }

        Map<String, Object> basicStep = runProbeStep(kingdeeUrl, sessionId, formId, year, period,
                BASE_FIELD_KEYS + ",FAccountBookID,FAccountBookID.FNumber",
                buildPeriodFilter(year, period), 3, "basic_no_org");
        steps.add(basicStep);

        if (Boolean.TRUE.equals(basicStep.get("success"))) {
            String orgField = inferOrgFieldFromBasicResponse(
                    (String) basicStep.get("rawResponse"), orgCodeHint);
            if (orgField != null) {
                resolvedOrgFieldKey = orgField;
                result.put("success", true);
                result.put("orgFieldKey", orgField);
                result.put("method", "basic_inference");
                result.put("rawResponsePreview", truncate((String) basicStep.get("rawResponse"), 2000));
                return result;
            }
        }

        Map<String, Object> viewStep = tryViewMetadata(kingdeeUrl, sessionId, formId);
        steps.add(viewStep);
        if (viewStep.get("orgFieldKey") != null) {
            resolvedOrgFieldKey = (String) viewStep.get("orgFieldKey");
            result.put("success", true);
            result.put("orgFieldKey", resolvedOrgFieldKey);
            result.put("method", "view_metadata");
            return result;
        }

        resolvedOrgFieldKey = ORG_FIELD_KEY;
        result.put("success", true);
        result.put("orgFieldKey", ORG_FIELD_KEY);
        result.put("method", "default_fallback");
        result.put("message", "通配符与 View 均不可用，已采用金蝶 GL_VOUCHER 标准账簿字段 FAccountBookID.FNumber");
        return result;
    }

    public List<VoucherDetailVO> queryVoucherDetails(String kingdeeUrl, String sessionId, String formId,
                                                     String accountingPeriod, String voucherNumberStart,
                                                     String voucherNumberEnd) {
        return queryVoucherDetails(kingdeeUrl, sessionId, formId, accountingPeriod,
                voucherNumberStart, voucherNumberEnd, "106", resolvedOrgFieldKey);
    }

    public List<VoucherDetailVO> queryVoucherDetails(String kingdeeUrl, String sessionId, String formId,
                                                     String accountingPeriod, String voucherNumberStart,
                                                     String voucherNumberEnd, String orgCompanyCode,
                                                     String orgFieldKey) {
        try {
            String queryUrl = kingdeeUrl + EXECUTE_BILL_QUERY_PATH;
            String effectiveOrgField = orgFieldKey != null && !orgFieldKey.isEmpty()
                    ? orgFieldKey : ORG_FIELD_KEY;
            JSONObject requestBody = buildQueryRequestBody(formId, accountingPeriod,
                    voucherNumberStart, voucherNumberEnd, orgCompanyCode, effectiveOrgField);
            String responseBody = executePostRequest(queryUrl, sessionId, requestBody.toJSONString());
            return parseResponse(responseBody, effectiveOrgField);
        } catch (IOException e) {
            throw new RuntimeException("网络请求失败：" + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("查询凭证详情失败：" + e.getMessage(), e);
        }
    }

    private JSONObject buildQueryRequestBody(String formId, String accountingPeriod,
                                             String voucherNumberStart, String voucherNumberEnd,
                                             String orgCompanyCode, String orgFieldKey) {
        JSONObject requestBody = new JSONObject();
        JSONObject data = new JSONObject();
        data.put("FormId", formId);
        data.put("FieldKeys", BASE_FIELD_KEYS + "," + orgFieldKey);
        data.put("Limit", 2000);
        data.put("StartRow", 0);
        data.put("TopRowCount", 0);

        StringBuilder filterString = new StringBuilder();
        if (accountingPeriod != null && !accountingPeriod.isEmpty()) {
            filterString.append("FYear=").append(accountingPeriod.substring(0, 4))
                    .append(" AND FPeriod=").append(accountingPeriod.substring(4));
        }

        if (orgCompanyCode != null && !orgCompanyCode.isEmpty()) {
            if (filterString.length() > 0) {
                filterString.append(" AND ");
            }
            filterString.append(buildOrgFilter(orgFieldKey, orgCompanyCode, null, null));
        }

        if (voucherNumberStart != null && !voucherNumberStart.isEmpty()
                && voucherNumberEnd != null && !voucherNumberEnd.isEmpty()) {
            if (filterString.length() > 0) {
                filterString.append(" AND ");
            }
            filterString.append("FVOUCHERGROUPNO >= '").append(voucherNumberStart)
                    .append("' AND FVOUCHERGROUPNO <= '").append(voucherNumberEnd).append("'");
        }

        if (filterString.length() > 0) {
            data.put("FilterString", filterString.toString());
        }

        requestBody.put("data", data);
        return requestBody;
    }

    private String buildOrgFilter(String orgFieldKey, String orgCompanyCode, String year, String period) {
        String filter = orgFieldKey + " = '" + orgCompanyCode + "'";
        if (year != null && period != null) {
            return "FYear=" + year + " AND FPeriod=" + period + " AND " + filter;
        }
        return filter;
    }

    private String buildPeriodFilter(String year, String period) {
        if (year != null && period != null) {
            return "FYear=" + year + " AND FPeriod=" + period;
        }
        return "";
    }

    private Map<String, Object> runProbeStep(String kingdeeUrl, String sessionId, String formId,
                                             String year, String period, String fieldKeys,
                                             String filterString, int limit, String stepName) {
        Map<String, Object> step = new LinkedHashMap<>();
        step.put("step", stepName);
        step.put("fieldKeys", fieldKeys);
        step.put("filterString", filterString);
        try {
            JSONObject data = new JSONObject();
            data.put("FormId", formId);
            data.put("FieldKeys", fieldKeys);
            data.put("Limit", limit);
            data.put("StartRow", 0);
            data.put("TopRowCount", 0);
            if (filterString != null && !filterString.isEmpty()) {
                data.put("FilterString", filterString);
            } else if (year != null && period != null) {
                data.put("FilterString", buildPeriodFilter(year, period));
            }
            JSONObject requestBody = new JSONObject();
            requestBody.put("data", data);

            String responseBody = executePostRequest(
                    kingdeeUrl + EXECUTE_BILL_QUERY_PATH, sessionId, requestBody.toJSONString());
            step.put("rawResponse", responseBody);

            if (isErrorResponse(responseBody)) {
                step.put("success", false);
                step.put("error", extractErrorMessage(responseBody));
            } else {
                step.put("success", true);
            }
        } catch (Exception e) {
            step.put("success", false);
            step.put("error", e.getMessage());
        }
        return step;
    }

    private Map<String, Object> tryViewMetadata(String kingdeeUrl, String sessionId, String formId) {
        Map<String, Object> step = new LinkedHashMap<>();
        step.put("step", "view_metadata");
        try {
            JSONObject requestBody = new JSONObject();
            requestBody.put("formid", formId);
            JSONObject data = new JSONObject();
            data.put("CreateOrgId", 0);
            data.put("Number", "");
            data.put("Id", "");
            requestBody.put("data", data);

            String responseBody = executePostRequest(
                    kingdeeUrl + VIEW_PATH, sessionId, requestBody.toJSONString());
            step.put("rawResponse", truncate(responseBody, 1000));

            if (!isErrorResponse(responseBody)) {
                JSONObject json = JSON.parseObject(responseBody);
                String orgField = findOrgFieldInJson(json, "106");
                if (orgField != null) {
                    step.put("success", true);
                    step.put("orgFieldKey", orgField);
                    return step;
                }
            }
            step.put("success", false);
            step.put("error", extractErrorMessage(responseBody));
        } catch (Exception e) {
            step.put("success", false);
            step.put("error", e.getMessage());
        }
        return step;
    }

    private String extractOrgFieldFromWildcardResponse(String responseBody, String orgCodeHint) {
        try {
            JSONArray outer = JSON.parseArray(responseBody);
            if (outer == null || outer.isEmpty()) {
                return null;
            }
            Object first = outer.get(0);
            if (first instanceof JSONObject) {
                return findOrgFieldInJson((JSONObject) first, orgCodeHint);
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String inferOrgFieldFromBasicResponse(String responseBody, String orgCodeHint) {
        try {
            JSONArray outer = JSON.parseArray(responseBody);
            if (outer == null || outer.isEmpty()) {
                return null;
            }
            Object first = outer.get(0);
            if (first instanceof JSONArray) {
                JSONArray row = (JSONArray) first;
                if (row.size() >= 12 && orgCodeHint != null) {
                    String lastCol = row.getString(row.size() - 1);
                    String secondLast = row.getString(row.size() - 2);
                    if (orgCodeHint.equals(lastCol)) {
                        return ORG_FIELD_KEY;
                    }
                    if (orgCodeHint.equals(secondLast)) {
                        return "FAccountBookID";
                    }
                }
                if (row.size() >= 11) {
                    return ORG_FIELD_KEY;
                }
            }
        } catch (Exception ignored) {
        }
        return ORG_FIELD_KEY;
    }

    private String findOrgFieldInJson(Object node, String orgCodeHint) {
        if (node instanceof JSONObject) {
            JSONObject obj = (JSONObject) node;
            for (String key : obj.keySet()) {
                Object val = obj.get(key);
                if (ORG_KEY_PATTERN.matcher(key).matches()) {
                    if (orgCodeHint != null && orgCodeHint.equals(String.valueOf(val))) {
                        return key.contains(".FNumber") ? key : key + ".FNumber";
                    }
                    if (val instanceof JSONObject) {
                        JSONObject sub = (JSONObject) val;
                        if (orgCodeHint != null && orgCodeHint.equals(sub.getString("FNumber"))) {
                            return key + ".FNumber";
                        }
                    }
                }
                String nested = findOrgFieldInJson(val, orgCodeHint);
                if (nested != null) {
                    return nested;
                }
            }
        } else if (node instanceof JSONArray) {
            JSONArray arr = (JSONArray) node;
            for (int i = 0; i < arr.size(); i++) {
                String nested = findOrgFieldInJson(arr.get(i), orgCodeHint);
                if (nested != null) {
                    return nested;
                }
            }
        }
        return null;
    }

    private boolean isErrorResponse(String responseBody) {
        if (responseBody == null || responseBody.isEmpty()) {
            return true;
        }
        if (responseBody.contains("\"IsSuccess\":false") || responseBody.contains("ErrorCode")) {
            try {
                if (responseBody.trim().startsWith("[")) {
                    JSONArray outer = JSON.parseArray(responseBody);
                    if (outer != null && !outer.isEmpty()) {
                        Object first = outer.get(0);
                        if (first instanceof JSONArray) {
                            Object inner = ((JSONArray) first).get(0);
                            if (inner instanceof JSONObject) {
                                return isErrorJson((JSONObject) inner);
                            }
                        } else if (first instanceof JSONObject) {
                            return isErrorJson((JSONObject) first);
                        }
                    }
                } else if (responseBody.trim().startsWith("{")) {
                    return isErrorJson(JSON.parseObject(responseBody));
                }
            } catch (Exception ignored) {
            }
        }
        return false;
    }

    private boolean isErrorJson(JSONObject obj) {
        JSONObject result = obj.getJSONObject("Result");
        if (result == null) {
            result = obj;
        }
        JSONObject status = result.getJSONObject("ResponseStatus");
        if (status != null) {
            return !status.getBooleanValue("IsSuccess");
        }
        return false;
    }

    private String extractErrorMessage(String responseBody) {
        try {
            if (responseBody.trim().startsWith("[")) {
                JSONArray outer = JSON.parseArray(responseBody);
                if (outer != null && !outer.isEmpty()) {
                    Object first = outer.get(0);
                    JSONObject obj = null;
                    if (first instanceof JSONArray && !((JSONArray) first).isEmpty()) {
                        obj = ((JSONArray) first).getJSONObject(0);
                    } else if (first instanceof JSONObject) {
                        obj = (JSONObject) first;
                    }
                    if (obj != null) {
                        return extractErrorFromObj(obj);
                    }
                }
            } else {
                return extractErrorFromObj(JSON.parseObject(responseBody));
            }
        } catch (Exception ignored) {
        }
        return responseBody;
    }

    private String extractErrorFromObj(JSONObject obj) {
        JSONObject result = obj.getJSONObject("Result");
        if (result == null) {
            result = obj;
        }
        JSONObject status = result.getJSONObject("ResponseStatus");
        if (status != null) {
            String msg = status.getString("Msg");
            if (msg != null && !msg.isEmpty()) {
                return msg;
            }
            JSONArray errors = status.getJSONArray("Errors");
            if (errors != null && !errors.isEmpty()) {
                return errors.getJSONObject(0).getString("Message");
            }
        }
        return obj.toJSONString();
    }

    private String executePostRequest(String url, String sessionId, String jsonBody) throws IOException {
        RequestBody body = RequestBody.create(jsonBody, JSON_TYPE);

        Request.Builder builder = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("Content-Type", "application/json; charset=utf-8");

        if (sessionId != null && !sessionId.isEmpty()) {
            builder.addHeader(SESSION_HEADER, sessionId);
        }

        try (Response response = client.newCall(builder.build()).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("请求失败，响应码：" + response.code());
            }
            return response.body().string();
        }
    }

    private List<VoucherDetailVO> parseResponse(String responseBody, String orgFieldKey) {
        List<VoucherDetailVO> voucherDetailList = new ArrayList<>();

        if (isErrorResponse(responseBody)) {
            throw new RuntimeException("金蝶接口返回错误：" + extractErrorMessage(responseBody));
        }

        try {
            JSONArray outerArray = JSON.parseArray(responseBody);
            if (outerArray == null || outerArray.isEmpty()) {
                return voucherDetailList;
            }

            Object firstElement = outerArray.get(0);
            if (firstElement instanceof JSONArray) {
                for (int i = 0; i < outerArray.size(); i++) {
                    JSONArray row = outerArray.getJSONArray(i);
                    VoucherDetailVO vo = mapRowToVo(row);
                    if (vo != null) {
                        voucherDetailList.add(vo);
                    }
                }
            } else if (firstElement instanceof JSONObject) {
                JSONObject responseObj = (JSONObject) firstElement;
                JSONObject result = responseObj.getJSONObject("Result");
                if (result != null) {
                    JSONArray resultDataArray = result.getJSONArray("Result");
                    if (resultDataArray != null) {
                        for (int i = 0; i < resultDataArray.size(); i++) {
                            VoucherDetailVO vo = mapRowToVo(resultDataArray.getJSONArray(i));
                            if (vo != null) {
                                voucherDetailList.add(vo);
                            }
                        }
                    }
                }
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("解析金蝶响应失败：" + e.getMessage(), e);
        }

        return voucherDetailList;
    }

    private VoucherDetailVO mapRowToVo(JSONArray row) {
        if (row == null || row.size() < 12) {
            return null;
        }
        VoucherDetailVO vo = new VoucherDetailVO();
        vo.setFdate(row.getString(0));
        vo.setFyear(row.getString(1));
        vo.setFperiod(row.getString(2));
        vo.setFbillTypeID(row.getString(3));
        vo.setFvoucherNo(row.getString(4));
        vo.setFexplanation(row.getString(5));
        vo.setFaccountID(row.getString(6));
        vo.setFaccountName(row.getString(7));
        vo.setFcurrencyID(row.getString(8));
        vo.setFamountFor(toBigDecimal(row.get(9)));
        vo.setFdebit(toBigDecimal(row.get(10)));
        vo.setFcredit(toBigDecimal(row.get(11)));
        if (row.size() >= 13) {
            vo.setFposterID(row.getString(12));
        }
        if (row.size() >= 14) {
            vo.setFauditorID(row.getString(13));
        }
        if (row.size() >= 15) {
            vo.setFaccountBookNumber(row.getString(14));
        }
        return vo;
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) {
            return null;
        }
        if (val instanceof BigDecimal) {
            return (BigDecimal) val;
        }
        return new BigDecimal(val.toString());
    }


    public String findVoucherGroupNumberByName(String kingdeeUrl, String sessionId, String groupName) {
        if (groupName == null || groupName.trim().isEmpty()) {
            return null;
        }
        try {
            JSONObject data = new JSONObject();
            data.put("FormId", "BD_VOUCHERGROUP");
            data.put("FieldKeys", "FNumber,FName");
            data.put("FilterString", "FName = '" + escapeFilterValue(groupName.trim()) + "'");
            data.put("Limit", 1);
            data.put("StartRow", 0);
            data.put("TopRowCount", 0);
            JSONObject requestBody = new JSONObject();
            requestBody.put("data", data);
            String responseBody = executePostRequest(
                    kingdeeUrl + EXECUTE_BILL_QUERY_PATH, sessionId, requestBody.toJSONString());
            if (isErrorResponse(responseBody)) {
                return null;
            }
            JSONArray outerArray = JSON.parseArray(responseBody);
            if (outerArray == null || outerArray.isEmpty()) {
                return null;
            }
            Object firstElement = outerArray.get(0);
            if (firstElement instanceof JSONArray) {
                JSONArray row = (JSONArray) firstElement;
                return row.size() > 0 ? row.getString(0) : null;
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isDataConflictError(String message) {
        if (message == null || message.trim().isEmpty()) {
            return false;
        }
        String normalized = message.trim();
        return normalized.contains("冲突") || normalized.contains("已存在");
    }

    public com.zuantan.dismantling.vo.KingdeeVoucherHeaderVO resolveVoucherHeaderFromLocalOrKingdee(
            com.zuantan.dismantling.vo.KingdeeVoucherHeaderVO localHeader,
            String kingdeeUrl,
            String sessionId,
            String formId,
            String voucherDate,
            String voucherGroupName,
            String orgCompanyCode) {
        if (localHeader != null) {
            String voucherId = localHeader.getVoucherId();
            if (voucherId != null && !voucherId.trim().isEmpty()) {
                return localHeader;
            }
        }
        return findExistingVoucherHeader(kingdeeUrl, sessionId, formId, voucherDate, voucherGroupName, orgCompanyCode);
    }

    public String extractVoucherGroupNoFromConflict(String message) {
        if (message == null || message.trim().isEmpty()) {
            return null;
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("银字(\\d+)号").matcher(message);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    public com.zuantan.dismantling.vo.KingdeeVoucherHeaderVO findVoucherHeaderForRecovery(String kingdeeUrl,
                                                                                           String sessionId,
                                                                                           String formId,
                                                                                           String voucherDate,
                                                                                           String voucherGroupName,
                                                                                           String orgCompanyCode,
                                                                                           String conflictMessage) {
        String voucherGroupNo = extractVoucherGroupNoFromConflict(conflictMessage);
        if (voucherGroupNo != null && !voucherGroupNo.isEmpty()) {
            com.zuantan.dismantling.vo.KingdeeVoucherHeaderVO exact = findExistingVoucherHeader(
                    kingdeeUrl, sessionId, formId, voucherDate, voucherGroupName, orgCompanyCode, voucherGroupNo);
            if (exact != null) {
                return exact;
            }
        }
        return findExistingVoucherHeader(kingdeeUrl, sessionId, formId, voucherDate, voucherGroupName, orgCompanyCode);
    }

    public com.zuantan.dismantling.vo.KingdeeVoucherHeaderVO findExistingVoucherHeader(String kingdeeUrl,
                                                                                        String sessionId,
                                                                                        String formId,
                                                                                        String voucherDate,
                                                                                        String voucherGroupName,
                                                                                        String orgCompanyCode) {
        return findExistingVoucherHeader(kingdeeUrl, sessionId, formId, voucherDate, voucherGroupName, orgCompanyCode, null);
    }

    public com.zuantan.dismantling.vo.KingdeeVoucherHeaderVO findExistingVoucherHeader(String kingdeeUrl,
                                                                                        String sessionId,
                                                                                        String formId,
                                                                                        String voucherDate,
                                                                                        String voucherGroupName,
                                                                                        String orgCompanyCode,
                                                                                        String voucherGroupNo) {
        if (voucherDate == null || voucherDate.isEmpty() || voucherGroupName == null || voucherGroupName.isEmpty()) {
            return null;
        }
        try {
            String orgCode = orgCompanyCode != null && !orgCompanyCode.isEmpty() ? orgCompanyCode : "106";
            String fieldKeys = "FVOUCHERID,FDate,FVOUCHERGROUPID.FName,FVOUCHERGROUPID.FNumber,FVOUCHERGROUPNO";
            StringBuilder filter = new StringBuilder();
            filter.append("FDate >= '").append(voucherDate).append(" 00:00:00'");
            filter.append(" AND FDate < '").append(voucherDate).append(" 23:59:59'");
            filter.append(" AND FVOUCHERGROUPID.FName = '").append(escapeFilterValue(voucherGroupName)).append("'");
            filter.append(" AND ").append(ORG_FIELD_KEY).append(" = '").append(escapeFilterValue(orgCode)).append("'");
            if (voucherGroupNo != null && !voucherGroupNo.isEmpty()) {
                filter.append(" AND FVOUCHERGROUPNO = '").append(escapeFilterValue(voucherGroupNo)).append("'");
            }

            JSONObject data = new JSONObject();
            data.put("FormId", formId);
            data.put("FieldKeys", fieldKeys + "," + ORG_FIELD_KEY);
            data.put("FilterString", filter.toString());
            data.put("Limit", 200);
            data.put("StartRow", 0);
            data.put("TopRowCount", 0);
            JSONObject requestBody = new JSONObject();
            requestBody.put("data", data);
            String responseBody = executePostRequest(
                    kingdeeUrl + EXECUTE_BILL_QUERY_PATH, sessionId, requestBody.toJSONString());
            if (isErrorResponse(responseBody)) {
                return null;
            }
            JSONArray outerArray = JSON.parseArray(responseBody);
            if (outerArray == null || outerArray.isEmpty()) {
                return null;
            }
            com.zuantan.dismantling.vo.KingdeeVoucherHeaderVO header = null;
            int minVoucherNo = Integer.MAX_VALUE;
            int targetVoucherNo = voucherGroupNo != null && !voucherGroupNo.isEmpty()
                    ? parseVoucherGroupNumber(voucherGroupNo) : -1;
            for (int i = 0; i < outerArray.size(); i++) {
                JSONArray row = outerArray.getJSONArray(i);
                if (row == null || row.size() < 5) {
                    continue;
                }
                String voucherId = row.getString(0);
                if (voucherId == null || voucherId.isEmpty()) {
                    continue;
                }
                int voucherNo = parseVoucherGroupNumber(row.getString(4));
                if (targetVoucherNo > 0) {
                    if (voucherNo != targetVoucherNo) {
                        continue;
                    }
                    header = new com.zuantan.dismantling.vo.KingdeeVoucherHeaderVO();
                    header.setVoucherId(voucherId);
                    header.setVoucherGroupName(row.getString(2));
                    header.setVoucherGroupNumber(row.getString(3));
                    header.setVoucherNumber(row.getString(4));
                    return header;
                }
                if (header == null || voucherNo < minVoucherNo) {
                    minVoucherNo = voucherNo;
                    header = new com.zuantan.dismantling.vo.KingdeeVoucherHeaderVO();
                    header.setVoucherId(voucherId);
                    header.setVoucherGroupName(row.getString(2));
                    header.setVoucherGroupNumber(row.getString(3));
                    header.setVoucherNumber(row.getString(4));
                }
            }
            return header;
        } catch (Exception e) {
            return null;
        }
    }


    public String findEmployeeNumberByName(String kingdeeUrl, String sessionId, String employeeName) {
        JSONObject employee = findEmployeeByName(kingdeeUrl, sessionId, employeeName);
        if (employee == null) {
            return null;
        }
        return resolveEmployeeDimensionNumber(employee);
    }

    public String resolveEmployeeDimensionNumber(JSONObject employee) {
        if (employee == null) {
            return null;
        }
        String staffNumber = employee.getString("FStaffNumber");
        if (staffNumber != null && !staffNumber.trim().isEmpty()) {
            return staffNumber.trim();
        }
        String number = employee.getString("FNumber");
        return number != null ? number.trim() : null;
    }

    public JSONObject findEmployeeByName(String kingdeeUrl, String sessionId, String employeeName) {
        if (employeeName == null || employeeName.trim().isEmpty()) {
            return null;
        }
        String trimmed = employeeName.trim();
        String[] formIds = {"BD_Empinfo", "BD_EMPINFO", "BD_NEWSTAFF"};
        for (String formId : formIds) {
            JSONObject employee = queryEmployeeRow(kingdeeUrl, sessionId, formId, trimmed,
                    "FName = '" + escapeFilterValue(trimmed) + "'");
            if (employee != null) {
                return employee;
            }
            employee = queryEmployeeRow(kingdeeUrl, sessionId, formId, trimmed,
                    "FStaffNumber = '" + escapeFilterValue(trimmed) + "'");
            if (employee != null) {
                return employee;
            }
        }
        return queryEmployeeRow(kingdeeUrl, sessionId, "BD_Empinfo", trimmed,
                "FName like '%" + escapeFilterValue(trimmed) + "%'");
    }

    private JSONObject queryEmployeeRow(String kingdeeUrl, String sessionId, String formId,
                                        String searchName, String filterString) {
        try {
            JSONObject data = new JSONObject();
            data.put("FormId", formId);
            data.put("FieldKeys", "FNumber,FName,FStaffNumber");
            data.put("FilterString", filterString);
            data.put("Limit", 20);
            data.put("StartRow", 0);
            data.put("TopRowCount", 0);
            JSONObject requestBody = new JSONObject();
            requestBody.put("data", data);
            String responseBody = executePostRequest(
                    kingdeeUrl + EXECUTE_BILL_QUERY_PATH, sessionId, requestBody.toJSONString());
            if (isErrorResponse(responseBody)) {
                return null;
            }
            JSONArray outerArray = JSON.parseArray(responseBody);
            if (outerArray == null || outerArray.isEmpty()) {
                return null;
            }
            List<JSONObject> employees = new ArrayList<>();
            for (int i = 0; i < outerArray.size(); i++) {
                Object element = outerArray.get(i);
                if (!(element instanceof JSONArray)) {
                    continue;
                }
                JSONArray row = (JSONArray) element;
                if (row.size() < 2) {
                    continue;
                }
                JSONObject employee = new JSONObject();
                employee.put("FNumber", row.getString(0));
                employee.put("FName", row.size() > 1 ? row.getString(1) : null);
                employee.put("FStaffNumber", row.size() > 2 ? row.getString(2) : null);
                employees.add(employee);
            }
            return pickBestEmployee(employees, searchName);
        } catch (Exception e) {
            return null;
        }
    }

    private JSONObject pickBestEmployee(List<JSONObject> employees, String searchName) {
        if (employees == null || employees.isEmpty()) {
            return null;
        }
        if (employees.size() == 1) {
            return employees.get(0);
        }
        String trimmed = searchName != null ? searchName.trim() : "";
        List<JSONObject> exactNameMatches = new ArrayList<>();
        for (JSONObject employee : employees) {
            String name = employee.getString("FName");
            if (trimmed.equals(safeTrim(name))) {
                exactNameMatches.add(employee);
            }
        }
        if (!exactNameMatches.isEmpty()) {
            return pickBestEmployeeCode(exactNameMatches);
        }
        for (JSONObject employee : employees) {
            String name = employee.getString("FName");
            if (name != null && name.contains(trimmed)) {
                exactNameMatches.add(employee);
            }
        }
        if (!exactNameMatches.isEmpty()) {
            return pickBestEmployeeCode(exactNameMatches);
        }
        return pickBestEmployeeCode(employees);
    }

    private JSONObject pickBestEmployeeCode(List<JSONObject> employees) {
        for (JSONObject employee : employees) {
            String number = employee.getString("FNumber");
            String staffNumber = employee.getString("FStaffNumber");
            if (hasLetterCode(staffNumber) && staffNumber.equals(number)) {
                return employee;
            }
        }
        for (JSONObject employee : employees) {
            String staffNumber = employee.getString("FStaffNumber");
            if (hasLetterCode(staffNumber)) {
                return employee;
            }
        }
        for (JSONObject employee : employees) {
            String number = employee.getString("FNumber");
            if (hasLetterCode(number)) {
                return employee;
            }
        }
        return employees.get(0);
    }

    private boolean hasLetterCode(String code) {
        return code != null && code.matches(".*[A-Za-z].*");
    }

    private String safeTrim(String value) {
        return value != null ? value.trim() : "";
    }

    public String findBankNumberByName(String kingdeeUrl, String sessionId, String bankName) {
        if (bankName == null || bankName.trim().isEmpty()) {
            return null;
        }
        for (String candidate : buildBankNameCandidates(bankName)) {
            String number = findBaseDataNumberByName(kingdeeUrl, sessionId, "BD_BANK", candidate);
            if (number != null && !number.trim().isEmpty()) {
                return number.trim();
            }
        }
        return null;
    }

    private List<String> buildBankNameCandidates(String bankName) {
        LinkedHashSet<String> candidates = new LinkedHashSet<>();
        String trimmed = bankName.trim();
        candidates.add(trimmed);
        int bankIdx = trimmed.indexOf("银行");
        if (bankIdx > 0) {
            candidates.add(trimmed.substring(0, bankIdx + 2));
        }
        String[] suffixes = {"支行", "分行", "营业部", "分理处", "储蓄所"};
        for (String suffix : suffixes) {
            int idx = trimmed.indexOf(suffix);
            if (idx > 2) {
                candidates.add(trimmed.substring(0, idx + suffix.length()));
                candidates.add(trimmed.substring(0, idx));
            }
        }
        String withoutCompany = trimmed
                .replace("股份有限公司", "")
                .replace("有限责任公司", "")
                .trim();
        if (!withoutCompany.isEmpty()) {
            candidates.add(withoutCompany);
        }
        return new ArrayList<>(candidates);
    }

    private String findBaseDataNumberByName(String kingdeeUrl, String sessionId, String formId, String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String trimmed = name.trim();
        String exact = queryBaseDataNumberBestMatch(kingdeeUrl, sessionId, formId,
                "FName = '" + escapeFilterValue(trimmed) + "'", trimmed);
        if (exact != null) {
            return exact;
        }
        return queryBaseDataNumberBestMatch(kingdeeUrl, sessionId, formId,
                "FName like '%" + escapeFilterValue(trimmed) + "%'", trimmed);
    }

    private String queryBaseDataNumberBestMatch(String kingdeeUrl, String sessionId, String formId,
                                                String filterString, String searchName) {
        try {
            JSONObject data = new JSONObject();
            data.put("FormId", formId);
            data.put("FieldKeys", "FNumber,FName");
            data.put("FilterString", filterString);
            data.put("Limit", 20);
            data.put("StartRow", 0);
            data.put("TopRowCount", 0);
            JSONObject requestBody = new JSONObject();
            requestBody.put("data", data);
            String responseBody = executePostRequest(
                    kingdeeUrl + EXECUTE_BILL_QUERY_PATH, sessionId, requestBody.toJSONString());
            if (isErrorResponse(responseBody)) {
                return null;
            }
            JSONArray outerArray = JSON.parseArray(responseBody);
            if (outerArray == null || outerArray.isEmpty()) {
                return null;
            }
            String trimmed = searchName != null ? searchName.trim() : "";
            String exactMatch = null;
            String containsMatch = null;
            for (int i = 0; i < outerArray.size(); i++) {
                Object element = outerArray.get(i);
                if (!(element instanceof JSONArray)) {
                    continue;
                }
                JSONArray row = (JSONArray) element;
                if (row.isEmpty()) {
                    continue;
                }
                String number = row.getString(0);
                String rowName = row.size() > 1 ? row.getString(1) : null;
                if (number == null) {
                    continue;
                }
                if (trimmed.equals(safeTrim(rowName))) {
                    return number.trim();
                }
                if (exactMatch == null && rowName != null && rowName.contains(trimmed)) {
                    exactMatch = number.trim();
                } else if (containsMatch == null && rowName != null && trimmed.contains(safeTrim(rowName))) {
                    containsMatch = number.trim();
                }
            }
            if (exactMatch != null) {
                return exactMatch;
            }
            if (containsMatch != null) {
                return containsMatch;
            }
            Object firstElement = outerArray.get(0);
            if (firstElement instanceof JSONArray) {
                JSONArray row = (JSONArray) firstElement;
                return row.size() > 0 ? row.getString(0) : null;
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
    private int parseVoucherGroupNumber(String voucherNumber) {
        if (voucherNumber == null || voucherNumber.trim().isEmpty()) {
            return Integer.MAX_VALUE;
        }
        try {
            return Integer.parseInt(voucherNumber.trim());
        } catch (NumberFormatException e) {
            return Integer.MAX_VALUE;
        }
    }

    private String escapeFilterValue(String value) {
        return value == null ? "" : value.replace("'", "''");
    }
    private String truncate(String s, int maxLen) {
        if (s == null) {
            return null;
        }
        return s.length() <= maxLen ? s : s.substring(0, maxLen) + "...";
    }
}
