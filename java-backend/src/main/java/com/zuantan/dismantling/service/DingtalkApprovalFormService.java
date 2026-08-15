package com.zuantan.dismantling.service;



import com.alibaba.fastjson.JSONArray;

import com.alibaba.fastjson.JSONObject;

import com.zuantan.dismantling.entity.DingtalkApprovalForm;
import com.zuantan.dismantling.entity.DingtalkEvent;
import com.zuantan.dismantling.entity.ExpenseReimbursement;
import com.zuantan.dismantling.entity.ExpenseReimbursementItem;
import com.zuantan.dismantling.entity.FundUsageApplication;
import com.zuantan.dismantling.entity.FundUsageApplicationItem;
import com.zuantan.dismantling.mapper.DingtalkApprovalFormMapper;
import com.zuantan.dismantling.mapper.DingtalkEventMapper;
import com.zuantan.dismantling.mapper.ExpenseReimbursementItemMapper;
import com.zuantan.dismantling.mapper.ExpenseReimbursementMapper;
import com.zuantan.dismantling.mapper.FundUsageApplicationItemMapper;
import com.zuantan.dismantling.mapper.FundUsageApplicationMapper;

import com.zuantan.dismantling.util.DingtalkApprovalDetailNormalizer;

import com.zuantan.dismantling.util.DingtalkApprovalDetailUtil;

import com.zuantan.dismantling.util.DingtalkApprovalEventUtil;

import com.zuantan.dismantling.util.DingtalkApprovalPayloadSanitizer;

import org.slf4j.Logger;

import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;

import org.springframework.util.StringUtils;



import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;



@Service

public class DingtalkApprovalFormService {



    private static final Logger log = LoggerFactory.getLogger(DingtalkApprovalFormService.class);

    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private static final int DETAIL_FETCH_MAX_ATTEMPTS = 3;

    private static final long DETAIL_FETCH_RETRY_DELAY_MS = 2000L;



    private final DingtalkApprovalFormMapper approvalFormMapper;
    private final DingtalkEventMapper eventMapper;
    private final FundUsageApplicationMapper fundUsageApplicationMapper;
    private final FundUsageApplicationItemMapper fundUsageApplicationItemMapper;
    private final ExpenseReimbursementMapper expenseReimbursementMapper;
    private final ExpenseReimbursementItemMapper expenseReimbursementItemMapper;
    private final DingtalkApiService dingtalkApiService;
    private final DingtalkFormConfigService formConfigService;
    private final ExpenseReimbursementService expenseReimbursementService;
    private final FundUsageApplicationService fundUsageApplicationService;

    public DingtalkApprovalFormService(DingtalkApprovalFormMapper approvalFormMapper,
                                       DingtalkEventMapper eventMapper,
                                       FundUsageApplicationMapper fundUsageApplicationMapper,
                                       FundUsageApplicationItemMapper fundUsageApplicationItemMapper,
                                       ExpenseReimbursementMapper expenseReimbursementMapper,
                                       ExpenseReimbursementItemMapper expenseReimbursementItemMapper,
                                       DingtalkApiService dingtalkApiService,
                                       DingtalkFormConfigService formConfigService,
                                       ExpenseReimbursementService expenseReimbursementService,
                                       FundUsageApplicationService fundUsageApplicationService) {
        this.approvalFormMapper = approvalFormMapper;
        this.eventMapper = eventMapper;
        this.fundUsageApplicationMapper = fundUsageApplicationMapper;
        this.fundUsageApplicationItemMapper = fundUsageApplicationItemMapper;
        this.expenseReimbursementMapper = expenseReimbursementMapper;
        this.expenseReimbursementItemMapper = expenseReimbursementItemMapper;
        this.dingtalkApiService = dingtalkApiService;
        this.formConfigService = formConfigService;
        this.expenseReimbursementService = expenseReimbursementService;
        this.fundUsageApplicationService = fundUsageApplicationService;
    }



    public void saveOnApprovalFinish(JSONObject eventJson) {

        if (eventJson == null) {

            return;

        }



        String processInstanceId = DingtalkApprovalEventUtil.extractProcessInstanceId(eventJson);

        if (!StringUtils.hasText(processInstanceId)) {

            log.warn("审批 finish 事件缺少 processInstanceId, 跳过表单入库");

            return;

        }



        persistApproval(processInstanceId, eventJson, false);

    }



    public void refreshApprovalDetail(String processInstanceId) {
        if (!StringUtils.hasText(processInstanceId)) {
            return;
        }

        DingtalkApprovalForm existing = findByProcessInstanceId(processInstanceId);
        JSONObject eventJson = buildRefreshEvent(existing, processInstanceId);
        persistApproval(processInstanceId, eventJson, true);
    }

    public int syncMissedApprovalEvents() {
        return syncRecentMissedApprovalEvents(null);
    }

    /**
     * 以数据库中最近一次钉钉数据写入时间为锚点，补同步前后指定天数内的事件。
     */
    public int syncMissedApprovalEventsAroundLatestWrite(int daysBefore, int daysAfter) {
        LocalDateTime anchor = resolveLatestDingtalkWriteTime();
        LocalDateTime from = anchor.minusDays(daysBefore);
        LocalDateTime to = anchor.plusDays(daysAfter);
        log.debug("补同步时间窗口: anchor={}, from={}, to={}", anchor, from, to);
        return syncMissedApprovalEventsBetween(from, to);
    }

    public int syncRecentMissedApprovalEvents(Integer recentDays) {
        if (recentDays == null || recentDays <= 0) {
            return syncMissedApprovalEventsBetween(null, null);
        }
        LocalDateTime from = LocalDateTime.now().minusDays(recentDays);
        return syncMissedApprovalEventsBetween(from, null);
    }

    private int syncMissedApprovalEventsBetween(LocalDateTime fromInclusive, LocalDateTime toInclusive) {
        Map<String, Set<String>> eventTypesByProcessInstanceId =
                collectAllowedProcessInstanceEventTypes(fromInclusive, toInclusive);
        int refreshed = 0;
        for (Map.Entry<String, Set<String>> entry : eventTypesByProcessInstanceId.entrySet()) {
            String processInstanceId = entry.getKey();
            if (!shouldAttemptMissedEventSync(processInstanceId, entry.getValue())) {
                continue;
            }
            try {
                refreshApprovalDetail(processInstanceId);
                refreshed++;
            } catch (Exception e) {
                log.warn("补同步审批数据失败: processInstanceId={}", processInstanceId, e);
            }
        }
        if (refreshed > 0) {
            log.info("已补同步 {} 条缺失的审批数据", refreshed);
        }
        return refreshed;
    }

    private LocalDateTime resolveLatestDingtalkWriteTime() {
        LocalDateTime latest = null;
        latest = maxTime(latest, latestCreatedAt(approvalFormMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<DingtalkApprovalForm>()
                        .orderByDesc(DingtalkApprovalForm::getCreatedAt)
                        .last("LIMIT 1"))));
        latest = maxTime(latest, latestCreatedAt(fundUsageApplicationMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<FundUsageApplication>()
                        .orderByDesc(FundUsageApplication::getCreatedAt)
                        .last("LIMIT 1"))));
        latest = maxTime(latest, latestCreatedAt(expenseReimbursementMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExpenseReimbursement>()
                        .orderByDesc(ExpenseReimbursement::getCreatedAt)
                        .last("LIMIT 1"))));
        return latest != null ? latest : LocalDateTime.now();
    }

    private LocalDateTime latestCreatedAt(DingtalkApprovalForm form) {
        return form != null ? form.getCreatedAt() : null;
    }

    private LocalDateTime latestCreatedAt(FundUsageApplication application) {
        return application != null ? application.getCreatedAt() : null;
    }

    private LocalDateTime latestCreatedAt(ExpenseReimbursement reimbursement) {
        return reimbursement != null ? reimbursement.getCreatedAt() : null;
    }

    private LocalDateTime maxTime(LocalDateTime left, LocalDateTime right) {
        if (left == null) {
            return right;
        }
        if (right == null) {
            return left;
        }
        return left.isAfter(right) ? left : right;
    }

    private Map<String, Set<String>> collectAllowedProcessInstanceEventTypes(LocalDateTime fromInclusive,
                                                                            LocalDateTime toInclusive) {
        com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<DingtalkEvent> wrapper =
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<DingtalkEvent>()
                        .like(DingtalkEvent::getEventType, "bpms_")
                        .orderByAsc(DingtalkEvent::getCreatedAt);
        if (fromInclusive != null) {
            wrapper.ge(DingtalkEvent::getCreatedAt, fromInclusive);
        }
        if (toInclusive != null) {
            wrapper.le(DingtalkEvent::getCreatedAt, toInclusive);
        }

        Map<String, Set<String>> eventTypesByProcessInstanceId = new LinkedHashMap<>();
        List<DingtalkEvent> events = eventMapper.selectList(wrapper);
        for (DingtalkEvent event : events) {
            if (!StringUtils.hasText(event.getEventData())) {
                continue;
            }
            try {
                JSONObject eventJson = com.alibaba.fastjson.JSON.parseObject(event.getEventData());
                String processCode = DingtalkApprovalEventUtil.extractProcessCode(eventJson);
                if (!formConfigService.isFormAllowed(processCode)) {
                    continue;
                }
                String processInstanceId = DingtalkApprovalEventUtil.extractProcessInstanceId(eventJson);
                if (!StringUtils.hasText(processInstanceId)) {
                    continue;
                }
                String eventType = DingtalkApprovalEventUtil.getString(eventJson, "type", "Type");
                eventTypesByProcessInstanceId
                        .computeIfAbsent(processInstanceId, ignored -> new HashSet<>())
                        .add(eventType);
            } catch (Exception e) {
                log.warn("解析钉钉事件失败: eventId={}", event.getEventId(), e);
            }
        }
        return eventTypesByProcessInstanceId;
    }

    private boolean shouldAttemptMissedEventSync(String processInstanceId, Set<String> eventTypes) {
        if (eventTypes == null || eventTypes.isEmpty()) {
            return false;
        }
        boolean onlyTerminate = eventTypes.size() == 1 && eventTypes.contains("terminate");
        if (onlyTerminate) {
            return false;
        }
        return needsMissedEventSync(processInstanceId);
    }

    private boolean needsMissedEventSync(String processInstanceId) {
        return !isAlreadyWrittenToPlatform(processInstanceId);
    }

    private boolean isAlreadyWrittenToPlatform(String processInstanceId) {
        FundUsageApplication fundApplication = fundUsageApplicationMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<FundUsageApplication>()
                        .eq(FundUsageApplication::getProcessInstanceId, processInstanceId));
        if (fundApplication != null && hasFundUsageItems(fundApplication.getId())) {
            return true;
        }

        ExpenseReimbursement reimbursement = expenseReimbursementMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExpenseReimbursement>()
                        .eq(ExpenseReimbursement::getProcessInstanceId, processInstanceId));
        return reimbursement != null && hasExpenseItems(reimbursement.getId());
    }

    private boolean hasFundUsageItems(Long applicationId) {
        if (applicationId == null) {
            return false;
        }
        Long count = fundUsageApplicationItemMapper.selectCount(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<FundUsageApplicationItem>()
                        .eq(FundUsageApplicationItem::getApplicationId, applicationId));
        return count != null && count > 0;
    }

    private boolean hasExpenseItems(Long reimbursementId) {
        if (reimbursementId == null) {
            return false;
        }
        Long count = expenseReimbursementItemMapper.selectCount(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExpenseReimbursementItem>()
                        .eq(ExpenseReimbursementItem::getReimbursementId, reimbursementId));
        return count != null && count > 0;
    }



    public boolean backfillBusinessIdFromRawDetail(DingtalkApprovalForm form) {

        if (form == null || StringUtils.hasText(form.getBusinessId()) || !StringUtils.hasText(form.getRawDetail())) {

            return false;

        }



        try {

            JSONObject detail = com.alibaba.fastjson.JSON.parseObject(form.getRawDetail());

            String businessId = DingtalkApprovalDetailUtil.extractBusinessId(detail);

            if (StringUtils.hasText(businessId)) {

                form.setBusinessId(businessId);

                return true;

            }

        } catch (Exception e) {

            log.warn("从 rawDetail 回填 businessId 失败: processInstanceId={}", form.getProcessInstanceId(), e);

        }



        return false;

    }



    private void persistApproval(String processInstanceId, JSONObject eventJson, boolean refreshOnly) {

        try {

            JSONObject detail = fetchDetailWithRetry(processInstanceId);

            DingtalkApprovalForm existing = findByProcessInstanceId(processInstanceId);

            DingtalkApprovalForm record = buildRecord(eventJson, detail);

            if (existing != null) {

                record.setId(existing.getId());

                record.setCreatedAt(existing.getCreatedAt());

                if (refreshOnly) {
                    // 补全详情用合成事件，保留并瘦身已有 raw_event，避免覆盖真实事件或再次嵌套膨胀。
                    String cleanedExistingRawEvent = DingtalkApprovalPayloadSanitizer.sanitizeRawEvent(existing.getRawEvent());
                    if (StringUtils.hasText(cleanedExistingRawEvent)) {
                        record.setRawEvent(cleanedExistingRawEvent);
                    }
                }

                approvalFormMapper.updateById(record);

                log.info("审批表单已更新: processInstanceId={}, businessId={}, formFieldCount={}",

                        processInstanceId, record.getBusinessId(), countFormComponents(record));

            } else {

                record.setCreatedAt(LocalDateTime.now());

                approvalFormMapper.insert(record);

                log.info("审批表单已入库: processInstanceId={}, businessId={}, title={}, formFieldCount={}",

                        processInstanceId, record.getBusinessId(), record.getTitle(), countFormComponents(record));

            }



            fundUsageApplicationService.saveFromApprovalForm(record);

            expenseReimbursementService.saveFromApprovalForm(record);

        } catch (Exception e) {

            log.error("审批表单入库失败: processInstanceId={}", processInstanceId, e);

            throw new RuntimeException("审批表单入库失败: " + e.getMessage(), e);

        }

    }



    private JSONObject fetchDetailWithRetry(String processInstanceId) throws IOException, InterruptedException {

        IOException lastError = null;

        JSONObject lastDetail = null;



        for (int attempt = 1; attempt <= DETAIL_FETCH_MAX_ATTEMPTS; attempt++) {

            try {

                JSONObject detail = dingtalkApiService.getProcessInstanceDetail(processInstanceId);

                lastDetail = detail;

                if (DingtalkApprovalDetailNormalizer.hasFormComponents(detail)) {

                    return detail;

                }

                log.warn("审批详情表单字段为空, 第 {} 次重试: processInstanceId={}", attempt, processInstanceId);

            } catch (IOException e) {

                lastError = e;

                log.warn("获取审批详情失败, 第 {} 次重试: processInstanceId={}", attempt, processInstanceId, e);

            }



            if (attempt < DETAIL_FETCH_MAX_ATTEMPTS) {

                Thread.sleep(DETAIL_FETCH_RETRY_DELAY_MS);

            }

        }



        if (lastDetail != null) {

            return lastDetail;

        }

        if (lastError != null) {

            throw lastError;

        }

        throw new IOException("获取审批实例详情失败: processInstanceId=" + processInstanceId);

    }



    private DingtalkApprovalForm findByProcessInstanceId(String processInstanceId) {

        return approvalFormMapper.selectOne(

                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<DingtalkApprovalForm>()

                        .eq(DingtalkApprovalForm::getProcessInstanceId, processInstanceId));

    }



    private JSONObject buildRefreshEvent(DingtalkApprovalForm existing, String processInstanceId) {

        JSONObject eventJson = new JSONObject();

        eventJson.put("processInstanceId", processInstanceId);

        if (existing == null) {

            return eventJson;

        }

        eventJson.put("processCode", existing.getProcessCode());

        eventJson.put("businessId", existing.getBusinessId());

        eventJson.put("title", existing.getTitle());

        eventJson.put("staffId", existing.getStaffId());

        eventJson.put("result", existing.getApprovalResult());

        eventJson.put("type", existing.getEventType());

        eventJson.put("bizCategoryId", existing.getBizCategoryId());

        eventJson.put("url", existing.getApprovalUrl());

        if (existing.getSubmitTime() != null) {

            eventJson.put("createTime", existing.getSubmitTime()

                    .atZone(ZONE)

                    .toInstant()

                    .toEpochMilli());

        }

        if (existing.getFinishTime() != null) {

            eventJson.put("finishTime", existing.getFinishTime()

                    .atZone(ZONE)

                    .toInstant()

                    .toEpochMilli());

        }

        // 禁止把已有 raw_event 再嵌进 rawEventBackup：每次启动补全都会指数膨胀，
        // 最终触发 MySQL PacketTooBigException（max_allowed_packet）。

        return eventJson;

    }



    private DingtalkApprovalForm buildRecord(JSONObject eventJson, JSONObject detail) {

        DingtalkApprovalForm record = new DingtalkApprovalForm();

        record.setProcessInstanceId(firstNonBlank(

                DingtalkApprovalEventUtil.extractProcessInstanceId(eventJson),

                detail.getString("processInstanceId")));

        record.setProcessCode(firstNonBlank(

                DingtalkApprovalEventUtil.extractProcessCode(eventJson),

                detail.getString("processCode")));

        record.setBusinessId(firstNonBlank(

                DingtalkApprovalEventUtil.getString(eventJson, "businessId", "BusinessId"),

                detail.getString("businessId"),

                DingtalkApprovalDetailUtil.extractBusinessId(detail)));

        record.setTitle(firstNonBlank(

                DingtalkApprovalEventUtil.getString(eventJson, "title", "Title"),

                detail.getString("title")));

        record.setStaffId(firstNonBlank(

                DingtalkApprovalEventUtil.getString(eventJson, "staffId", "StaffId"),

                detail.getString("originatorUserId")));

        record.setApprovalResult(firstNonBlank(

                DingtalkApprovalEventUtil.getString(eventJson, "result", "Result"),

                detail.getString("result")));

        record.setEventId(DingtalkApprovalEventUtil.getString(eventJson, "eventId", "EventId"));

        record.setEventType(DingtalkApprovalEventUtil.getString(eventJson, "type", "Type"));

        record.setBizCategoryId(DingtalkApprovalEventUtil.getString(eventJson, "bizCategoryId", "BizCategoryId"));

        record.setApprovalUrl(DingtalkApprovalEventUtil.getString(eventJson, "url", "Url"));

        record.setSubmitTime(firstNonNullTime(

                ExpenseReimbursementFormParser.parseEventTime(eventJson.getLong("createTime")),

                ExpenseReimbursementFormParser.parseIsoTime(detail.getString("createTime"))));

        record.setFinishTime(firstNonNullTime(

                ExpenseReimbursementFormParser.parseEventTime(eventJson.getLong("finishTime")),

                ExpenseReimbursementFormParser.parseIsoTime(detail.getString("finishTime"))));

        record.setRawEvent(DingtalkApprovalPayloadSanitizer.sanitizeRawEvent(
                eventJson == null ? null : eventJson.toJSONString()));

        JSONObject sanitizedDetail = DingtalkApprovalPayloadSanitizer.sanitizeDetail(detail);
        JSONArray formComponents = sanitizedDetail == null ? null : sanitizedDetail.getJSONArray("formComponentValues");
        if (formComponents != null) {
            record.setFormComponents(formComponents.toJSONString());
        }
        JSONObject rawDetail = DingtalkApprovalPayloadSanitizer.forRawDetailStorage(sanitizedDetail);
        if (rawDetail != null) {
            record.setRawDetail(rawDetail.toJSONString());
        }

        return record;

    }



    private int countFormComponents(DingtalkApprovalForm record) {

        if (!StringUtils.hasText(record.getFormComponents())) {

            return 0;

        }

        try {

            JSONArray components = JSONArray.parseArray(record.getFormComponents());

            return components == null ? 0 : components.size();

        } catch (Exception ignored) {

            return 0;

        }

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



    private LocalDateTime firstNonNullTime(LocalDateTime primary, LocalDateTime fallback) {

        return primary != null ? primary : fallback;

    }

}


