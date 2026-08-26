package com.zuantan.dismantling.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zuantan.dismantling.entity.BizLocalStore;
import com.zuantan.dismantling.mapper.BizLocalStoreMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class BizLocalService {

    private final BizLocalStoreMapper mapper;
    private final ObjectMapper objectMapper;

    public BizLocalService(BizLocalStoreMapper mapper, ObjectMapper objectMapper) {
        this.mapper = mapper;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> getRows(String bizKey) {
        BizLocalStore store = mapper.selectById(bizKey);
        if (store == null || store.getRowsJson() == null || store.getRowsJson().trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(store.getRowsJson(), new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            throw new RuntimeException("读取业务本地数据失败: " + bizKey, e);
        }
    }

    public void saveRows(String bizKey, List<Map<String, Object>> rows) {
        try {
            String json = objectMapper.writeValueAsString(rows != null ? rows : Collections.emptyList());
            BizLocalStore store = mapper.selectById(bizKey);
            if (store == null) {
                store = new BizLocalStore();
                store.setBizKey(bizKey);
                store.setRowsJson(json);
                store.setUpdatedAt(LocalDateTime.now());
                mapper.insert(store);
            } else {
                store.setRowsJson(json);
                store.setUpdatedAt(LocalDateTime.now());
                mapper.updateById(store);
            }
        } catch (Exception e) {
            throw new RuntimeException("保存业务本地数据失败: " + bizKey, e);
        }
    }
}
