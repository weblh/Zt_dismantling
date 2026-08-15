import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined,
  HistoryOutlined, InboxOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface WarehouseItem {
  key: string;
  warehouseName: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: WarehouseItem[] = [];

const columns: ColumnsType<WarehouseItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>仓库名称</span>, dataIndex: 'warehouseName', width: 200 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 160, sorter: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 160 },
];

export default function Warehouse() {
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
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <div style={{ marginTop: 16, color: '#999' }}>暂无数据</div>
              </div>
            ),
          }}
          scroll={{ x: 640 }}
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
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#333' }}>仓库</h2>
          <Form form={form} layout="vertical">
            <Form.Item
              name="warehouseName"
              label="仓库名称"
              rules={[{ required: true, message: '请输入仓库名称' }]}
            >
              <Input placeholder="请输入仓库名称" />
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
