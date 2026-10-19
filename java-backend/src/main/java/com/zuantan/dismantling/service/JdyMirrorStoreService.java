package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.zuantan.dismantling.dto.JdySyncResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 简道云镜像落库：同步日志、大屏快照（表已废弃时静默跳过）。
 */
@Service
public class JdyMirrorStoreService {

    private static final Logger log = LoggerFactory.getLogger(JdyMirrorStoreService.class);

    private final JdbcTemplate jdbcTemplate;

    public JdyMirrorStoreService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void logFullSync(JdySyncResult result, LocalDateTime startedAt) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO jdy_sync_log (sync_type, form_count, success_forms, failed_forms, upserted_rows, message, status, started_at, finished_at) "
                            + "VALUES ('full', ?, ?, ?, ?, ?, ?, ?, ?)",
                    result.getFormCount(),
                    result.getSuccessForms(),
                    result.getFailedForms(),
                    result.getUpsertedRows(),
                    truncate(result.getMessage(), 1000),
                    result.getFailedForms() > 0 ? "partial" : "success",
                    startedAt,
                    LocalDateTime.now());
        } catch (Exception e) {
            log.debug("简道云同步日志写入跳过: {}", e.getMessage());
        }
    }

    public void logSingleSync(String entryId, String formName, int upsertedRows, LocalDateTime startedAt, String status, String message) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO jdy_sync_log (sync_type, entry_id, form_name, upserted_rows, message, status, started_at, finished_at) "
                            + "VALUES ('single', ?, ?, ?, ?, ?, ?, ?)",
                    entryId,
                    formName,
                    upsertedRows,
                    truncate(message, 1000),
                    status,
                    startedAt,
                    LocalDateTime.now());
        } catch (Exception e) {
            log.debug("简道云单表同步日志写入跳过: {}", e.getMessage());
        }
    }

    public void saveDashboardSnapshot(String snapshotKey, Integer year, Map<String, Object> payload,
                                      long formCount, long dataCount) {
        try {
            String json = JSON.toJSONString(payload);
            jdbcTemplate.update(
                    "INSERT INTO jdy_dashboard_snapshot (snapshot_key, year, payload, source_form_count, source_data_count, created_at, updated_at) "
                            + "VALUES (?, ?, ?, ?, ?, NOW(), NOW()) "
                            + "ON DUPLICATE KEY UPDATE payload = VALUES(payload), source_form_count = VALUES(source_form_count), "
                            + "source_data_count = VALUES(source_data_count), updated_at = NOW()",
                    snapshotKey,
                    year,
                    json,
                    formCount,
                    dataCount);
        } catch (Exception e) {
            log.debug("简道云大屏快照写入跳过: {}", e.getMessage());
        }
    }

    public List<Map<String, Object>> listRecentSyncLogs(int limit) {
        try {
            return jdbcTemplate.queryForList(
                    "SELECT id, sync_type, entry_id, form_name, form_count, success_forms, failed_forms, upserted_rows, message, status, started_at, finished_at "
                            + "FROM jdy_sync_log ORDER BY id DESC LIMIT ?",
                    limit);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public Map<String, Object> latestSyncSummary() {
        List<Map<String, Object>> rows = listRecentSyncLogs(1);
        if (rows.isEmpty()) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("message", "简道云镜像已下线");
            return empty;
        }
        return rows.get(0);
    }

    private String truncate(String text, int max) {
        if (text == null) {
            return null;
        }
        return text.length() <= max ? text : text.substring(0, max);
    }
}
