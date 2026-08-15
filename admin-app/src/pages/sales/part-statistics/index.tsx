import React, { useState } from 'react';
import { Card, Table, Button, Space, Form, DatePicker, Select, InputNumber, message } from 'antd';
import { EditOutlined, SaveOutlined, PlusOutlined, SearchOutlined, ExportOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface StatsItem {
  key: string;
  productName: string;
  netWeight: number | string;
  totalPrice: number | string;
}

const todayData: StatsItem[] = [];

const monthData: StatsItem[] = [
  { key: '1', productName: '塑料', netWeight: 0.01, totalPrice: 242 },
];

const yearData: StatsItem[] = [
  { key: '1', productName: '废黑料', netWeight: 3.478, totalPrice: 11196 },
  { key: '2', productName: '小件', netWeight: 1.398, totalPrice: 20184 },
  { key: '3', productName: '其他6', netWeight: 0, totalPrice: 21920 },
  { key: '4', productName: '橡胶', netWeight: 5.489, totalPrice: 30095 },
  { key: '5', productName: '其他2', netWeight: 3.651, totalPrice: 16110 },
  { key: '6', productName: '废底料', netWeight: 2.147, totalPrice: 16089 },
  { key: '7', productName: '铝件', netWeight: 0.147, totalPrice: 4753 },
  { key: '8', productName: '铜线', netWeight: 0.014, totalPrice: 1025 },
  { key: '9', productName: '塑料', netWeight: 0.715, totalPrice: 13460 },
  { key: '10', productName: '其他4', netWeight: 0.934, totalPrice: 210478.69 },
  { key: '11', productName: '其他垃圾', netWeight: 2.512, totalPrice: 10140 },
];

const columns: ColumnsType<StatsItem> = [
  { title: '品名', dataIndex: 'productName', width: 120 },
  {
    title: '净重',
    dataIndex: 'netWeight',
    width: 150,
    align: 'right',
    render: (val: number | string) => {
      if (typeof val === 'string') return val || '-';
      if (val === null || val === undefined) return '-';
      return Number(val).toFixed(3);
    },
  },
  {
    title: '总价(含税)',
    dataIndex: 'totalPrice',
    width: 180,
    align: 'right',
    render: (val: number | string) => {
      if (typeof val === 'string') return val || '-';
      if (val === null || val === undefined) return '-';
      return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
  },
];

const calculateSummary = (data: StatsItem[]) => {
  let netWeight = 0;
  let totalPrice = 0;
  data.forEach(item => {
    if (typeof item.netWeight === 'number') netWeight += item.netWeight;
    if (typeof item.totalPrice === 'number') totalPrice += item.totalPrice;
  });
  return { netWeight, totalPrice };
};

interface StatCardProps {
  title: string;
  data: StatsItem[];
}

const StatCard: React.FC<StatCardProps> = ({ title, data }) => {
  const summary = calculateSummary(data);
  const hasData = data.length > 0;

  return (
    <Card
      title={<span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>}
      style={{ flex: 1, minWidth: 320, margin: 8 }}
      bodyStyle={{ padding: 12 }}
      headStyle={{ borderBottom: '1px solid #f0f0f0' }}
    >
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        bordered
        size="small"
        footer={hasData ? () => (
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 600 }}>
            <span style={{ marginRight: 120 }}>
              汇总: {summary.netWeight.toFixed(3)}
            </span>
            <span>
              {summary.totalPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ) : undefined}
      />
    </Card>
  );
};

const productNameOptions = [
  { label: '废黑料', value: '废黑料' },
  { label: '小件', value: '小件' },
  { label: '其他6', value: '其他6' },
  { label: '橡胶', value: '橡胶' },
  { label: '其他2', value: '其他2' },
  { label: '废底料', value: '废底料' },
  { label: '铝件', value: '铝件' },
  { label: '铜线', value: '铜线' },
  { label: '塑料', value: '塑料' },
  { label: '其他4', value: '其他4' },
  { label: '其他垃圾', value: '其他垃圾' },
  { label: '其他1', value: '其他1' },
  { label: '其他3', value: '其他3' },
  { label: '其他5', value: '其他5' },
];

export default function PartStatistics() {
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      console.log('查询条件:', values);
      message.success('查询成功');
    } catch {
      message.error('请填写查询条件');
    }
  };

  const handleSave = () => {
    setEditMode(false);
    message.success('保存成功');
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
          <Button icon={<EditOutlined />} onClick={() => setEditMode(!editMode)}>
            {editMode ? '取消编辑' : '编辑'}
          </Button>
          <Button icon={<SaveOutlined />} onClick={handleSave} disabled={!editMode}>
            保存
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            新增
          </Button>
        </Space>
        <Space>
          <Form form={form} layout="inline">
            <Form.Item name="date" label="日期">
              <DatePicker.RangePicker />
            </Form.Item>
            <Form.Item name="productName" label="品名">
              <Select placeholder="请选择" allowClear style={{ width: 120 }} options={productNameOptions} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button icon={<SearchOutlined />} type="primary" onClick={handleSearch}>
                  查询
                </Button>
                <Button icon={<ExportOutlined />}>导出</Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', padding: 16 }}>
        <StatCard title="本日销售统计" data={todayData} />
        <StatCard title="本月销售统计" data={monthData} />
        <StatCard title="本年销售统计" data={yearData} />
      </div>

      {/* 新增/编辑表单区域 */}
      {editMode && (
        <div style={{ background: '#fff', margin: 16, padding: 24, borderRadius: 4 }}>
          <h3 style={{ marginBottom: 16 }}>新增销售统计</h3>
          <Form layout="vertical">
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item label="日期" rules={[{ required: true, message: '请选择日期' }]} style={{ flex: 1 }}>
                <DatePicker showTime style={{ width: '100%' }} placeholder="请选择" />
              </Form.Item>
              <Form.Item label="品名" rules={[{ required: true, message: '请选择品名' }]} style={{ flex: 1 }}>
                <Select placeholder="请选择" options={productNameOptions} />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item label="净重" rules={[{ required: true, message: '请输入净重' }]} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请输入净重" min={0} />
              </Form.Item>
              <Form.Item label="总价(含税)" rules={[{ required: true, message: '请输入总价' }]} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请输入总价" min={0} />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <Button onClick={() => setEditMode(false)}>取消</Button>
              <Button type="primary" onClick={handleSave}>
                保存
              </Button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}
