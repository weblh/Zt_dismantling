import React, { useMemo, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined,
  HistoryOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { listPayees, createPayee, updatePayee, removePayees, type PayeeRecord } from '@/utils/payeeStore';
import { useBasicDictHydrate } from '@/hooks/useBasicDictHydrate';
import BasicJdySyncButton from '@/components/BasicJdySyncButton';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

export default function PayeeInfo() {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<PayeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PayeeRecord | null>(null);
  const [form] = Form.useForm();

  const refresh = useBasicDictHydrate('payee-info', listPayees, setRows, setLoading);

  const dataSource = useMemo(
    () => filterBasicRows(rows, searchValue, fieldFilters),
    [rows, searchValue, fieldFilters],
  );

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: PayeeRecord) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleModalOk = async (saveDraft: boolean) => {
    try {
      const values = await form.validateFields();
      if (editing) {
        updatePayee(editing.id, values);
        message.success(saveDraft ? '草稿已更新' : '修改成功');
      } else {
        createPayee(values);
        message.success(saveDraft ? '草稿保存成功' : '提交成功');
      }
      refresh();
      setModalOpen(false);
      setEditing(null);
    } catch {
      message.error('请填写必要信息');
    }
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    removePayees(selectedRowKeys.map(Number));
    setSelectedRowKeys([]);
    refresh();
    message.success('删除成功');
  };

  const columns: ColumnsType<PayeeRecord> = [
    { title: '收款单位', dataIndex: 'payeeUnit', width: 150 },
    { title: '收款账号', dataIndex: 'payeeAccount', width: 200 },
    { title: '开户行', dataIndex: 'openingBank', width: 200 },
    { title: '银行行号', dataIndex: 'bankCode', width: 120 },
    { title: '提交人', dataIndex: 'submitter', width: 120, render: (text: string) => <a style={{ color: '#1890ff' }}>{text}</a> },
    { title: '提交时间', dataIndex: 'submitTime', width: 180, sorter: true },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 },
    {
      title: '操作',
      width: 90,
      fixed: 'right',
      render: (_: unknown, record: PayeeRecord) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: isMobile ? '10px 12px' : '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
          <BasicJdySyncButton onSynced={refresh} />
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0} onClick={handleDelete}>删除</Button>
          <Button icon={<HistoryOutlined />}>操作记录</Button>
        </Space>
        <Space wrap style={{ width: isMobile ? '100%' : undefined }}>
          <BasicFuzzyFilter
            fields={[
              { key: 'payeeUnit', label: '收款单位' },
              { key: 'payeeAccount', label: '收款账号' },
              { key: 'openingBank', label: '开户行' },
              { key: 'bankCode', label: '银行行号' },
            ]}
            keyword={searchValue}
            onKeywordChange={setSearchValue}
            filters={fieldFilters}
            onFiltersChange={setFieldFilters}
            inputWidth={isMobile ? '100%' : 200}
          />
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={withMobilePagination(isMobile, { showSizeChanger: true, showTotal: (t) => `共 ${t} 条`, pageSize: 20 })}
          bordered
          size="middle"
          scroll={{ x: 1250 }}
        />
      </div>

      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        footer={null}
        width={500}
        destroyOnClose
      >
        <div style={{ padding: '0 24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#333' }}>
            {editing ? '编辑收款人信息' : '收款人信息'}
          </h2>
          <Form form={form} layout="vertical">
            <Form.Item name="payeeUnit" label="收款单位" rules={[{ required: true, message: '请输入收款单位' }]}>
              <Input placeholder="请输入收款单位" />
            </Form.Item>
            <Form.Item name="payeeAccount" label="收款账号" rules={[{ required: true, message: '请输入收款账号' }]}>
              <Input placeholder="请输入收款账号" />
            </Form.Item>
            <Form.Item name="openingBank" label="开户行" rules={[{ required: true, message: '请输入开户行' }]}>
              <Input placeholder="请输入开户行" />
            </Form.Item>
            <Form.Item name="bankCode" label="银行行号">
              <Input placeholder="请输入银行行号" />
            </Form.Item>
            <div style={{ display: 'flex', gap: 16, paddingTop: 24, borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
              <Button type="primary" size="large" onClick={() => handleModalOk(false)} style={{ minWidth: 120 }}>
                {editing ? '保存' : '提交'}
              </Button>
              <Button size="large" onClick={() => handleModalOk(true)} style={{ minWidth: 120 }}>保存草稿</Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
