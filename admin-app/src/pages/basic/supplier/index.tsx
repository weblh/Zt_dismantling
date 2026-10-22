import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { listSuppliers, createSupplier, updateSupplier, removeSuppliers, type SupplierRecord } from '@/utils/supplierStore';
import { useBasicDictHydrate } from '@/hooks/useBasicDictHydrate';
import BasicJdySyncButton from '@/components/BasicJdySyncButton';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

export default function Supplier() {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRecord | null>(null);
  const [form] = Form.useForm();

  const refresh = useBasicDictHydrate('supplier', listSuppliers, setRows, setLoading);

  const dataSource = useMemo(
    () => filterBasicRows(rows, searchValue, selectedFields),
    [rows, searchValue, selectedFields],
  );

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateSupplier(editing.id, values);
      message.success('修改成功');
    } else {
      createSupplier(values);
      message.success('提交成功');
    }
    refresh();
    setModalOpen(false);
    setEditing(null);
  };

  const columns: ColumnsType<SupplierRecord> = [
    { title: '供应商名称', dataIndex: 'supplierName', width: 200 },
    { title: '联系电话', dataIndex: 'contactPhone', width: 150 },
    { title: '提交人', dataIndex: 'submitter', width: 120, render: (t: string) => <span style={{ color: '#1890ff' }}>{t}</span> },
    { title: '提交时间', dataIndex: 'submitTime', width: 170 },
    { title: '更新时间', dataIndex: 'updateTime', width: 170 },
    {
      title: '操作',
      width: 90,
      render: (_: unknown, record: SupplierRecord) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
          setEditing(record);
          form.setFieldsValue(record);
          setModalOpen(true);
        }}>编辑</Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: isMobile ? '10px 12px' : '12px 16px', background: '#fff', marginBottom: 8 }}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
            添加
          </Button>
          <BasicJdySyncButton onSynced={refresh} />
          <Button icon={<DeleteOutlined />} disabled={!selectedRowKeys.length} onClick={() => {
            removeSuppliers(selectedRowKeys.map(Number));
            setSelectedRowKeys([]);
            refresh();
            message.success('删除成功');
          }}>删除</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
        </Space>
        <Space wrap style={{ width: isMobile ? '100%' : undefined }}>
          <BasicFuzzyFilter
            fields={[{ key: 'supplierName', label: '供应商名称' }, { key: 'contactPhone', label: '联系电话' }]}
            keyword={searchValue}
            onKeywordChange={setSearchValue}
            selectedFields={selectedFields}
            onSelectedFieldsChange={setSelectedFields}
            inputWidth={isMobile ? '100%' : 200}
          />
        </Space>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={withMobilePagination(isMobile, { showSizeChanger: true, showTotal: (t) => `共 ${t} 条`, pageSize: 20 })}
          bordered
          scroll={{ x: 900 }}
        />
      </div>
      <Modal
        title={editing ? '编辑供应商' : '供应商基础资料'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={handleSubmit}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="supplierName" label="供应商名称" rules={[{ required: true, message: '请输入供应商名称' }]}>
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
