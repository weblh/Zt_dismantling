CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    nickname VARCHAR(64),
    status INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dingtalk_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(128),
    event_type VARCHAR(128),
    event_born_time BIGINT,
    event_data LONGTEXT,
    status VARCHAR(32) DEFAULT 'SUCCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dingtalk_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(128),
    client_secret VARCHAR(256),
    auto_start TINYINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dingtalk_form_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    form_id VARCHAR(128) NOT NULL UNIQUE,
    form_name VARCHAR(256),
    status INT DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dingtalk_approval_form (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    process_instance_id VARCHAR(128) NOT NULL UNIQUE,
    process_code VARCHAR(128),
    business_id VARCHAR(128),
    title VARCHAR(512),
    staff_id VARCHAR(64),
    approval_result VARCHAR(32),
    event_id VARCHAR(128),
    event_type VARCHAR(32),
    biz_category_id VARCHAR(128),
    approval_url VARCHAR(1024),
    submit_time TIMESTAMP NULL,
    finish_time TIMESTAMP NULL,
    form_components LONGTEXT,
    raw_detail LONGTEXT,
    raw_event LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_reimbursement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    approval_form_id BIGINT,
    process_instance_id VARCHAR(128) NOT NULL UNIQUE,
    process_code VARCHAR(128),
    business_id VARCHAR(128),
    title VARCHAR(512),
    submitter_id VARCHAR(64),
    submitter_name VARCHAR(128),
    department VARCHAR(256),
    reason TEXT,
    total_amount DECIMAL(18, 2),
    bank_account VARCHAR(256),
    bank_name VARCHAR(256),
    company_name VARCHAR(256),
    biz_category_id VARCHAR(128),
    approval_url VARCHAR(1024),
    submit_time TIMESTAMP NULL,
    finish_time TIMESTAMP NULL,
    approval_result VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_reimbursement_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reimbursement_id BIGINT NOT NULL,
    row_index INT,
    expense_type VARCHAR(128),
    expense_date DATE,
    amount DECIMAL(18, 2),
    description VARCHAR(512),
    invoice_info VARCHAR(512),
    attachment_info VARCHAR(1024),
    attachment_files LONGTEXT,
    raw_row_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kingdee_voucher_id VARCHAR(64),
    kingdee_voucher_no VARCHAR(64),
    INDEX idx_reimbursement_id (reimbursement_id)
);

CREATE TABLE IF NOT EXISTS fund_usage_application (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    approval_form_id BIGINT,
    process_instance_id VARCHAR(128) NOT NULL UNIQUE,
    process_code VARCHAR(128),
    business_id VARCHAR(128),
    title VARCHAR(512),
    submitter_id VARCHAR(64),
    submitter_name VARCHAR(128),
    department VARCHAR(256),
    originator_dept VARCHAR(256),
    payment_type VARCHAR(128),
    payment_reason TEXT,
    total_amount DECIMAL(18, 2),
    total_amount_upper VARCHAR(256),
    attachment_info VARCHAR(1024),
    biz_category_id VARCHAR(128),
    approval_url VARCHAR(1024),
    submit_time TIMESTAMP NULL,
    finish_time TIMESTAMP NULL,
    approval_result VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fund_usage_application_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    row_index INT,
    payment_type VARCHAR(128),
    payment_reason VARCHAR(512),
    payment_method VARCHAR(64),
    amount DECIMAL(18, 2),
    payee_name VARCHAR(256),
    payee_account VARCHAR(256),
    bank_name VARCHAR(256),
    bank_code VARCHAR(64),
    raw_row_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_application_id (application_id)
);

CREATE TABLE IF NOT EXISTS kingdee_account_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_name VARCHAR(128) NOT NULL UNIQUE,
    kingdee_url VARCHAR(512) NOT NULL,
    db_id VARCHAR(64) NOT NULL,
    username VARCHAR(128) NOT NULL,
    password VARCHAR(256) NOT NULL,
    org_company_code VARCHAR(64),
    use_org_code VARCHAR(64),
    default_form_id VARCHAR(128),
    default_accounting_period VARCHAR(32),
    is_default TINYINT DEFAULT 0,
    status INT DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jdy_form (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    app_id VARCHAR(64) NOT NULL,
    entry_id VARCHAR(64) NOT NULL,
    form_name VARCHAR(256),
    status INT DEFAULT 1,
    data_count INT DEFAULT 0,
    last_sync_at TIMESTAMP NULL,
    last_sync_message VARCHAR(512),
    widget_schema LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_jdy_form_entry (app_id, entry_id)
);

CREATE TABLE IF NOT EXISTS jdy_form_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    app_id VARCHAR(64) NOT NULL,
    entry_id VARCHAR(64) NOT NULL,
    data_id VARCHAR(64) NOT NULL,
    form_name VARCHAR(256),
    creator_name VARCHAR(128),
    creator_username VARCHAR(128),
    jdy_create_time VARCHAR(64),
    jdy_update_time VARCHAR(64),
    raw_data LONGTEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_jdy_form_data (app_id, entry_id, data_id),
    INDEX idx_jdy_form_data_entry (entry_id),
    INDEX idx_jdy_form_data_synced (synced_at)
);

-- 自研平台表（启动时 DatabaseMigrationRunner 也会创建）
CREATE TABLE IF NOT EXISTS biz_app (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(512),
    status INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS biz_form (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    app_id BIGINT NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    schema_json LONGTEXT,
    draft_schema_json LONGTEXT,
    version INT DEFAULT 1,
    status INT DEFAULT 1,
    source_entry_id VARCHAR(64),
    flow_enabled TINYINT DEFAULT 0,
    flow_definition_key VARCHAR(128),
    menu_group VARCHAR(64),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_biz_form_app_code (app_id, code)
);

CREATE TABLE IF NOT EXISTS biz_form_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    form_id BIGINT NOT NULL,
    data_uuid VARCHAR(64) NOT NULL,
    data_json LONGTEXT,
    flow_state VARCHAR(32) DEFAULT 'none',
    process_instance_id VARCHAR(64),
    creator_user_id BIGINT,
    creator_ding_id VARCHAR(64),
    creator_name VARCHAR(128),
    dept_ids VARCHAR(512),
    source_jdy_data_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_biz_form_data_uuid (form_id, data_uuid)
);

CREATE TABLE IF NOT EXISTS biz_local_store (
    biz_key VARCHAR(128) PRIMARY KEY,
    rows_json LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

