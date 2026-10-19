-- 开发库瘦身：删除已下线的 OA/简道云镜像、低代码附属表、Flowable 表
-- 保留：sys_*、钉钉/金蝶/费用、biz_app/biz_form/biz_form_data、biz_local_store、sys_dict_*

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS biz_form_version;
DROP TABLE IF EXISTS biz_form_acl;
DROP TABLE IF EXISTS biz_print_template;
DROP TABLE IF EXISTS biz_dashboard;
DROP TABLE IF EXISTS biz_flow_cc;

DROP TABLE IF EXISTS jdy_dashboard_snapshot;
DROP TABLE IF EXISTS jdy_sync_log;
DROP TABLE IF EXISTS jdy_pricing_form_data;
DROP TABLE IF EXISTS jdy_pricing_form;
DROP TABLE IF EXISTS jdy_form_data;
DROP TABLE IF EXISTS jdy_form;

-- Flowable（表名大小写因环境而异，全部尝试）
DROP TABLE IF EXISTS act_ru_timer_job;
DROP TABLE IF EXISTS act_ru_suspended_job;
DROP TABLE IF EXISTS act_ru_job;
DROP TABLE IF EXISTS act_ru_deadletter_job;
DROP TABLE IF EXISTS act_ru_external_job;
DROP TABLE IF EXISTS act_ru_history_job;
DROP TABLE IF EXISTS act_ru_identitylink;
DROP TABLE IF EXISTS act_ru_task;
DROP TABLE IF EXISTS act_ru_actinst;
DROP TABLE IF EXISTS act_ru_execution;
DROP TABLE IF EXISTS act_ru_variable;
DROP TABLE IF EXISTS act_ru_entitylink;
DROP TABLE IF EXISTS act_ru_event_subscr;
DROP TABLE IF EXISTS act_hi_identitylink;
DROP TABLE IF EXISTS act_hi_varinst;
DROP TABLE IF EXISTS act_hi_detail;
DROP TABLE IF EXISTS act_hi_actinst;
DROP TABLE IF EXISTS act_hi_entitylink;
DROP TABLE IF EXISTS act_hi_procinst;
DROP TABLE IF EXISTS act_hi_taskinst;
DROP TABLE IF EXISTS act_hi_comment;
DROP TABLE IF EXISTS act_hi_attachment;
DROP TABLE IF EXISTS act_hi_tsk_log;
DROP TABLE IF EXISTS act_ge_bytearray;
DROP TABLE IF EXISTS act_ge_property;
DROP TABLE IF EXISTS act_re_deployment;
DROP TABLE IF EXISTS act_re_procdef;
DROP TABLE IF EXISTS act_re_model;
DROP TABLE IF EXISTS act_procdef_info;
DROP TABLE IF EXISTS act_evt_log;
DROP TABLE IF EXISTS act_id_user;
DROP TABLE IF EXISTS act_id_group;
DROP TABLE IF EXISTS act_id_membership;
DROP TABLE IF EXISTS act_id_info;
DROP TABLE IF EXISTS act_id_bytearray;
DROP TABLE IF EXISTS act_id_token;
DROP TABLE IF EXISTS act_id_priv;
DROP TABLE IF EXISTS act_id_priv_mapping;
DROP TABLE IF EXISTS act_id_property;
DROP TABLE IF EXISTS flw_channel_definition;
DROP TABLE IF EXISTS flw_event_definition;
DROP TABLE IF EXISTS flw_event_deployment;
DROP TABLE IF EXISTS flw_event_resource;
DROP TABLE IF EXISTS flw_ru_batch;
DROP TABLE IF EXISTS flw_ru_batch_part;
DROP TABLE IF EXISTS flw_ev_databasechangelog;
DROP TABLE IF EXISTS flw_ev_databasechangeloglock;

SET FOREIGN_KEY_CHECKS = 1;
