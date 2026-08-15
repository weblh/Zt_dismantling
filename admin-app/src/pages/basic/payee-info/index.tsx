import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface PayeeInfoItem {
  key: string;
  payeeUnit: string;
  payeeAccount: string;
  openingBank: string;
  bankCode: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: PayeeInfoItem[] = [
  { key: '1', payeeUnit: '李晓娟', payeeAccount: '62218817710178477...', openingBank: '中国邮政储蓄银行', bankCode: '', submitter: '赵景景', submitTime: '2026-08-05 10:03:32', updateTime: '2026-08-05 10:03:32' },
  { key: '2', payeeUnit: '陈国平', payeeAccount: '62284112902676608...', openingBank: '农业银行', bankCode: '', submitter: '邢福荣', submitTime: '2026-08-03 09:41:11', updateTime: '2026-08-03 09:41:11' },
  { key: '3', payeeUnit: '张杰', payeeAccount: '62122605100107758...', openingBank: '工商银行临汾开发区...', bankCode: '', submitter: '杨涛', submitTime: '2026-08-02 18:26:28', updateTime: '2026-08-02 18:26:28' },
  { key: '4', payeeUnit: '李鹏', payeeAccount: '62170003500145552...', openingBank: '中国建设银行股份有限公...', bankCode: '', submitter: '杨涛', submitTime: '2026-08-02 18:14:55', updateTime: '2026-08-02 18:14:55' },
  { key: '5', payeeUnit: '齐锐', payeeAccount: '45635181030027011...', openingBank: '中国银行临汾汾尧支行...', bankCode: '', submitter: '赵景景', submitTime: '2026-08-02 17:36:17', updateTime: '2026-08-02 17:36:17' },
  { key: '6', payeeUnit: '刘丽霞', payeeAccount: '62284812983249134...', openingBank: '中国农业银行', bankCode: '', submitter: '赵景景', submitTime: '2026-08-02 17:05:58', updateTime: '2026-08-02 17:06:07' },
  { key: '7', payeeUnit: '李国强', payeeAccount: '62170003500165550...', openingBank: '中国建设银行', bankCode: '', submitter: '郭文杰', submitTime: '2026-08-02 14:46:44', updateTime: '2026-08-02 14:46:44' },
  { key: '8', payeeUnit: '张斌斌*', payeeAccount: '6212 2605 1000 505...', openingBank: '工商银行临汾开发区...', bankCode: '', submitter: '赵景景', submitTime: '2026-08-02 14:18:42', updateTime: '2026-08-02 14:18:42' },
  { key: '9', payeeUnit: '萨卫丽', payeeAccount: '62109818110014305...', openingBank: '中国邮政储蓄银行', bankCode: '', submitter: '郭文杰', submitTime: '2026-08-02 11:48:30', updateTime: '2026-08-02 11:48:30' },
  { key: '10', payeeUnit: '石胜', payeeAccount: '62179917700100999...', openingBank: '中国邮政储蓄银行', bankCode: '', submitter: '赵景景', submitTime: '2026-07-27 17:27:48', updateTime: '2026-07-27 17:27:48' },
  { key: '11', payeeUnit: '董亚林', payeeAccount: '621 723 051 0000 43...', openingBank: '中国工商银行', bankCode: '', submitter: '赵景景', submitTime: '2026-07-27 17:15:01', updateTime: '2026-07-27 17:15:01' },
  { key: '12', payeeUnit: '吉三女', payeeAccount: '62357005010104430...', openingBank: '洪洞洪都村镇银行', bankCode: '', submitter: '赵景景', submitTime: '2026-07-24 12:03:28', updateTime: '2026-07-24 12:03:28' },
  { key: '13', payeeUnit: '杨耀华', payeeAccount: '62122605100104453...', openingBank: '中国工商银行临汾洪...', bankCode: '', submitter: '赵景景', submitTime: '2026-07-22 09:03:34', updateTime: '2026-07-22 09:03:34' },
  { key: '14', payeeUnit: '赵刚', payeeAccount: '6215806121000327...', openingBank: '山西安泽农村商业银...', bankCode: '', submitter: '赵景景', submitTime: '2026-07-19 14:22:43', updateTime: '2026-07-19 14:22:43' },
  { key: '15', payeeUnit: '辛峥嵘', payeeAccount: '622841 1290745809...', openingBank: '中国农业银行', bankCode: '', submitter: '郭文杰', submitTime: '2026-07-19 13:52:29', updateTime: '2026-07-19 13:52:29' },
  { key: '16', payeeUnit: '刘焕丽', payeeAccount: '6217 0003 5001 55...', openingBank: '中国建设银行', bankCode: '', submitter: '郭文杰', submitTime: '2026-07-17 09:54:56', updateTime: '2026-07-17 09:54:56' },
  { key: '17', payeeUnit: '何建东', payeeAccount: '622848 1298 196 7...', openingBank: '中国农业银行 山西...', bankCode: '', submitter: '邢福荣', submitTime: '2026-07-15 16:57:09', updateTime: '2026-07-15 16:57:09' },
  { key: '18', payeeUnit: '靳民', payeeAccount: '62166981000042624...', openingBank: '中国银行', bankCode: '', submitter: '郭文杰', submitTime: '2026-07-14 09:46:35', updateTime: '2026-07-14 09:46:35' },
  { key: '19', payeeUnit: '高江荣', payeeAccount: '62170003500083439...', openingBank: '中国建设银行', bankCode: '', submitter: '郭文杰', submitTime: '2026-07-14 09:32:23', updateTime: '2026-07-14 09:32:23' },
  { key: '20', payeeUnit: '芦彬彬', payeeAccount: '62122605100024370...', openingBank: '开户行工商银行临汾...', bankCode: '', submitter: '王子璇', submitTime: '2026-07-13 11:10:54', updateTime: '2026-07-13 11:10:54' },
];

const columns: ColumnsType<PayeeInfoItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>收款单位</span>, dataIndex: 'payeeUnit', width: 150 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>收款账号</span>, dataIndex: 'payeeAccount', width: 200 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>开户行</span>, dataIndex: 'openingBank', width: 200 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>银行行号</span>, dataIndex: 'bankCode', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 120, render: (text: string) => <a style={{ color: '#1890ff' }}>{text}</a> },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 180, sorter: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 180 },
];

export default function PayeeInfo() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleModalOk = async (saveDraft: boolean) => {
    try {
      const values = await form.validateFields();
      console.log('表单值:', values, saveDraft);
      message.success(saveDraft ? '草稿保存成功' : '提交成功');
      setModalOpen(false);
    } catch {
      message.error('请填写必要信息');
    }
  };

  return (
    <div className="page-container">
      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>删除</Button>
          <Button icon={<HistoryOutlined />}>操作记录</Button>
        </Space>
        <Space>
          <Input
            placeholder="搜索数据"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={mockData}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条`, pageSize: 20 }}
          bordered
          size="middle"
          scroll={{ x: 1150 }}
        />
      </div>

      {/* 添加表单弹窗 */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={500}
        destroyOnClose
      >
        <div style={{ padding: '0 24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#333' }}>收款人信息</h2>
          <Form form={form} layout="vertical">
            <Form.Item
              name="payeeUnit"
              label="收款单位"
              rules={[{ required: true, message: '请输入收款单位' }]}
            >
              <Input placeholder="请输入收款单位" />
            </Form.Item>
            <Form.Item
              name="payeeAccount"
              label="收款账号"
              rules={[{ required: true, message: '请输入收款账号' }]}
            >
              <Input placeholder="请输入收款账号" />
            </Form.Item>
            <Form.Item
              name="openingBank"
              label="开户行"
              rules={[{ required: true, message: '请输入开户行' }]}
            >
              <Input placeholder="请输入开户行" />
            </Form.Item>
            <Form.Item
              name="bankCode"
              label="银行行号"
            >
              <Input placeholder="请输入银行行号" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-start', paddingTop: 24, borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
              <Button type="primary" size="large" onClick={() => handleModalOk(false)} style={{ minWidth: 120 }}>提交</Button>
              <Button size="large" onClick={() => handleModalOk(true)} style={{ minWidth: 120 }}>保存草稿</Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
