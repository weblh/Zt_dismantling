import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, InputNumber, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined,
  HistoryOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  listProductNames,
  createProductName,
  updateProductName,
  removeProductNames,
  type ProductNameRecord,
} from '@/utils/dictStore';
import { useBasicDictHydrate } from '@/hooks/useBasicDictHydrate';
import BasicJdySyncButton from '@/components/BasicJdySyncButton';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

export default function ProductName() {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<ProductNameRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductNameRecord | null>(null);
  const [form] = Form.useForm();

  const refresh = useBasicDictHydrate('product-name', listProductNames, setRows, setLoading);

  const dataSource = useMemo(
    () => filterBasicRows(rows, searchValue, selectedFields),
    [rows, searchValue, selectedFields],
  );

  const columns: ColumnsType<ProductNameRecord> = [
    { title: '产品名称', dataIndex: 'productName', width: 150 },
    { title: '占比', dataIndex: 'proportion', width: 120, align: 'right', render: (v: number) => Number(v || 0).toFixed(4) },
    { title: '提交人', dataIndex: 'submitter', width: 120, render: (t: string) => <a style={{ color: '#1890ff' }}>{t}</a> },
    { title: '提交时间', dataIndex: 'submitTime', width: 180 },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 },
    {
      title: '操作',
      width: 90,
      render: (_: unknown, record: ProductNameRecord) => (
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: isMobile ? '10px 12px' : '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>添加</Button>
          <BasicJdySyncButton onSynced={refresh} />
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<DeleteOutlined />} disabled={!selectedRowKeys.length} onClick={() => {
            removeProductNames(selectedRowKeys.map(Number));
            setSelectedRowKeys([]);
            refresh();
            message.success('删除成功');
          }}>删除</Button>
          <Button icon={<HistoryOutlined />}>操作记录</Button>
        </Space>
        <Space wrap style={{ width: isMobile ? '100%' : undefined }}>
          <BasicFuzzyFilter
            fields={[{ key: 'productName', label: '产品名称' }, { key: 'proportion', label: '占比' }]}
            keyword={searchValue}
            onKeywordChange={setSearchValue}
            selectedFields={selectedFields}
            onSelectedFieldsChange={setSelectedFields}
            inputWidth={isMobile ? '100%' : 200}
          />
        </Space>
      </div>
      <div style={{ padding: isMobile ? 12 : 16 }}>
        <Table rowKey="id" columns={columns} dataSource={dataSource} loading={loading} rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} pagination={withMobilePagination(isMobile, { pageSize: 20, showTotal: (t) => `共 ${t} 条` })} bordered scroll={{ x: 800 }} />
      </div>
      <Modal
        title={editing ? '编辑产品名称' : '添加产品名称'}
        open={modalOpen}
        onOk={async () => {
          const values = await form.validateFields();
          if (editing) {
            updateProductName(editing.id, values);
            message.success('修改成功');
          } else {
            createProductName(values);
            message.success('提交成功');
          }
          refresh();
          setModalOpen(false);
        }}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="proportion" label="占比">
            <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.0001} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
