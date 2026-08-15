package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.zuantan.dismantling.vo.SupplierDetailVO;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class KingdeeSupplierQueryService {

    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");
    private static final String SESSION_HEADER = "kdservice-sessionid";
    private static final String EXECUTE_BILL_QUERY_PATH =
            "Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc";
    private static final String FORM_ID = "BD_Supplier";
    private static final String FIELD_KEYS =
            "FNumber,FName,FShortName,FGroup.FName,FDocumentStatus,FForbidStatus,"
                    + "FCreateDate,FUseOrgId.FName,FDescription,FTaxRegisterCode,FContact,FTel,FAddress";

    private final OkHttpClient client;

    public KingdeeSupplierQueryService() {
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .build();
    }

    public List<SupplierDetailVO> querySuppliers(String kingdeeUrl, String sessionId,
                                                 String supplierNumber, String supplierName,
                                                 String useOrgCode) {
        try {
            JSONObject requestBody = buildQueryRequestBody(supplierNumber, supplierName, useOrgCode);
            String responseBody = executePostRequest(
                    kingdeeUrl + EXECUTE_BILL_QUERY_PATH, sessionId, requestBody.toJSONString());
            return parseResponse(responseBody);
        } catch (IOException e) {
            throw new RuntimeException("网络请求失败：" + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("查询供应商失败：" + e.getMessage(), e);
        }
    }

    public String findSupplierNumberByName(String kingdeeUrl, String sessionId, String supplierName, String useOrgCode) {
        if (supplierName == null || supplierName.trim().isEmpty()) {
            return null;
        }
        String trimmed = supplierName.trim();
        List<SupplierDetailVO> suppliers = querySuppliers(kingdeeUrl, sessionId, null, trimmed, useOrgCode);
        if (suppliers.isEmpty()) {
            return null;
        }
        for (SupplierDetailVO supplier : suppliers) {
            if (trimmed.equals(supplier.getFname())) {
                return supplier.getFnumber();
            }
        }
        for (SupplierDetailVO supplier : suppliers) {
            if (supplier.getFname() != null && supplier.getFname().contains(trimmed)) {
                return supplier.getFnumber();
            }
        }
        for (SupplierDetailVO supplier : suppliers) {
            if (trimmed.contains(supplier.getFname())) {
                return supplier.getFnumber();
            }
        }
        return suppliers.get(0).getFnumber();
    }

    private JSONObject buildQueryRequestBody(String supplierNumber, String supplierName, String useOrgCode) {
        JSONObject requestBody = new JSONObject();
        JSONObject data = new JSONObject();
        data.put("FormId", FORM_ID);
        data.put("FieldKeys", FIELD_KEYS);
        data.put("Limit", 2000);
        data.put("StartRow", 0);
        data.put("TopRowCount", 0);

        StringBuilder filterString = new StringBuilder();
        if (supplierNumber != null && !supplierNumber.isEmpty()) {
            filterString.append("FNumber like '%").append(supplierNumber).append("%'");
        }
        if (supplierName != null && !supplierName.isEmpty()) {
            if (filterString.length() > 0) {
                filterString.append(" AND ");
            }
            filterString.append("FName like '%").append(supplierName).append("%'");
        }
        if (useOrgCode != null && !useOrgCode.isEmpty()) {
            if (filterString.length() > 0) {
                filterString.append(" AND ");
            }
            filterString.append("FUseOrgId.FNumber = '").append(useOrgCode).append("'");
        }
        if (filterString.length() > 0) {
            data.put("FilterString", filterString.toString());
        }

        requestBody.put("data", data);
        return requestBody;
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

    private List<SupplierDetailVO> parseResponse(String responseBody) {
        if (isErrorResponse(responseBody)) {
            throw new RuntimeException("金蝶接口返回错误：" + extractErrorMessage(responseBody));
        }

        List<SupplierDetailVO> result = new ArrayList<>();
        try {
            JSONArray outerArray = JSON.parseArray(responseBody);
            if (outerArray == null || outerArray.isEmpty()) {
                return result;
            }

            Object firstElement = outerArray.get(0);
            if (firstElement instanceof JSONArray) {
                for (int i = 0; i < outerArray.size(); i++) {
                    SupplierDetailVO vo = mapRowToVo(outerArray.getJSONArray(i));
                    if (vo != null) {
                        result.add(vo);
                    }
                }
            } else if (firstElement instanceof JSONObject) {
                JSONObject responseObj = (JSONObject) firstElement;
                JSONObject queryResult = responseObj.getJSONObject("Result");
                if (queryResult != null) {
                    JSONArray resultDataArray = queryResult.getJSONArray("Result");
                    if (resultDataArray != null) {
                        for (int i = 0; i < resultDataArray.size(); i++) {
                            SupplierDetailVO vo = mapRowToVo(resultDataArray.getJSONArray(i));
                            if (vo != null) {
                                result.add(vo);
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
        return result;
    }

    private SupplierDetailVO mapRowToVo(JSONArray row) {
        if (row == null || row.size() < 3) {
            return null;
        }
        SupplierDetailVO vo = new SupplierDetailVO();
        vo.setFnumber(row.getString(0));
        vo.setFname(row.getString(1));
        vo.setFshortName(row.size() > 2 ? row.getString(2) : null);
        vo.setFgroupName(row.size() > 3 ? row.getString(3) : null);
        vo.setFdocumentStatus(row.size() > 4 ? row.getString(4) : null);
        vo.setFforbidStatus(row.size() > 5 ? row.getString(5) : null);
        vo.setFcreateDate(row.size() > 6 ? row.getString(6) : null);
        vo.setFuseOrgName(row.size() > 7 ? row.getString(7) : null);
        vo.setFdescription(row.size() > 8 ? row.getString(8) : null);
        vo.setFtaxRegisterCode(row.size() > 9 ? row.getString(9) : null);
        vo.setFcontact(row.size() > 10 ? row.getString(10) : null);
        vo.setFtel(row.size() > 11 ? row.getString(11) : null);
        vo.setFaddress(row.size() > 12 ? row.getString(12) : null);
        return vo;
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
}
