package com.zuantan.dismantling.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Order(0)
public class DatabaseMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        addColumnIfMissing("dingtalk_approval_form", "event_id", "VARCHAR(128)");
        addColumnIfMissing("dingtalk_approval_form", "event_type", "VARCHAR(32)");
        addColumnIfMissing("dingtalk_approval_form", "biz_category_id", "VARCHAR(128)");
        addColumnIfMissing("dingtalk_approval_form", "approval_url", "VARCHAR(1024)");
        addColumnIfMissing("dingtalk_approval_form", "submit_time", "TIMESTAMP NULL");
        addColumnIfMissing("dingtalk_approval_form", "finish_time", "TIMESTAMP NULL");
        addColumnIfMissing("dingtalk_approval_form", "raw_event", "LONGTEXT");

        addColumnIfMissing("expense_reimbursement", "process_code", "VARCHAR(128)");
        addColumnIfMissing("expense_reimbursement", "company_name", "VARCHAR(256)");
        addColumnIfMissing("expense_reimbursement", "biz_category_id", "VARCHAR(128)");
        addColumnIfMissing("expense_reimbursement", "approval_url", "VARCHAR(1024)");
        addColumnIfMissing("expense_reimbursement", "submit_time", "TIMESTAMP NULL");
        addColumnIfMissing("expense_reimbursement", "finish_time", "TIMESTAMP NULL");
        addColumnIfMissing("expense_reimbursement_item", "attachment_info", "VARCHAR(1024)");
        addColumnIfMissing("expense_reimbursement_item", "attachment_files", "LONGTEXT");
        addColumnIfMissing("expense_reimbursement_item", "kingdee_voucher_id", "VARCHAR(64)");
        addColumnIfMissing("expense_reimbursement_item", "kingdee_voucher_no", "VARCHAR(64)");
        addColumnIfMissing("expense_reimbursement_item", "kingdee_push_error", "VARCHAR(512)");

        createTableIfMissing("fund_usage_application",
                "CREATE TABLE fund_usage_application (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "approval_form_id BIGINT, " +
                        "process_instance_id VARCHAR(128) NOT NULL UNIQUE, " +
                        "process_code VARCHAR(128), " +
                        "business_id VARCHAR(128), " +
                        "title VARCHAR(512), " +
                        "submitter_id VARCHAR(64), " +
                        "submitter_name VARCHAR(128), " +
                        "department VARCHAR(256), " +
                        "originator_dept VARCHAR(256), " +
                        "payment_type VARCHAR(128), " +
                        "payment_reason TEXT, " +
                        "total_amount DECIMAL(18, 2), " +
                        "total_amount_upper VARCHAR(256), " +
                        "attachment_info VARCHAR(1024), " +
                        "biz_category_id VARCHAR(128), " +
                        "approval_url VARCHAR(1024), " +
                        "submit_time TIMESTAMP NULL, " +
                        "finish_time TIMESTAMP NULL, " +
                        "approval_result VARCHAR(32), " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("fund_usage_application_item",
                "CREATE TABLE fund_usage_application_item (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "application_id BIGINT NOT NULL, " +
                        "row_index INT, " +
                        "payment_type VARCHAR(128), " +
                        "payment_reason VARCHAR(512), " +
                        "payment_method VARCHAR(64), " +
                        "amount DECIMAL(18, 2), " +
                        "payee_name VARCHAR(256), " +
                        "payee_account VARCHAR(256), " +
                        "bank_name VARCHAR(256), " +
                        "bank_code VARCHAR(64), " +
                        "raw_row_json TEXT, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "INDEX idx_application_id (application_id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        addColumnIfMissing("fund_usage_application_item", "kingdee_voucher_id", "VARCHAR(64)");
        addColumnIfMissing("fund_usage_application_item", "kingdee_voucher_no", "VARCHAR(64)");
        addColumnIfMissing("fund_usage_application_item", "kingdee_push_error", "VARCHAR(512)");

        createTableIfMissing("kingdee_account_config",
                "CREATE TABLE kingdee_account_config (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "account_name VARCHAR(128) NOT NULL UNIQUE, " +
                        "kingdee_url VARCHAR(512) NOT NULL, " +
                        "db_id VARCHAR(64) NOT NULL, " +
                        "username VARCHAR(128) NOT NULL, " +
                        "password VARCHAR(256) NOT NULL, " +
                        "org_company_code VARCHAR(64), " +
                        "use_org_code VARCHAR(64), " +
                        "default_form_id VARCHAR(128), " +
                        "default_accounting_period VARCHAR(32), " +
                        "is_default TINYINT DEFAULT 0, " +
                        "status INT DEFAULT 1, " +
                        "description TEXT, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        addColumnIfMissing("sys_user", "role", "VARCHAR(32) DEFAULT 'USER'");
        addColumnIfMissing("sys_user", "app_permissions", "VARCHAR(256) DEFAULT ''");
        addColumnIfMissing("sys_user", "dingtalk_userid", "VARCHAR(64)");
        addColumnIfMissing("sys_user", "dingtalk_unionid", "VARCHAR(64)");
        addColumnIfMissing("sys_user", "avatar", "VARCHAR(512)");
        addColumnIfMissing("sys_user", "dept_ids", "VARCHAR(512)");
        addColumnIfMissing("sys_user", "phone", "VARCHAR(20)");
        addColumnIfMissing("sys_user", "wechat_openid", "VARCHAR(64)");

        createTableIfMissing("sys_dept",
                "CREATE TABLE sys_dept (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "dingtalk_dept_id BIGINT NOT NULL, " +
                        "name VARCHAR(128) NOT NULL, " +
                        "parent_id BIGINT, " +
                        "dingtalk_parent_id BIGINT, " +
                        "sort_order INT DEFAULT 0, " +
                        "status INT DEFAULT 1, " +
                        "synced_at TIMESTAMP NULL, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_sys_dept_ding (dingtalk_dept_id), " +
                        "INDEX idx_sys_dept_parent (parent_id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("sys_menu",
                "CREATE TABLE sys_menu (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "parent_id BIGINT DEFAULT 0, " +
                        "name VARCHAR(128) NOT NULL, " +
                        "path VARCHAR(256), " +
                        "icon VARCHAR(64), " +
                        "menu_type VARCHAR(8) DEFAULT 'M', " +
                        "sort_order INT DEFAULT 0, " +
                        "visible INT DEFAULT 1, " +
                        "status INT DEFAULT 1, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "INDEX idx_sys_menu_parent (parent_id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("sys_role",
                "CREATE TABLE sys_role (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "code VARCHAR(64) NOT NULL, " +
                        "name VARCHAR(128) NOT NULL, " +
                        "remark VARCHAR(512), " +
                        "status INT DEFAULT 1, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_sys_role_code (code)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("sys_role_menu",
                "CREATE TABLE sys_role_menu (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "role_id BIGINT NOT NULL, " +
                        "menu_id BIGINT NOT NULL, " +
                        "UNIQUE KEY uk_sys_role_menu (role_id, menu_id), " +
                        "INDEX idx_sys_role_menu_role (role_id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("jdy_form",
                "CREATE TABLE jdy_form (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "app_id VARCHAR(64) NOT NULL, " +
                        "entry_id VARCHAR(64) NOT NULL, " +
                        "form_name VARCHAR(256), " +
                        "status INT DEFAULT 1, " +
                        "data_count INT DEFAULT 0, " +
                        "last_sync_at TIMESTAMP NULL, " +
                        "last_sync_message VARCHAR(512), " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_jdy_form_entry (app_id, entry_id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("jdy_form_data",
                "CREATE TABLE jdy_form_data (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "app_id VARCHAR(64) NOT NULL, " +
                        "entry_id VARCHAR(64) NOT NULL, " +
                        "data_id VARCHAR(64) NOT NULL, " +
                        "form_name VARCHAR(256), " +
                        "creator_name VARCHAR(128), " +
                        "creator_username VARCHAR(128), " +
                        "jdy_create_time VARCHAR(64), " +
                        "jdy_update_time VARCHAR(64), " +
                        "raw_data LONGTEXT, " +
                        "synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_jdy_form_data (app_id, entry_id, data_id), " +
                        "INDEX idx_jdy_form_data_entry (entry_id), " +
                        "INDEX idx_jdy_form_data_synced (synced_at)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        addColumnIfMissing("jdy_form", "widget_schema", "LONGTEXT");
        addColumnIfMissing("jdy_form_data", "submit_date", "DATE NULL");
        addIndexIfMissing("jdy_form_data", "idx_jdy_form_data_submit", "entry_id, submit_date");
        jdbcTemplate.update(
                "UPDATE jdy_form_data SET submit_date = DATE(SUBSTRING(jdy_create_time, 1, 10)) "
                        + "WHERE submit_date IS NULL AND jdy_create_time IS NOT NULL AND LENGTH(jdy_create_time) >= 10");

        // 议价应用独立表（与收车 jdy_form / jdy_form_data 分表）
        createTableIfMissing("jdy_pricing_form",
                "CREATE TABLE jdy_pricing_form (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "app_id VARCHAR(64) NOT NULL, " +
                        "entry_id VARCHAR(64) NOT NULL, " +
                        "form_name VARCHAR(256), " +
                        "status INT DEFAULT 1, " +
                        "data_count INT DEFAULT 0, " +
                        "last_sync_at TIMESTAMP NULL, " +
                        "last_sync_message VARCHAR(512), " +
                        "widget_schema LONGTEXT, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_jdy_pricing_form_entry (app_id, entry_id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        createTableIfMissing("jdy_pricing_form_data",
                "CREATE TABLE jdy_pricing_form_data (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "app_id VARCHAR(64) NOT NULL, " +
                        "entry_id VARCHAR(64) NOT NULL, " +
                        "data_id VARCHAR(64) NOT NULL, " +
                        "form_name VARCHAR(256), " +
                        "creator_name VARCHAR(128), " +
                        "creator_username VARCHAR(128), " +
                        "jdy_create_time VARCHAR(64), " +
                        "jdy_update_time VARCHAR(64), " +
                        "submit_date DATE NULL, " +
                        "raw_data LONGTEXT, " +
                        "synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_jdy_pricing_form_data (app_id, entry_id, data_id), " +
                        "INDEX idx_jdy_pricing_form_data_entry (entry_id), " +
                        "INDEX idx_jdy_pricing_form_data_synced (synced_at), " +
                        "INDEX idx_jdy_pricing_form_data_submit (entry_id, submit_date)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        migratePricingRowsFromSharedTables();

        createTableIfMissing("biz_app",
                "CREATE TABLE biz_app (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "code VARCHAR(64) NOT NULL UNIQUE, " +
                        "name VARCHAR(128) NOT NULL, " +
                        "description VARCHAR(512), " +
                        "status INT DEFAULT 1, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("biz_form",
                "CREATE TABLE biz_form (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "app_id BIGINT NOT NULL, " +
                        "code VARCHAR(64) NOT NULL, " +
                        "name VARCHAR(256) NOT NULL, " +
                        "schema_json LONGTEXT, " +
                        "draft_schema_json LONGTEXT, " +
                        "version INT DEFAULT 1, " +
                        "status INT DEFAULT 1, " +
                        "source_entry_id VARCHAR(64), " +
                        "flow_enabled TINYINT DEFAULT 0, " +
                        "flow_definition_key VARCHAR(128), " +
                        "menu_group VARCHAR(64), " +
                        "sort_order INT DEFAULT 0, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_biz_form_app_code (app_id, code), " +
                        "INDEX idx_biz_form_entry (source_entry_id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("biz_form_version",
                "CREATE TABLE biz_form_version (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "form_id BIGINT NOT NULL, " +
                        "version INT NOT NULL, " +
                        "schema_json LONGTEXT, " +
                        "published_by VARCHAR(64), " +
                        "published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_biz_form_ver (form_id, version)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("biz_form_data",
                "CREATE TABLE biz_form_data (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "form_id BIGINT NOT NULL, " +
                        "data_uuid VARCHAR(64) NOT NULL, " +
                        "data_json LONGTEXT, " +
                        "flow_state VARCHAR(32) DEFAULT 'none', " +
                        "process_instance_id VARCHAR(64), " +
                        "creator_user_id BIGINT, " +
                        "creator_ding_id VARCHAR(64), " +
                        "creator_name VARCHAR(128), " +
                        "dept_ids VARCHAR(512), " +
                        "source_jdy_data_id VARCHAR(64), " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_biz_form_data_uuid (form_id, data_uuid), " +
                        "INDEX idx_biz_form_data_form (form_id), " +
                        "INDEX idx_biz_form_data_creator (creator_user_id), " +
                        "INDEX idx_biz_form_data_flow (flow_state)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("biz_form_acl",
                "CREATE TABLE biz_form_acl (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "form_id BIGINT NOT NULL, " +
                        "principal_type VARCHAR(32) NOT NULL, " +
                        "principal_id VARCHAR(64) NOT NULL, " +
                        "perm VARCHAR(32) NOT NULL, " +
                        "data_scope VARCHAR(32) DEFAULT 'all', " +
                        "field_acl_json LONGTEXT, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "INDEX idx_biz_form_acl_form (form_id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("biz_print_template",
                "CREATE TABLE biz_print_template (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "form_id BIGINT NOT NULL, " +
                        "name VARCHAR(128) NOT NULL, " +
                        "html_template LONGTEXT, " +
                        "status INT DEFAULT 1, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("biz_dashboard",
                "CREATE TABLE biz_dashboard (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "app_id BIGINT, " +
                        "name VARCHAR(128) NOT NULL, " +
                        "config_json LONGTEXT, " +
                        "status INT DEFAULT 1, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("biz_flow_cc",
                "CREATE TABLE biz_flow_cc (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "form_data_id BIGINT NOT NULL, " +
                        "process_instance_id VARCHAR(64), " +
                        "user_id BIGINT, " +
                        "dingtalk_userid VARCHAR(64), " +
                        "read_flag TINYINT DEFAULT 0, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "INDEX idx_biz_flow_cc_user (user_id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("biz_local_store",
                "CREATE TABLE biz_local_store (" +
                        "biz_key VARCHAR(128) PRIMARY KEY, " +
                        "rows_json LONGTEXT, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("jdy_sync_log",
                "CREATE TABLE jdy_sync_log (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "sync_type VARCHAR(32) NOT NULL DEFAULT 'full', " +
                        "entry_id VARCHAR(64), " +
                        "form_name VARCHAR(256), " +
                        "form_count INT DEFAULT 0, " +
                        "success_forms INT DEFAULT 0, " +
                        "failed_forms INT DEFAULT 0, " +
                        "upserted_rows INT DEFAULT 0, " +
                        "message VARCHAR(1024), " +
                        "status VARCHAR(32) DEFAULT 'success', " +
                        "started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "finished_at TIMESTAMP NULL, " +
                        "INDEX idx_jdy_sync_log_started (started_at)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("jdy_dashboard_snapshot",
                "CREATE TABLE jdy_dashboard_snapshot (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "snapshot_key VARCHAR(64) NOT NULL, " +
                        "year INT, " +
                        "payload LONGTEXT NOT NULL, " +
                        "source_form_count INT DEFAULT 0, " +
                        "source_data_count INT DEFAULT 0, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_jdy_dashboard_snapshot (snapshot_key, year)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("sys_dict_type",
                "CREATE TABLE sys_dict_type (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "code VARCHAR(64) NOT NULL, " +
                        "name VARCHAR(128) NOT NULL, " +
                        "entry_id VARCHAR(64), " +
                        "source VARCHAR(32) DEFAULT 'jdy', " +
                        "remark VARCHAR(512), " +
                        "sort_order INT DEFAULT 0, " +
                        "status INT DEFAULT 1, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_sys_dict_type_code (code)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("sys_dict_item",
                "CREATE TABLE sys_dict_item (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "type_code VARCHAR(64) NOT NULL, " +
                        "item_value VARCHAR(256) NOT NULL, " +
                        "item_label VARCHAR(256) NOT NULL, " +
                        "sort_order INT DEFAULT 0, " +
                        "status INT DEFAULT 1, " +
                        "app_id VARCHAR(64), " +
                        "source_app VARCHAR(32), " +
                        "jdy_data_id VARCHAR(64), " +
                        "extra_json LONGTEXT, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_sys_dict_item (type_code, item_value, source_app), " +
                        "INDEX idx_sys_dict_item_type (type_code)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        removeDisplayDashboardMenus();
    }

    /**
     * 移除「展示看板」目录及其子菜单（不影响华成攒碳大屏 / 总部大屏等共用能力）。
     */
    private void removeDisplayDashboardMenus() {
        try {
            Integer menuTable = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_menu'",
                    Integer.class);
            if (menuTable == null || menuTable == 0) {
                return;
            }
            List<Long> ids = new ArrayList<>(jdbcTemplate.query(
                    "SELECT id FROM sys_menu WHERE name = '展示看板' OR path IN (" +
                            "'dashboard', " +
                            "'/dashboard/business-overview', " +
                            "'/dashboard/business-staff', " +
                            "'/dashboard/vehicle-query', " +
                            "'/dashboard/disassembly-dashboard'" +
                            ")",
                    (rs, rowNum) -> rs.getLong("id")));
            if (!ids.isEmpty()) {
                String inClause = ids.stream().map(String::valueOf).collect(Collectors.joining(","));
                List<Long> childIds = jdbcTemplate.query(
                        "SELECT id FROM sys_menu WHERE parent_id IN (" + inClause + ")",
                        (rs, rowNum) -> rs.getLong("id"));
                for (Long childId : childIds) {
                    if (!ids.contains(childId)) {
                        ids.add(childId);
                    }
                }
            }
            if (ids.isEmpty()) {
                return;
            }
            String idList = ids.stream().map(String::valueOf).collect(Collectors.joining(","));
            Integer roleMenuTable = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_role_menu'",
                    Integer.class);
            if (roleMenuTable != null && roleMenuTable > 0) {
                int unbound = jdbcTemplate.update("DELETE FROM sys_role_menu WHERE menu_id IN (" + idList + ")");
                log.info("数据库迁移: 已清理展示看板角色菜单关联 {} 条", unbound);
            }
            int deleted = jdbcTemplate.update("DELETE FROM sys_menu WHERE id IN (" + idList + ")");
            log.info("数据库迁移: 已删除展示看板菜单 {} 条", deleted);
        } catch (Exception e) {
            log.warn("清理展示看板菜单跳过/失败: {}", e.getMessage());
        }
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class, table, column);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
        log.info("数据库迁移: {}.{} 已添加", table, column);
    }

    private void addIndexIfMissing(String table, String indexName, String columns) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.STATISTICS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
                Integer.class, table, indexName);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("ALTER TABLE " + table + " ADD INDEX " + indexName + " (" + columns + ")");
        log.info("数据库迁移: {}.{} 索引已添加", table, indexName);
    }

    private void createTableIfMissing(String table, String ddl) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.TABLES " +
                        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
                Integer.class, table);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute(ddl);
        log.info("数据库迁移: 表 {} 已创建", table);
    }

    /**
     * 将原先混在 jdy_form / jdy_form_data 中的议价应用数据迁入独立表，并从旧表删除。
     */
    private void migratePricingRowsFromSharedTables() {
        final String pricingAppId = "67ff16f5714711e0b87f173b";
        try {
            Integer formLeft = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM jdy_form WHERE app_id = ?", Integer.class, pricingAppId);
            if (formLeft != null && formLeft > 0) {
                jdbcTemplate.update(
                        "INSERT IGNORE INTO jdy_pricing_form "
                                + "(app_id, entry_id, form_name, status, data_count, last_sync_at, last_sync_message, "
                                + "widget_schema, created_at, updated_at) "
                                + "SELECT app_id, entry_id, form_name, status, data_count, last_sync_at, last_sync_message, "
                                + "widget_schema, created_at, updated_at FROM jdy_form WHERE app_id = ?",
                        pricingAppId);
                int deleted = jdbcTemplate.update("DELETE FROM jdy_form WHERE app_id = ?", pricingAppId);
                log.info("数据库迁移: 议价表单元数据已迁入 jdy_pricing_form，并从 jdy_form 删除 {} 条", deleted);
            }

            Integer dataLeft = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM jdy_form_data WHERE app_id = ?", Integer.class, pricingAppId);
            if (dataLeft != null && dataLeft > 0) {
                jdbcTemplate.update(
                        "INSERT IGNORE INTO jdy_pricing_form_data "
                                + "(app_id, entry_id, data_id, form_name, creator_name, creator_username, "
                                + "jdy_create_time, jdy_update_time, submit_date, raw_data, synced_at, updated_at) "
                                + "SELECT app_id, entry_id, data_id, form_name, creator_name, creator_username, "
                                + "jdy_create_time, jdy_update_time, submit_date, raw_data, synced_at, updated_at "
                                + "FROM jdy_form_data WHERE app_id = ?",
                        pricingAppId);
                int deleted = jdbcTemplate.update("DELETE FROM jdy_form_data WHERE app_id = ?", pricingAppId);
                log.info("数据库迁移: 议价镜像数据已迁入 jdy_pricing_form_data，并从 jdy_form_data 删除 {} 条", deleted);
            }
        } catch (Exception e) {
            log.warn("议价分表迁移跳过/失败: {}", e.getMessage());
        }
    }
}
