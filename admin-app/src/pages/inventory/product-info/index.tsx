import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, message } from 'antd';
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
  AppstoreOutlined,
  ReloadOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface ProductInfoItem {
  key: string;
  productType: string;
  detail: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const productTypeOptions = [
  '小件',
  '底盘料',
  '撕碎料',
  '橡胶',
  '废钢',
  '有色金属',
  '其他1',
  '其他2',
  '其他3',
  '其他4',
  '其他5',
  '其他6',
];

const mockData: ProductInfoItem[] = [
  { key: '1', productType: '其他6', detail: '其他6', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:20:21' },
  { key: '2', productType: '其他5', detail: '其他5', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:28:22' },
  { key: '3', productType: '其他4', detail: '其他4', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:28:45' },
  { key: '4', productType: '其他3', detail: '垃圾', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:20:21' },
  { key: '5', productType: '其他2', detail: '其他2', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:28:52' },
  { key: '6', productType: '其他1', detail: '其他1', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:28:57' },
  { key: '7', productType: '橡胶', detail: '切割轮胎', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:20:21' },
  { key: '8', productType: '橡胶', detail: '胶条', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:20:21' },
  { key: '9', productType: '橡胶', detail: '废轮胎', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:20:21' },
  { key: '10', productType: '小件', detail: '行车记录仪', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:20:21' },
  { key: '11', productType: '小件', detail: '倒车镜', submitter: '范亚飞', submitTime: '2025-03-24 11:20:21', updateTime: '2025-03-24 11:20:21' },
  { key: '12', productType: '小件', detail: '安全带', submitter: '范亚飞', submitTime: '2025-03-24 11:20:19', updateTime: '2025-03-24 11:20:19' },
  { key: '13', productType: '小件', detail: '发电机（发动机上边…', submitter: '范亚飞', submitTime: '2025-03-24 11:20:19', updateTime: '2025-03-24 11:20:19' },
  { key: '14', productType: '小件', detail: '刹车泵', submitter: '范亚飞', submitTime: '2025-03-24 11:20:19', updateTime: '2025-03-24 11:20:19' },
  { key: '15', productType: '小件', detail: '油泵', submitter: '范亚飞', submitTime: '2025-03-24 11:20:19', updateTime: '2025-03-24 11:20:19' },
  { key: '16', productType: '小件', detail: '方向助力机（泵）', submitter: '范亚飞', submitTime: '2025-03-24 11:20:19', updateTime: '2025-03-24 11:20:19' },
  { key: '17', productType: '小件', detail: '安全气囊', submitter: '范亚飞', submitTime: '2025-03-24 11:20:19', updateTime: '2025-03-24 11:20:19' },
  { key: '18', productType: '小件', detail: '方向盘', submitter: '范亚飞', submitTime: '2025-03-24 11:20:19', updateTime: '2025-03-24 11:20:19' },
  { key: '19', productType: '小件', detail: '雨刮器', submitter: '范亚飞', submitTime: '2025-03-24 11:20:19', updateTime: '2025-03-24 11:20:19' },
  { key: '20', productType: '小件', detail: '鼓风机电机', submitter: '范亚飞', submitTime: '2025-03-24 11:20:19', updateTime: '2025-03-24 11:20:19' },
];

export default function ProductInfo() {
  const [formVisible, setFormVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [data, setData] = useState<ProductInfoItem[]>(mockData);
  const [searchText, setSearchText] = useState('');

  const columns: ColumnsType<ProductInfoItem> = [
    {
      title: '产品类型',
      dataIndex: 'productType',
      width: 120,
      sorter: (a, b) => a.productType.localeCompare(b.productType),
    },
    {
      title: '明细',
      dataIndex: 'detail',
      width: 150,
      sorter: (a, b) => a.detail.localeCompare(b.detail),
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
      width: 160,
      sorter: (a, b) => a.submitTime.localeCompare(b.submitTime),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 160,
      sorter: (a, b) => a.updateTime.localeCompare(b.updateTime),
    },
  ];

  const filteredData = data.filter(
    (item) =>
      item.productType.includes(searchText) ||
      item.detail.includes(searchText)
  );

  const handleAdd = () => {
    form.resetFields();
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 16).replace('T', ' ');
      const newItem: ProductInfoItem = {
        key: Date.now().toString(),
        productType: values.productType,
        detail: values.detail,
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
      {/* 顶部工具栏 */}
      <div style={{
        background: '#fff',
        padding: '10px 16px',
        borderBottom: '1px solid #f0f0f0',
      }}>
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
            <Button type="text" icon={<AppstoreOutlined />} />
            <Button type="text" icon={<ReloadOutlined />} />
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
            scroll={{ x: 800 }}
          />
        </div>
      </div>

      {/* 添加表单弹窗 */}
      <Modal
        title="产成品产品信息"
        open={formVisible}
        onCancel={handleCancel}
        footer={null}
        width={520}
        centered
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="产品类型"
            name="productType"
            rules={[{ required: true, message: '请选择产品类型' }]}
            labelCol={{ style: { color: '#333' } }}
          >
            <Select placeholder="请选择产品类型" options={productTypeOptions.map((o) => ({ value: o, label: o }))} />
          </Form.Item>
          <Form.Item
            label="明细"
            name="detail"
            rules={[{ required: true, message: '请输入明细' }]}
            labelCol={{ style: { color: '#333' } }}
          >
            <Input placeholder="请输入明细" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button type="primary" onClick={handleSubmit} style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
