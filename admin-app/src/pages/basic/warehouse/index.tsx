import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined,
  HistoryOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  listWarehouses,
  createWarehouse,
  updateWarehouse,
  removeWarehouses,
  type WarehouseRecord,
} from '@/utils/dictStore';
import { useBasicDictHydrate } from '@/hooks/useBasicDictHydrate';

export default function Warehouse() {
  const [rows, setRows] = useState<WarehouseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WarehouseRecord | null>(null);
  const [form] = Form.useForm();

  const refresh = useBasicDictHydrate('warehouse', listWarehouses, setRows, setLoading);

  const dataSource = useMemo(() => {
    if (!searchValue.trim()) return rows;
    const k = searchValue.trim().toLowerCase();
    return rows.filter((r) => r.warehouseName.toLowerCase().includes(k));
  }, [rows, searchValue]);

  const columns: ColumnsType<WarehouseRecord> = [
    { title: '仓库名称', dataIndex: 'warehouseName', width: 200 },
    { title: '提交人', dataIndex: 'submitter', width: 120 },
    { title: '提交时间', dataIndex: 'submitTime', width: 160 },
    { title: '更新时间', dataIndex: 'updateTime', width: 160 },
    {
      title: '操作',
      width: 90,
      render: (_: unknown, record: WarehouseRecord) => (
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
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>添加</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<DeleteOutlined />} disabled={!selectedRowKeys.length} onClick={() => {
            removeWarehouses(selectedRowKeys.map(Number));
            setSelectedRowKeys([]);
            refresh();
            message.success('删除成功');
          }}>删除</Button>
          <Button icon={<HistoryOutlined />}>操作记录</Button>
        </Space>
        <Space>
          <Input placeholder="搜索" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} style={{ width: 200 }} allowClear />
          <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
        </Space>
      </div>
      <div style={{ padding: 16 }}>
        <Table rowKey="id" columns={columns} dataSource={dataSource} loading={loading} rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }} bordered />
      </div>
      <Modal
        title={editing ? '编辑仓库' : '添加仓库'}
        open={modalOpen}
        onOk={async () => {
          const values = await form.validateFields();
          if (editing) {
            updateWarehouse(editing.id, values.warehouseName);
            message.success('修改成功');
          } else {
            createWarehouse(values.warehouseName);
            message.success('提交成功');
          }
          refresh();
          setModalOpen(false);
        }}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="warehouseName" label="仓库名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
