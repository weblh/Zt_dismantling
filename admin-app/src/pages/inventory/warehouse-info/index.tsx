import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Tabs, message } from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  RollbackOutlined,
  SearchOutlined,
  FilterOutlined,
  ColumnHeightOutlined,
  SettingOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface WarehouseItem {
  key: string;
  name: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: WarehouseItem[] = [
  { key: '1', name: '废旧鞋帽', submitter: '范亚飞', submitTime: '2025-03-24 13:56:26', updateTime: '2025-03-24 13:56:26' },
  { key: '2', name: '三元库', submitter: '范亚飞', submitTime: '2025-03-24 13:56:16', updateTime: '2025-03-24 13:56:16' },
  { key: '3', name: '成品库', submitter: '范亚飞', submitTime: '2024-04-07 14:46:04', updateTime: '2025-03-24 11:07:55' },
];

export default function WarehouseInfo() {
  const [formVisible, setFormVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [data, setData] = useState<WarehouseItem[]>(mockData);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('warehouse');

  const columns: ColumnsType<WarehouseItem> = [
    {
      title: '仓库名称',
      dataIndex: 'name',
      width: 150,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      width: 100,
      render: (text: string) => <a style={{ color: '#1890ff' }}>{text}</a>,
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      width: 180,
      sorter: (a, b) => a.submitTime.localeCompare(b.submitTime),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      sorter: (a, b) => a.updateTime.localeCompare(b.updateTime),
    },
  ];

  const filteredData = data.filter((item) => item.name.includes(searchText));

  const handleAdd = () => {
    form.resetFields();
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 16).replace('T', ' ');
      const newItem: WarehouseItem = {
        key: Date.now().toString(),
        name: values.name,
        submitter: '范亚飞',
        submitTime: timeStr,
        updateTime: timeStr,
      };
      setData([newItem, ...data]);
      setFormVisible(false);
      message.success('添加成功');
    } catch {
      // validation failed
    }
  };

  const handleCancel = () => {
    setFormVisible(false);
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的记录');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setData(data.filter((item) => !selectedRowKeys.includes(item.key)));
        setSelectedRowKeys([]);
        message.success('删除成功');
      },
    });
  };

  return (
    <div className="page-container">
      {/* 顶部标签页 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'warehouse', label: '仓库信息' },
          ]}
          style={{ paddingLeft: 16 }}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>

      {/* 工具栏 */}
      <div style={{ background: '#fff', padding: '10px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={4}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
            <Button icon={<ThunderboltOutlined />}>批量操作</Button>
            <Button icon={<HistoryOutlined />}>操作记录</Button>
            <Button icon={<RollbackOutlined />}>数据回收站</Button>
          </Space>
          <Space size={8}>
            <Input
              placeholder="搜索数据"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ width: 200 }}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button icon={<FilterOutlined />}>筛选</Button>
            <Button type="text" icon={<ColumnHeightOutlined />} />
            <Button type="text" icon={<SettingOutlined />} />
            <Button type="text" icon={<MoreOutlined />} />
          </Space>
        </div>
      </div>

      {/* 表格区域 */}
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 4, overflow: 'hidden' }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `共 ${total} 条`,
            }}
            size="middle"
            rowKey="key"
            scroll={{ x: 700 }}
          />
        </div>
      </div>

      {/* 添加表单弹窗 */}
      <Modal
        title="仓库信息"
        open={formVisible}
        onCancel={handleCancel}
        footer={null}
        width={520}
        centered
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="仓库名称"
            name="name"
            rules={[{ required: true, message: '请输入仓库名称' }]}
          >
            <Input placeholder="请输入仓库名称" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              type="primary"
              onClick={handleSubmit}
              style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
            >
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
