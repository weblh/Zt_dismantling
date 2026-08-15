import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, Dropdown, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined,
  EditOutlined, DatabaseOutlined, SettingOutlined,
  SearchOutlined, DownOutlined, MoreOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface SupplierItem {
  key: string;
  supplierName: string;
  contactPhone: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: SupplierItem[] = [
  { key: '1', supplierName: '靳俊峰', contactPhone: '', submitter: '王盼盼', submitTime: '2026-08-05 16:41:00', updateTime: '2026-08-05 16:41:00' },
  { key: '2', supplierName: '崔晓鑫', contactPhone: '', submitter: '王盼盼', submitTime: '2026-08-05 09:06:28', updateTime: '2026-08-05 09:06:28' },
  { key: '3', supplierName: '刘科峰', contactPhone: '', submitter: '王盼盼', submitTime: '2026-08-04 17:31:26', updateTime: '2026-08-04 17:31:26' },
  { key: '4', supplierName: '段建霞', contactPhone: '', submitter: '王盼盼', submitTime: '2026-08-04 09:38:51', updateTime: '2026-08-04 09:38:51' },
  { key: '5', supplierName: '王青生', contactPhone: '', submitter: '王盼盼', submitTime: '2026-08-04 09:37:56', updateTime: '2026-08-04 09:37:56' },
  { key: '6', supplierName: '史晓斌', contactPhone: '', submitter: '王盼盼', submitTime: '2026-08-04 08:39:49', updateTime: '2026-08-04 08:39:49' },
  { key: '7', supplierName: '吴海霞', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-03 17:53:02', updateTime: '2026-08-03 17:53:02' },
  { key: '8', supplierName: '李晓娟', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-03 17:52:01', updateTime: '2026-08-03 17:52:01' },
  { key: '9', supplierName: '辛静嵘', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-03 10:00:09', updateTime: '2026-08-03 10:00:09' },
  { key: '10', supplierName: '乔锐', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 17:27:44', updateTime: '2026-08-02 17:27:44' },
  { key: '11', supplierName: '乔秋玲', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 17:14:10', updateTime: '2026-08-02 17:14:10' },
  { key: '12', supplierName: '山西瑔源投资有限公...', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 14:17:47', updateTime: '2026-08-02 14:17:47' },
  { key: '13', supplierName: '李国强', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 11:41:41', updateTime: '2026-08-02 11:41:41' },
  { key: '14', supplierName: '洪洞县大槐树镇卫生...', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 10:27:22', updateTime: '2026-08-02 10:27:22' },
  { key: '15', supplierName: '洪洞县曲亭镇中心卫...', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 10:26:58', updateTime: '2026-08-02 10:26:58' },
  { key: '16', supplierName: '赵贝贝', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 09:19:03', updateTime: '2026-08-02 09:19:03' },
  { key: '17', supplierName: '陈国平', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 09:17:59', updateTime: '2026-08-02 09:17:59' },
  { key: '18', supplierName: '刘丽霞', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 09:17:18', updateTime: '2026-08-02 09:17:18' },
  { key: '19', supplierName: '张新花', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 09:14:54', updateTime: '2026-08-02 09:14:54' },
  { key: '20', supplierName: '靳玉', contactPhone: '', submitter: '冯瑶瑶', submitTime: '2026-08-02 09:10:00', updateTime: '2026-08-02 09:10:00' },
];

const columns: ColumnsType<SupplierItem> = [
  {
    title: '供应商名称',
    dataIndex: 'supplierName',
    width: 200,
  },
  {
    title: '联系电话',
    dataIndex: 'contactPhone',
    width: 150,
  },
  {
    title: '提交人',
    dataIndex: 'submitter',
    width: 120,
    render: (text: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{text}</span>,
  },
  {
    title: '提交时间',
    dataIndex: 'submitTime',
    width: 170,
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    width: 170,
  },
];

const totalCount = 1290;

export default function Supplier() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async (saveDraft: boolean) => {
    try {
      const values = await form.validateFields();
      console.log('表单值:', values, saveDraft);
      message.success(saveDraft ? '草稿保存成功' : '提交成功');
      setModalOpen(false);
    } catch {
      // validation error
    }
  };

  const viewMenuItems = [
    { key: 'all', label: '添加并查看全部数据' },
    { key: 'mine', label: '仅看我的' },
    { key: 'department', label: '本部门数据' },
  ];

  return (
    <div className="page-container">
      {/* Top toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space size={8}>
          <Dropdown menu={{ items: viewMenuItems }}>
            <Button style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              添加并查看全部数据 <DownOutlined style={{ fontSize: 10 }} />
            </Button>
          </Dropdown>
          <Button icon={<PlusOutlined />}>新建视图</Button>
          <Button icon={<EditOutlined />}>编辑</Button>
          <Button icon={<DatabaseOutlined />}>数据管理</Button>
        </Space>
        <Space size={8}>
          <AppstoreOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} />
          <SettingOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} />
        </Space>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#fff',
          marginBottom: 8,
        }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ background: '#52c41a', borderColor: '#52c41a' }}
        >
          添加
        </Button>
        <Space size={8}>
          <Input
            placeholder="搜索数据"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          />
          <Button
            icon={<FilterOutlined />}
            style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
          />
          <Button icon={<SettingOutlined />} />
          <Button icon={<MoreOutlined />} />
        </Space>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px 16px' }}>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={mockData}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${totalCount} 条`,
            pageSize: 20,
            current: 1,
          }}
          bordered
          size="middle"
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <span style={{ color: '#999' }}>暂无数据</span>
              </div>
            ),
          }}
          scroll={{ x: 800 }}
        />
      </div>

      {/* Add Modal */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={480}
        destroyOnClose
        centered
        closeIcon={<span style={{ fontSize: 18, color: '#999' }}>×</span>}
        styles={{ body: { padding: '0 24px' } }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '16px 0 24px', color: '#333' }}>
          供应商基础资料
        </h2>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="supplierName"
            label="供应商名称"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item
            name="contactPhone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
        <div style={{ display: 'flex', gap: 16, padding: '24px 0 16px', marginTop: 8 }}>
          <Button
            type="primary"
            size="large"
            onClick={() => handleSubmit(false)}
            style={{
              minWidth: 100,
              background: '#52c41a',
              borderColor: '#52c41a',
            }}
          >
            提交
          </Button>
          <Button
            size="large"
            onClick={() => handleSubmit(true)}
            style={{ minWidth: 100 }}
          >
            保存草稿
          </Button>
        </div>
      </Modal>
    </div>
  );
}