import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, InputNumber, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface ProductNameItem {
  key: string;
  productName: string;
  proportion: number;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: ProductNameItem[] = [
  { key: '1', productName: '其他', proportion: 0.0935, submitter: '范亚飞', submitTime: '2024-09-29 10:23:27', updateTime: '2024-09-29 10:23:27' },
  { key: '2', productName: '橡胶', proportion: 0.0324, submitter: '范亚飞', submitTime: '2024-09-29 10:23:16', updateTime: '2024-09-29 10:23:16' },
  { key: '3', productName: '小件', proportion: 0.0251, submitter: '范亚飞', submitTime: '2024-09-29 10:23:07', updateTime: '2024-09-29 10:23:07' },
  { key: '4', productName: '塑料', proportion: 0.0356, submitter: '范亚飞', submitTime: '2024-09-29 10:22:57', updateTime: '2024-09-29 10:22:57' },
  { key: '5', productName: '铝件', proportion: 0.0204, submitter: '范亚飞', submitTime: '2024-09-29 10:22:46', updateTime: '2024-09-29 10:22:46' },
  { key: '6', productName: '铜线', proportion: 0.0098, submitter: '范亚飞', submitTime: '2024-09-29 10:22:19', updateTime: '2024-09-29 10:22:19' },
  { key: '7', productName: '底盘料', proportion: 0.1699, submitter: '范亚飞', submitTime: '2024-09-29 10:21:54', updateTime: '2024-09-29 10:21:54' },
  { key: '8', productName: '废钢', proportion: 0.1456, submitter: '范亚飞', submitTime: '2024-09-29 10:20:32', updateTime: '2024-09-29 10:21:31' },
  { key: '9', productName: '撕碎料', proportion: 0.4516, submitter: '范亚飞', submitTime: '2024-09-29 10:20:22', updateTime: '2024-09-29 10:21:22' },
];

const columns: ColumnsType<ProductNameItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>产品名称</span>, dataIndex: 'productName', width: 150 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>占比</span>, dataIndex: 'proportion', width: 120, render: (val: number) => val.toFixed(4), align: 'right' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 120, render: (text: string) => <a style={{ color: '#1890ff' }}>{text}</a> },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 180, sorter: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 180 },
];

export default function ProductName() {
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
          scroll={{ x: 750 }}
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
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#333' }}>产品名称</h2>
          <Form form={form} layout="vertical">
            <Form.Item
              name="productName"
              label="产品名称"
              rules={[{ required: true, message: '请输入产品名称' }]}
            >
              <Input placeholder="请输入产品名称" />
            </Form.Item>
            <Form.Item
              name="proportion"
              label="占比"
              rules={[{ required: true, message: '请输入占比' }]}
            >
              <InputNumber
                placeholder="请输入占比"
                min={0}
                max={1}
                step={0.0001}
                precision={4}
                style={{ width: '100%' }}
              />
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
