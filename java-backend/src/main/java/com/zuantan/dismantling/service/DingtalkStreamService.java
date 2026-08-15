package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dingtalk.open.app.api.GenericEventListener;
import com.dingtalk.open.app.api.OpenDingTalkClient;
import com.dingtalk.open.app.api.OpenDingTalkStreamClientBuilder;
import com.dingtalk.open.app.api.message.GenericOpenDingTalkEvent;
import com.dingtalk.open.app.api.security.AuthClientCredential;
import com.dingtalk.open.app.stream.protocol.event.EventAckStatus;
import com.zuantan.dismantling.common.PageResult;
import com.zuantan.dismantling.dto.DingtalkConfigRequest;
import com.zuantan.dismantling.dto.DingtalkStatusResponse;
import com.zuantan.dismantling.entity.DingtalkEvent;
import com.zuantan.dismantling.mapper.DingtalkEventMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.zuantan.dismantling.util.DingtalkApprovalEventUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class DingtalkStreamService {

    private static final Logger log = LoggerFactory.getLogger(DingtalkStreamService.class);

    private final DingtalkEventMapper eventMapper;
    private final DingtalkFormConfigService formConfigService;
    private final DingtalkApprovalFormService approvalFormService;
    private final DingtalkApiService dingtalkApiService;

    @Value("${dingtalk.stream.client-id:}")
    private String defaultClientId;

    @Value("${dingtalk.stream.client-secret:}")
    private String defaultClientSecret;

    private volatile String clientId;
    private volatile String clientSecret;
    private volatile OpenDingTalkClient streamClient;
    private final AtomicBoolean connected = new AtomicBoolean(false);

    public DingtalkStreamService(DingtalkEventMapper eventMapper,
                                 DingtalkFormConfigService formConfigService,
                                 DingtalkApprovalFormService approvalFormService,
                                 DingtalkApiService dingtalkApiService) {
        this.eventMapper = eventMapper;
        this.formConfigService = formConfigService;
        this.approvalFormService = approvalFormService;
        this.dingtalkApiService = dingtalkApiService;
    }

    public DingtalkStatusResponse getStatus() {
        DingtalkStatusResponse status = new DingtalkStatusResponse();
        String effectiveClientId = getEffectiveClientId();
        status.setConfigured(StringUtils.hasText(effectiveClientId) && StringUtils.hasText(getEffectiveClientSecret()));
        status.setConnected(connected.get());
        status.setClientId(maskClientId(effectiveClientId));
        status.setMessage(connected.get() ? "Stream 通道已连接" : "Stream 通道未连接");
        return status;
    }

    public synchronized void updateConfig(DingtalkConfigRequest request) {
        this.clientId = request.getClientId();
        this.clientSecret = request.getClientSecret();
        dingtalkApiService.updateCredentials(request.getClientId(), request.getClientSecret());
        if (Boolean.TRUE.equals(request.getAutoStart())) {
            start();
        }
    }

    public synchronized void start() {
        String effectiveClientId = getEffectiveClientId();
        String effectiveClientSecret = getEffectiveClientSecret();
        if (!StringUtils.hasText(effectiveClientId) || !StringUtils.hasText(effectiveClientSecret)) {
            throw new RuntimeException("请先配置钉钉 Client ID 和 Client Secret");
        }

        stopInternal();

        try {
            streamClient = OpenDingTalkStreamClientBuilder.custom()
                    .credential(new AuthClientCredential(effectiveClientId, effectiveClientSecret))
                    .registerAllEventListener(new GenericEventListener() {
                        @Override
                        public EventAckStatus onEvent(GenericOpenDingTalkEvent event) {
                            return handleEvent(event);
                        }
                    })
                    .build();
            streamClient.start();
            connected.set(true);
            log.info("钉钉 Stream 通道已启动, clientId={}", maskClientId(effectiveClientId));
        } catch (Exception e) {
            connected.set(false);
            log.error("钉钉 Stream 通道启动失败", e);
            throw new RuntimeException("Stream 通道启动失败: " + e.getMessage());
        }
    }

    public synchronized void stop() {
        stopInternal();
    }

    public PageResult<java.util.List<DingtalkEvent>> listEvents(int pageNo, int pageSize, String eventType) {
        Page<DingtalkEvent> page = new Page<>(pageNo, pageSize);
        LambdaQueryWrapper<DingtalkEvent> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(eventType)) {
            wrapper.like(DingtalkEvent::getEventType, eventType);
        }
        wrapper.orderByDesc(DingtalkEvent::getCreatedAt);
        Page<DingtalkEvent> result = eventMapper.selectPage(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords());
    }

    public DingtalkEvent getEventDetail(Long id) {
        DingtalkEvent event = eventMapper.selectById(id);
        if (event == null) {
            throw new RuntimeException("事件不存在");
        }
        return event;
    }

    private EventAckStatus handleEvent(GenericOpenDingTalkEvent event) {
        try {
            String eventType = event.getEventType();
            Object data = event.getData();
            JSONObject eventJson = DingtalkApprovalEventUtil.normalizePayload(parseEventData(data));

            if (isApprovalEvent(eventType)) {
                logApprovalEvent(eventType, eventJson);

                String processCode = DingtalkApprovalEventUtil.extractProcessCode(eventJson);
                if (!formConfigService.isFormAllowed(processCode)) {
                    log.info("审批事件被过滤: type={}, processCode={}, 表单未在允许列表中", eventType, processCode);
                    return EventAckStatus.SUCCESS;
                }
                log.info("审批事件已允许: type={}, processCode={}", eventType, processCode);

                if (DingtalkApprovalEventUtil.isFinishEvent(eventJson)) {
                    approvalFormService.saveOnApprovalFinish(eventJson);
                }
            } else if (isOaFormEvent(eventType)) {
                String formId = extractFormId(eventJson);
                if (!formConfigService.isFormAllowed(formId)) {
                    log.info("OA表单事件被过滤: type={}, formId={}, 表单未在允许列表中", eventType, formId);
                    return EventAckStatus.SUCCESS;
                }
                log.info("OA表单事件已允许: type={}, formId={}", eventType, formId);
            }

            DingtalkEvent record = new DingtalkEvent();
            record.setEventId(event.getEventId());
            record.setEventType(eventType);
            record.setEventBornTime(event.getEventBornTime());
            record.setEventData(eventJson == null ? null : eventJson.toJSONString());
            record.setStatus("SUCCESS");
            record.setCreatedAt(LocalDateTime.now());
            eventMapper.insert(record);
            log.info("收到钉钉事件: type={}, id={}, data={}", eventType, event.getEventId(),
                    eventJson == null ? null : eventJson.toJSONString());
            return EventAckStatus.SUCCESS;
        } catch (Exception e) {
            log.error("处理钉钉事件失败", e);
            return EventAckStatus.LATER;
        }
    }

    private JSONObject parseEventData(Object data) {
        if (data == null) {
            return null;
        }
        try {
            if (data instanceof JSONObject) {
                return (JSONObject) data;
            }
            String jsonStr = data instanceof String ? (String) data : JSON.toJSONString(data);
            return JSON.parseObject(jsonStr);
        } catch (Exception e) {
            log.warn("解析事件数据失败", e);
            return null;
        }
    }

    private void logApprovalEvent(String eventType, JSONObject eventJson) {
        if (eventJson == null) {
            log.info("收到审批事件: type={}, 事件数据为空", eventType);
            return;
        }
        log.info("收到审批事件: type={}", eventType);
        log.info("监听的表单ID(processCode): {}", DingtalkApprovalEventUtil.extractProcessCode(eventJson));
        log.info("事件类型: {}", DingtalkApprovalEventUtil.getString(eventJson, "type", "Type"));
        log.info("审批实例ID: {}", DingtalkApprovalEventUtil.extractProcessInstanceId(eventJson));
        log.info("审批标题: {}", DingtalkApprovalEventUtil.getString(eventJson, "title", "Title"));
        log.info("业务ID: {}", DingtalkApprovalEventUtil.getString(eventJson, "businessId", "BusinessId"));
        log.info("提交人: {}", DingtalkApprovalEventUtil.getString(eventJson, "staffId", "StaffId"));
        log.info("事件数据: {}", eventJson.toJSONString());
    }

    private boolean isApprovalEvent(String eventType) {
        return eventType != null && eventType.startsWith("bpms_");
    }

    private boolean isOaFormEvent(String eventType) {
        return eventType != null && (
            eventType.contains("form") ||
            eventType.contains("oa")
        );
    }

    private String extractFormId(JSONObject json) {
        if (json == null) {
            return null;
        }
        String processCode = DingtalkApprovalEventUtil.extractProcessCode(json);
        if (StringUtils.hasText(processCode)) {
            return processCode;
        }
        if (json.containsKey("formId")) {
            return json.getString("formId");
        }
        if (json.containsKey("bizId")) {
            return json.getString("bizId");
        }
        JSONObject innerData = json.getJSONObject("data");
        if (innerData != null && innerData.containsKey("formId")) {
            return innerData.getString("formId");
        }
        return null;
    }

    private void stopInternal() {
        connected.set(false);
        if (streamClient != null) {
            try {
                streamClient.stop();
            } catch (Exception e) {
                log.warn("停止 Stream 客户端异常", e);
            }
            streamClient = null;
        }
    }

    private String getEffectiveClientId() {
        return StringUtils.hasText(clientId) ? clientId : defaultClientId;
    }

    private String getEffectiveClientSecret() {
        return StringUtils.hasText(clientSecret) ? clientSecret : defaultClientSecret;
    }

    private String maskClientId(String id) {
        if (!StringUtils.hasText(id)) {
            return "";
        }
        if (id.length() <= 8) {
            return id.substring(0, 2) + "****";
        }
        return id.substring(0, 4) + "****" + id.substring(id.length() - 4);
    }
}
