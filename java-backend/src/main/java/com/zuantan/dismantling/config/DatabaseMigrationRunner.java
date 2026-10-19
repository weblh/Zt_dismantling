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

        // OA / 简道云镜像表已废弃，启动时统一删除（见 dropRetiredOaJdyArtifacts）

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

        createTableIfMissing("biz_local_store",
                "CREATE TABLE biz_local_store (" +
                        "biz_key VARCHAR(128) PRIMARY KEY, " +
                        "rows_json LONGTEXT, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
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

        createTableIfMissing("bank_statement",
                "CREATE TABLE bank_statement (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "bank_source VARCHAR(32) NOT NULL, " +
                        "trade_time TIMESTAMP NULL, " +
                        "direction VARCHAR(16) NOT NULL, " +
                        "amount DECIMAL(18, 2) NOT NULL, " +
                        "balance DECIMAL(18, 2), " +
                        "counterparty_account VARCHAR(128), " +
                        "counterparty_name VARCHAR(256), " +
                        "purpose VARCHAR(512), " +
                        "summary VARCHAR(512), " +
                        "remark TEXT, " +
                        "receipt_info TEXT, " +
                        "voucher_no VARCHAR(128), " +
                        "counterparty_bank_no VARCHAR(64), " +
                        "counterparty_bank_name VARCHAR(256), " +
                        "serial_no VARCHAR(128), " +
                        "currency VARCHAR(32), " +
                        "fingerprint VARCHAR(256) NOT NULL, " +
                        "voucher_type VARCHAR(32), " +
                        "employee_name VARCHAR(128), " +
                        "payee_override VARCHAR(256), " +
                        "target_bank_name VARCHAR(256), " +
                        "suggested_voucher_type VARCHAR(32), " +
                        "suggested_employee_name VARCHAR(128), " +
                        "kingdee_voucher_id VARCHAR(64), " +
                        "kingdee_voucher_no VARCHAR(64), " +
                        "kingdee_push_error VARCHAR(512), " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_bank_statement_fp (fingerprint), " +
                        "INDEX idx_bank_statement_source_time (bank_source, trade_time), " +
                        "INDEX idx_bank_statement_type (voucher_type), " +
                        "INDEX idx_bank_statement_push (kingdee_voucher_id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("bank_statement_learn_rule",
                "CREATE TABLE bank_statement_learn_rule (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "bank_source VARCHAR(32) NOT NULL, " +
                        "counterparty_name VARCHAR(256) NOT NULL, " +
                        "purpose_keyword VARCHAR(256) NOT NULL DEFAULT '', " +
                        "voucher_type VARCHAR(32) NOT NULL, " +
                        "employee_name VARCHAR(128), " +
                        "target_bank_name VARCHAR(256), " +
                        "hit_count INT DEFAULT 1, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_bank_learn (bank_source, counterparty_name, purpose_keyword)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        addColumnIfMissing("bank_statement", "kingdee_exist_status", "INT DEFAULT 0");
        addColumnIfMissing("bank_statement", "kingdee_exist_voucher_word", "VARCHAR(32)");
        addColumnIfMissing("bank_statement", "kingdee_exist_voucher_no", "VARCHAR(64)");
        addColumnIfMissing("bank_statement", "kingdee_exist_checked_at", "TIMESTAMP NULL");

        createTableIfMissing("website_inquiry",
                "CREATE TABLE website_inquiry (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "contact_name VARCHAR(64) NOT NULL, " +
                        "phone VARCHAR(32) NOT NULL, " +
                        "email VARCHAR(128), " +
                        "company VARCHAR(128), " +
                        "category VARCHAR(32) NOT NULL, " +
                        "content TEXT NOT NULL, " +
                        "status VARCHAR(16) NOT NULL DEFAULT 'NEW', " +
                        "client_ip VARCHAR(64), " +
                        "remark VARCHAR(512), " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "INDEX idx_website_inquiry_status (status), " +
                        "INDEX idx_website_inquiry_created (created_at)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        createTableIfMissing("retail_transfer_voucher",
                "CREATE TABLE retail_transfer_voucher (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "trade_time TIMESTAMP NULL, " +
                        "direction VARCHAR(16) NOT NULL, " +
                        "amount DECIMAL(18, 2) NOT NULL, " +
                        "balance DECIMAL(18, 2), " +
                        "counterparty_account VARCHAR(128), " +
                        "counterparty_name VARCHAR(256), " +
                        "purpose VARCHAR(512), " +
                        "summary VARCHAR(512), " +
                        "remark TEXT, " +
                        "receipt_info TEXT, " +
                        "serial_no VARCHAR(128), " +
                        "fingerprint VARCHAR(256) NOT NULL, " +
                        "retail_flag INT DEFAULT 0, " +
                        "kingdee_voucher_id VARCHAR(64), " +
                        "kingdee_voucher_no VARCHAR(64), " +
                        "kingdee_exist_status INT DEFAULT 0, " +
                        "kingdee_exist_voucher_word VARCHAR(32), " +
                        "kingdee_exist_voucher_no VARCHAR(64), " +
                        "kingdee_exist_checked_at TIMESTAMP NULL, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "UNIQUE KEY uk_retail_transfer_fp (fingerprint), " +
                        "INDEX idx_retail_transfer_time (trade_time), " +
                        "INDEX idx_retail_transfer_flag (retail_flag), " +
                        "INDEX idx_retail_transfer_exist (kingdee_exist_status)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        migrateKingdeeWriteMenusToBankStatement();
        migrateRetailTransferMenu();

        removeDisplayDashboardMenus();
        removeWarehouseMaster();
        removeRetiredOaMenus();
        removeNumberedPrefixMenus();
        dropRetiredOaJdyArtifacts();
        dropRetiredPlatformSatellites();
        dropFlowableTables();
    }

    /**
     * 写入金蝶：费用报销/资金使用申请 → 银行流水。
     */
    private void migrateKingdeeWriteMenusToBankStatement() {
        try {
            Integer menuTable = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_menu'",
                    Integer.class);
            if (menuTable == null || menuTable == 0) {
                return;
            }

            List<Long> oldIds = new ArrayList<>(jdbcTemplate.query(
                    "SELECT id FROM sys_menu WHERE path IN (" +
                            "'/business/expense-reimbursement','/business/fund-usage-application'" +
                            ") OR name IN ('费用报销明细','资金使用申请')",
                    (rs, rowNum) -> rs.getLong("id")));
            if (!oldIds.isEmpty()) {
                String idList = oldIds.stream().map(String::valueOf).collect(Collectors.joining(","));
                Integer roleMenuTable = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM information_schema.TABLES " +
                                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_role_menu'",
                        Integer.class);
                if (roleMenuTable != null && roleMenuTable > 0) {
                    jdbcTemplate.update("DELETE FROM sys_role_menu WHERE menu_id IN (" + idList + ")");
                }
                jdbcTemplate.update("DELETE FROM sys_menu WHERE id IN (" + idList + ")");
                log.info("数据库迁移: 已移除钉钉写入金蝶旧菜单 {} 条", oldIds.size());
            }

            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys_menu WHERE path = '/kingdee/bank-statement'",
                    Integer.class);
            if (exists != null && exists > 0) {
                return;
            }

            Long writeParentId = null;
            try {
                writeParentId = jdbcTemplate.queryForObject(
                        "SELECT id FROM sys_menu WHERE path = 'kingdee-write' OR name = '写入金蝶' ORDER BY id LIMIT 1",
                        Long.class);
            } catch (Exception ignored) {
                // ignore
            }
            if (writeParentId == null) {
                try {
                    Long kingdeeId = jdbcTemplate.queryForObject(
                            "SELECT id FROM sys_menu WHERE path = 'kingdee' OR name = '金蝶' ORDER BY id LIMIT 1",
                            Long.class);
                    if (kingdeeId != null) {
                        jdbcTemplate.update(
                                "INSERT INTO sys_menu (parent_id, name, path, icon, menu_type, sort_order, visible, status) " +
                                        "VALUES (?, '写入金蝶', 'kingdee-write', 'SendOutlined', 'D', 3, 1, 1)",
                                kingdeeId);
                        writeParentId = jdbcTemplate.queryForObject(
                                "SELECT id FROM sys_menu WHERE path = 'kingdee-write' ORDER BY id DESC LIMIT 1",
                                Long.class);
                    }
                } catch (Exception e) {
                    log.warn("创建写入金蝶目录失败: {}", e.getMessage());
                }
            }
            if (writeParentId == null) {
                return;
            }

            jdbcTemplate.update(
                    "INSERT INTO sys_menu (parent_id, name, path, icon, menu_type, sort_order, visible, status) " +
                            "VALUES (?, '银行流水', '/kingdee/bank-statement', 'BankOutlined', 'M', 1, 1, 1)",
                    writeParentId);
            Long menuId = jdbcTemplate.queryForObject(
                    "SELECT id FROM sys_menu WHERE path = '/kingdee/bank-statement' ORDER BY id DESC LIMIT 1",
                    Long.class);
            if (menuId != null) {
                Integer roleTable = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM information_schema.TABLES " +
                                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_role'",
                        Integer.class);
                Integer roleMenuTable = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM information_schema.TABLES " +
                                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_role_menu'",
                        Integer.class);
                if (roleTable != null && roleTable > 0 && roleMenuTable != null && roleMenuTable > 0) {
                    List<Long> roleIds = jdbcTemplate.query(
                            "SELECT id FROM sys_role WHERE code IN ('USER','INSPECTOR','SUPER_ADMIN')",
                            (rs, rowNum) -> rs.getLong("id"));
                    for (Long roleId : roleIds) {
                        Integer bound = jdbcTemplate.queryForObject(
                                "SELECT COUNT(*) FROM sys_role_menu WHERE role_id = ? AND menu_id = ?",
                                Integer.class, roleId, menuId);
                        if (bound == null || bound == 0) {
                            jdbcTemplate.update(
                                    "INSERT INTO sys_role_menu (role_id, menu_id) VALUES (?, ?)",
                                    roleId, menuId);
                        }
                    }
                }
            }
            log.info("数据库迁移: 已添加银行流水菜单");
        } catch (Exception e) {
            log.warn("迁移写入金蝶菜单跳过/失败: {}", e.getMessage());
        }
    }

    /** 写入金蝶下增加「散户转字号」菜单 */
    private void migrateRetailTransferMenu() {
        try {
            Integer menuTable = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_menu'",
                    Integer.class);
            if (menuTable == null || menuTable == 0) {
                return;
            }
            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys_menu WHERE path = '/kingdee/retail-transfer'",
                    Integer.class);
            if (exists != null && exists > 0) {
                return;
            }
            Long writeParentId = null;
            try {
                writeParentId = jdbcTemplate.queryForObject(
                        "SELECT id FROM sys_menu WHERE path = 'kingdee-write' OR name = '写入金蝶' ORDER BY id LIMIT 1",
                        Long.class);
            } catch (Exception ignored) {
                // ignore
            }
            if (writeParentId == null) {
                return;
            }
            jdbcTemplate.update(
                    "INSERT INTO sys_menu (parent_id, name, path, icon, menu_type, sort_order, visible, status) " +
                            "VALUES (?, '散户转字号', '/kingdee/retail-transfer', 'UserOutlined', 'M', 2, 1, 1)",
                    writeParentId);
            Long menuId = jdbcTemplate.queryForObject(
                    "SELECT id FROM sys_menu WHERE path = '/kingdee/retail-transfer' ORDER BY id DESC LIMIT 1",
                    Long.class);
            if (menuId != null) {
                List<Long> roleIds = jdbcTemplate.query(
                        "SELECT id FROM sys_role WHERE code IN ('USER','INSPECTOR','SUPER_ADMIN')",
                        (rs, rowNum) -> rs.getLong("id"));
                for (Long roleId : roleIds) {
                    Integer bound = jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM sys_role_menu WHERE role_id = ? AND menu_id = ?",
                            Integer.class, roleId, menuId);
                    if (bound == null || bound == 0) {
                        jdbcTemplate.update(
                                "INSERT INTO sys_role_menu (role_id, menu_id) VALUES (?, ?)",
                                roleId, menuId);
                    }
                }
            }
            log.info("数据库迁移: 已添加散户转字号菜单");
        } catch (Exception e) {
            log.warn("迁移散户转字号菜单跳过/失败: {}", e.getMessage());
        }
    }

    /**
     * 去掉侧栏名称前的序号（如「1.业务收货」），菜单和页面保留。
     * 若序号菜单曾被误删，则按原路径补回。
     */
    private void removeNumberedPrefixMenus() {
        try {
            Integer menuTable = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_menu'",
                    Integer.class);
            if (menuTable == null || menuTable == 0) {
                return;
            }
            int renamed = jdbcTemplate.update(
                    "UPDATE sys_menu SET name = REGEXP_REPLACE(name, '^[0-9]+\\\\.', '') " +
                            "WHERE name REGEXP '^[0-9]+\\\\.'");
            if (renamed > 0) {
                log.info("数据库迁移: 已去掉菜单序号前缀 {} 条", renamed);
            }
            ensureMenu("business", "业务收货", "/business/receipt", "ShoppingFilled", 1);
            ensureMenu("production", "过磅同步数据", "/kingdee/voucher", "DatabaseOutlined", 1);
            ensureMenu("production", "过磅查验", "/production/weighing-inspection", "UserOutlined", 2);
            ensureMenu("production", "查验照片", "/production/inspection-photo", "HomeOutlined", 3);
        } catch (Exception e) {
            log.warn("去掉菜单序号前缀跳过/失败: {}", e.getMessage());
        }
    }

    private void ensureMenu(String parentPath, String name, String path, String icon, int sort) {
        Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys_menu WHERE path = ?",
                Integer.class, path);
        if (exists != null && exists > 0) {
            return;
        }
        Long parentId = jdbcTemplate.queryForObject(
                "SELECT id FROM sys_menu WHERE path = ? ORDER BY id LIMIT 1",
                Long.class, parentPath);
        if (parentId == null) {
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO sys_menu (parent_id, name, path, icon, menu_type, sort_order, visible, status) " +
                        "VALUES (?, ?, ?, ?, 'M', ?, 1, 1)",
                parentId, name, path, icon, sort);
        Long menuId = jdbcTemplate.queryForObject(
                "SELECT id FROM sys_menu WHERE path = ? ORDER BY id DESC LIMIT 1",
                Long.class, path);
        if (menuId == null) {
            return;
        }
        List<Long> roleIds = jdbcTemplate.query(
                "SELECT id FROM sys_role WHERE code IN ('USER','INSPECTOR')",
                (rs, rowNum) -> rs.getLong("id"));
        for (Long roleId : roleIds) {
            Integer bound = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys_role_menu WHERE role_id = ? AND menu_id = ?",
                    Integer.class, roleId, menuId);
            if (bound == null || bound == 0) {
                jdbcTemplate.update(
                        "INSERT INTO sys_role_menu (role_id, menu_id) VALUES (?, ?)",
                        roleId, menuId);
            }
        }
        log.info("数据库迁移: 已补回菜单 {}", name);
    }

    /**
     * 移除已废弃的 OA / 简道云同步侧栏菜单。
     */
    private void removeRetiredOaMenus() {
        try {
            Integer menuTable = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_menu'",
                    Integer.class);
            if (menuTable == null || menuTable == 0) {
                return;
            }
            List<Long> ids = new ArrayList<>(jdbcTemplate.query(
                    "SELECT id FROM sys_menu WHERE name IN (" +
                            "'简道云同步','我的待办','我发起的','我处理的','抄送我的'" +
                            ") OR path IN (" +
                            "'/jdy/sync','todo','initiated','processed','copied'," +
                            "'/inspection/todo','/inspection/initiated','/inspection/processed','/inspection/copied'" +
                            ")",
                    (rs, rowNum) -> rs.getLong("id")));
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
                log.info("数据库迁移: 已清理 OA/简道云角色菜单关联 {} 条", unbound);
            }
            int deleted = jdbcTemplate.update("DELETE FROM sys_menu WHERE id IN (" + idList + ")");
            log.info("数据库迁移: 已删除 OA/简道云菜单 {} 条", deleted);
        } catch (Exception e) {
            log.warn("清理 OA/简道云菜单跳过/失败: {}", e.getMessage());
        }
    }

    /**
     * 删除 OA 流程抄送表与简道云镜像相关表及数据。
     */
    private void dropRetiredOaJdyArtifacts() {
        String[] tables = {
                "jdy_dashboard_snapshot",
                "jdy_sync_log",
                "jdy_pricing_form_data",
                "jdy_pricing_form",
                "jdy_form_data",
                "jdy_form",
                "biz_flow_cc"
        };
        for (String table : tables) {
            dropTableIfExists(table);
        }
    }

    /** 删除未使用的低代码附属表（版本/ACL/打印/看板）。 */
    private void dropRetiredPlatformSatellites() {
        String[] tables = {
                "biz_form_version",
                "biz_form_acl",
                "biz_print_template",
                "biz_dashboard"
        };
        for (String table : tables) {
            dropTableIfExists(table);
        }
    }

    /** 删除 Flowable 自动建表（已下线流程引擎）。 */
    private void dropFlowableTables() {
        try {
            List<String> tables = jdbcTemplate.query(
                    "SELECT TABLE_NAME FROM information_schema.TABLES "
                            + "WHERE TABLE_SCHEMA = DATABASE() "
                            + "AND (TABLE_NAME LIKE 'act\\_%' OR TABLE_NAME LIKE 'flw\\_%' "
                            + "OR TABLE_NAME LIKE 'ACT\\_%' OR TABLE_NAME LIKE 'FLW\\_%')",
                    (rs, rowNum) -> rs.getString(1));
            for (String table : tables) {
                dropTableIfExists(table);
            }
            if (!tables.isEmpty()) {
                log.info("数据库迁移: 已清理 Flowable 相关表 {} 张", tables.size());
            }
        } catch (Exception e) {
            log.warn("清理 Flowable 表跳过/失败: {}", e.getMessage());
        }
    }

    private void dropTableIfExists(String table) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
                    Integer.class, table);
            if (count == null || count == 0) {
                return;
            }
            jdbcTemplate.execute("DROP TABLE IF EXISTS `" + table + "`");
            log.info("数据库迁移: 已删除废弃表 {}", table);
        } catch (Exception e) {
            log.warn("删除废弃表 {} 跳过/失败: {}", table, e.getMessage());
        }
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

    /** 下线基础资料「仓库」：菜单、字典和本地行一并删除。 */
    private void removeWarehouseMaster() {
        try {
            Integer menuTable = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_menu'",
                    Integer.class);
            if (menuTable != null && menuTable > 0) {
                List<Long> ids = jdbcTemplate.query(
                        "SELECT id FROM sys_menu WHERE path = '/basic/warehouse' OR (name = '仓库' AND path LIKE '%warehouse%')",
                        (rs, rowNum) -> rs.getLong("id"));
                if (!ids.isEmpty()) {
                    String idList = ids.stream().map(String::valueOf).collect(Collectors.joining(","));
                    Integer roleMenuTable = jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM information_schema.TABLES " +
                                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_role_menu'",
                            Integer.class);
                    if (roleMenuTable != null && roleMenuTable > 0) {
                        jdbcTemplate.update("DELETE FROM sys_role_menu WHERE menu_id IN (" + idList + ")");
                    }
                    int deleted = jdbcTemplate.update("DELETE FROM sys_menu WHERE id IN (" + idList + ")");
                    log.info("数据库迁移: 已删除仓库菜单 {} 条", deleted);
                }
            }
            Integer dictItem = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_dict_item'",
                    Integer.class);
            if (dictItem != null && dictItem > 0) {
                int items = jdbcTemplate.update(
                        "DELETE FROM sys_dict_item WHERE type_code = 'warehouse' OR type_code = 'form:66f8b152abee705881eec3a5'");
                log.info("数据库迁移: 已删除仓库字典项 {} 条", items);
            }
            Integer dictType = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_dict_type'",
                    Integer.class);
            if (dictType != null && dictType > 0) {
                jdbcTemplate.update(
                        "DELETE FROM sys_dict_type WHERE code = 'warehouse' OR code = 'form:66f8b152abee705881eec3a5' OR entry_id = '66f8b152abee705881eec3a5'");
            }
            Integer local = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'biz_local_store'",
                    Integer.class);
            if (local != null && local > 0) {
                jdbcTemplate.update("DELETE FROM biz_local_store WHERE biz_key = 'warehouse'");
            }
        } catch (Exception e) {
            log.warn("清理仓库基础资料跳过/失败: {}", e.getMessage());
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
