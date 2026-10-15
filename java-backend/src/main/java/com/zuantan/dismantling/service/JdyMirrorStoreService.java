package com.zuantan.dismantling.service;

import com.alibaba.fastjson.JSON;
import com.zuantan.dismantling.dto.JdySyncResult;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 简道云镜像落库：同步日志、大屏快照。
 */
@Service
public class JdyMirrorStoreService {

    private final JdbcTemplate jdbcTemplate;

    public JdyMirrorStoreService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void logFullSync(JdySyncResult result, LocalDateTime startedAt) {
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
    }

    public void logSingleSync(String entryId, String formName, int upsertedRows, LocalDateTime startedAt, String status, String message) {
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
    }

    public void saveDashboardSnapshot(String snapshotKey, Integer year, Map<String, Object> payload,
                                      long formCount, long dataCount) {
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
    }

    public List<Map<String, Object>> listRecentSyncLogs(int limit) {
        return jdbcTemplate.queryForList(
                "SELECT id, sync_type, entry_id, form_name, form_count, success_forms, failed_forms, upserted_rows, message, status, started_at, finished_at "
                        + "FROM jdy_sync_log ORDER BY id DESC LIMIT ?",
                limit);
    }

    public Map<String, Object> latestSyncSummary() {
        List<Map<String, Object>> rows = listRecentSyncLogs(1);
        if (rows.isEmpty()) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("message", "尚未执行过同步");
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
