import React, { useState } from 'react';
import { Card, Table, Button, Space, Form, DatePicker, Select, InputNumber, Input, message } from 'antd';
import { EditOutlined, SaveOutlined, PlusOutlined, SearchOutlined, ExportOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileStatSummary from '@/components/MobileStatSummary';

interface StatsItem {
  key: string;
  productName: string;
  netWeight: number | string;
  totalPrice: number | string;
}

const todayData: StatsItem[] = [
  { key: '1', productName: '其他3', netWeight: 4.29, totalPrice: 0 },
  { key: '2', productName: '橡胶', netWeight: 1.065, totalPrice: 1810.5 },
];

const monthData: StatsItem[] = [
  { key: '1', productName: '撕碎料', netWeight: 1000.227, totalPrice: 3161190.49 },
  { key: '2', productName: '橡胶', netWeight: 74.468, totalPrice: 684524.4 },
  { key: '3', productName: '小件', netWeight: 140.565, totalPrice: 102765.4 },
  { key: '4', productName: '橡胶', netWeight: 125.81, totalPrice: 2289361.5 },
  { key: '5', productName: '铝件', netWeight: 68.374, totalPrice: 3031886 },
];

const yearData: StatsItem[] = [
  { key: '1', productName: '撕碎料', netWeight: 1000.227, totalPrice: 3161190.49 },
  { key: '2', productName: '橡胶', netWeight: 74.468, totalPrice: 684524.4 },
  { key: '3', productName: '小件', netWeight: 140.565, totalPrice: 102765.4 },
  { key: '4', productName: '橡胶', netWeight: 125.81, totalPrice: 2289361.5 },
  { key: '5', productName: '铝件', netWeight: 68.374, totalPrice: 3031886 },
  { key: '6', productName: '废钢', netWeight: 707.13, totalPrice: 45867985.885 },
  { key: '7', productName: '其他3', netWeight: 386.365, totalPrice: 12393 },
  { key: '8', productName: '底盘料', netWeight: 2394.15, totalPrice: 5477778.05 },
  { key: '9', productName: '其他2', netWeight: 3.45, totalPrice: 6890 },
  { key: '10', productName: '塑料', netWeight: 217.91, totalPrice: 552942 },
  { key: '11', productName: '其他4', netWeight: 0.07, totalPrice: 0 },
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

const StatCard: React.FC<StatCardProps & { compact?: boolean }> = ({ title, data, compact }) => {
  const summary = calculateSummary(data);

  return (
    <Card
      title={<span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>}
      style={{ flex: 1, minWidth: compact ? '100%' : 320, margin: compact ? '0 0 12px' : 8 }}
      styles={{ body: { padding: 12 } }}
      headStyle={{ borderBottom: '1px solid #f0f0f0' }}
    >
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        bordered
        size="small"
        footer={() => (
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 600 }}>
            <span style={{ marginRight: 120 }}>
              汇总: {summary.netWeight.toFixed(3)}
            </span>
            <span>
              {summary.totalPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      />
    </Card>
  );
};

export default function FinishedProductStatistics() {
  const isMobile = useIsMobile();
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

  const yearSummary = calculateSummary(yearData);
  const monthSummary = calculateSummary(monthData);
  const todaySummary = calculateSummary(todayData);

  return (
    <div className="page-container">
      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space wrap>
          {!isMobile && (
            <>
              <Button icon={<EditOutlined />} onClick={() => setEditMode(!editMode)}>
                {editMode ? '取消编辑' : '编辑'}
              </Button>
              <Button icon={<SaveOutlined />} onClick={handleSave} disabled={!editMode}>
                保存
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>
                新增
              </Button>
            </>
          )}
        </Space>
        <Space wrap>
          <Form form={form} layout={isMobile ? 'vertical' : 'inline'} style={{ width: isMobile ? '100%' : undefined }}>
            <Form.Item name="date" label="日期">
              <DatePicker.RangePicker style={{ width: isMobile ? '100%' : undefined }} />
            </Form.Item>
            <Form.Item name="productName" label="品名">
              <Select
                placeholder="请选择"
                allowClear
                style={{ width: isMobile ? '100%' : 120 }}
                options={[
                  { label: '撕碎料', value: '撕碎料' },
                  { label: '废钢', value: '废钢' },
                  { label: '底盘料', value: '底盘料' },
                  { label: '铜线', value: '铜线' },
                  { label: '铝件', value: '铝件' },
                  { label: '塑料', value: '塑料' },
                  { label: '小件', value: '小件' },
                  { label: '橡胶', value: '橡胶' },
                  { label: '其他1', value: '其他1' },
                  { label: '其他2', value: '其他2' },
                  { label: '其他3', value: '其他3' },
                  { label: '其他4', value: '其他4' },
                  { label: '其他5', value: '其他5' },
                  { label: '其他6', value: '其他6' },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Space wrap>
                <Button icon={<SearchOutlined />} type="primary" onClick={handleSearch}>
                  查询
                </Button>
                <Button icon={<ExportOutlined />}>导出</Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        {isMobile && (
          <MobileStatSummary
            title="成品销售汇总"
            hint="手机端优先展示汇总数字；明细表格可向下滑动查看。"
            items={[
              { label: '本日净重', value: todaySummary.netWeight.toFixed(3), unit: '吨' },
              {
                label: '本日金额',
                value: todaySummary.totalPrice.toLocaleString('zh-CN', { maximumFractionDigits: 0 }),
                unit: '元',
              },
              { label: '本月净重', value: monthSummary.netWeight.toFixed(3), unit: '吨' },
              {
                label: '本年金额',
                value: yearSummary.totalPrice.toLocaleString('zh-CN', { maximumFractionDigits: 0 }),
                unit: '元',
                color: '#cf1322',
              },
            ]}
          />
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <StatCard title="本日销售统计" data={todayData} compact={isMobile} />
          <StatCard title="本月销售统计" data={monthData} compact={isMobile} />
          <StatCard title="本年销售统计" data={yearData} compact={isMobile} />
        </div>
      </div>

      {/* 新增/编辑表单区域 */}
      {editMode && !isMobile && (
        <div style={{ background: '#fff', margin: 16, padding: 24, borderRadius: 4 }}>
          <h3 style={{ marginBottom: 16 }}>新增销售统计</h3>
          <Form layout="vertical">
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item label="日期" rules={[{ required: true, message: '请选择日期' }]} style={{ flex: 1 }}>
                <DatePicker showTime style={{ width: '100%' }} placeholder="请选择" />
              </Form.Item>
              <Form.Item label="品名" rules={[{ required: true, message: '请选择品名' }]} style={{ flex: 1 }}>
                <Select
                  placeholder="请选择"
                  options={[
                    { label: '撕碎料', value: '撕碎料' },
                    { label: '废钢', value: '废钢' },
                    { label: '底盘料', value: '底盘料' },
                    { label: '铜线', value: '铜线' },
                    { label: '铝件', value: '铝件' },
                    { label: '塑料', value: '塑料' },
                    { label: '小件', value: '小件' },
                    { label: '橡胶', value: '橡胶' },
                    { label: '其他1', value: '其他1' },
                    { label: '其他2', value: '其他2' },
                    { label: '其他3', value: '其他3' },
                    { label: '其他4', value: '其他4' },
                    { label: '其他5', value: '其他5' },
                    { label: '其他6', value: '其他6' },
                  ]}
                />
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
