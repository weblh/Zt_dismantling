package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zuantan.dismantling.entity.BizFormData;
import com.zuantan.dismantling.entity.BizPrintTemplate;
import com.zuantan.dismantling.mapper.BizFormDataMapper;
import com.zuantan.dismantling.mapper.BizPrintTemplateMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BizPrintService {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{\\s*([\\w.]+)\\s*\\}\\}");

    private final BizPrintTemplateMapper templateMapper;
    private final BizFormDataMapper dataMapper;

    public BizPrintService(BizPrintTemplateMapper templateMapper, BizFormDataMapper dataMapper) {
        this.templateMapper = templateMapper;
        this.dataMapper = dataMapper;
    }

    public List<BizPrintTemplate> listByForm(Long formId) {
        return templateMapper.selectList(new LambdaQueryWrapper<BizPrintTemplate>()
                .eq(BizPrintTemplate::getFormId, formId)
                .eq(BizPrintTemplate::getStatus, 1));
    }

    public BizPrintTemplate save(BizPrintTemplate t) {
        LocalDateTime now = LocalDateTime.now();
        if (t.getId() == null) {
            if (t.getStatus() == null) {
                t.setStatus(1);
            }
            if (!StringUtils.hasText(t.getHtmlTemplate())) {
                t.setHtmlTemplate("<h2>{{_formName}}</h2><pre>{{_json}}</pre>");
            }
            t.setCreatedAt(now);
            t.setUpdatedAt(now);
            templateMapper.insert(t);
        } else {
            t.setUpdatedAt(now);
            templateMapper.updateById(t);
        }
        return t;
    }

    public String render(Long dataId, Long templateId) {
        BizFormData data = dataMapper.selectById(dataId);
        BizPrintTemplate tpl = templateMapper.selectById(templateId);
        if (data == null || tpl == null) {
            throw new RuntimeException("数据或模板不存在");
        }
        JSONObject json = new JSONObject();
        try {
            json = JSON.parseObject(data.getDataJson());
            if (json == null) {
                json = new JSONObject();
            }
        } catch (Exception ignored) {
        }
        json.put("_json", data.getDataJson());
        json.put("_creator", data.getCreatorName());
        json.put("_flowState", data.getFlowState());
        json.put("_id", data.getId());

        String html = tpl.getHtmlTemplate();
        Matcher m = PLACEHOLDER.matcher(html);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String key = m.group(1);
            Object val = resolve(json, key);
            m.appendReplacement(sb, Matcher.quoteReplacement(val == null ? "" : String.valueOf(val)));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private Object resolve(JSONObject json, String key) {
        if (json.containsKey(key)) {
            return json.get(key);
        }
        if (key.contains(".")) {
            String[] parts = key.split("\\.");
            Object cur = json;
            for (String p : parts) {
                if (!(cur instanceof Map)) {
                    return null;
                }
                cur = ((Map<?, ?>) cur).get(p);
            }
            return cur;
        }
        return null;
    }
}
