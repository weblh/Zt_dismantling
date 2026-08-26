import React, { useMemo, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  listStaff,
  createStaff,
  updateStaff,
  removeStaff,
  type StaffRecord,
} from '@/utils/dictStore';
import { useBasicDictHydrate } from '@/hooks/useBasicDictHydrate';

const roleOptions = ['司磅员', '拆解员', '查验员', '生产人员'];

export default function Staff() {
  const [rows, setRows] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRecord | null>(null);
  const [form] = Form.useForm();

  const refresh = useBasicDictHydrate('staff', listStaff, setRows, setLoading);

  const dataSource = useMemo(() => {
    if (!searchValue.trim()) return rows;
    const k = searchValue.trim().toLowerCase();
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(k));
  }, [rows, searchValue]);

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateStaff(editing.id, values);
      message.success('修改成功');
    } else {
      createStaff(values);
      message.success('提交成功');
    }
    refresh();
    setModalOpen(false);
    setEditing(null);
  };

  const columns: ColumnsType<StaffRecord> = [
    { title: '姓名', dataIndex: 'staffName', width: 140 },
    { title: '岗位类型', dataIndex: 'roleType', width: 120 },
    { title: '提交人', dataIndex: 'submitter', width: 120, render: (t: string) => <span style={{ color: '#1890ff' }}>{t}</span> },
    { title: '提交时间', dataIndex: 'submitTime', width: 170 },
    { title: '更新时间', dataIndex: 'updateTime', width: 170 },
    {
      title: '操作',
      width: 90,
      render: (_: unknown, record: StaffRecord) => (
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
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', marginBottom: 8 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
            添加
          </Button>
          <Button icon={<DeleteOutlined />} disabled={!selectedRowKeys.length} onClick={() => {
            removeStaff(selectedRowKeys.map(Number));
            setSelectedRowKeys([]);
            refresh();
            message.success('删除成功');
          }}>删除</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
        </Space>
        <Space>
          <Input placeholder="搜索数据" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} style={{ width: 200 }} allowClear />
          <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }} />
        </Space>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 900 }}
        />
      </div>
      <Modal
        title={editing ? '编辑生产人员' : '添加生产人员'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={handleOk}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="staffName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="roleType" label="岗位类型" initialValue="司磅员" rules={[{ required: true, message: '请选择岗位类型' }]}>
            <Select options={roleOptions.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
