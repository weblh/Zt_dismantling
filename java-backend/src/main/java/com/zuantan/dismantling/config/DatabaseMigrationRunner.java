package com.zuantan.dismantling.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

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
}
