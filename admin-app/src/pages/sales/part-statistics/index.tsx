import React, { useCallback, useEffect, useState } from 'react';
import { Card, Table, Button, Space, Form, DatePicker, Select, InputNumber, message, Modal, Input, Spin } from 'antd';
import { EditOutlined, SaveOutlined, PlusOutlined, SearchOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { makeEditColumn } from '@/components/TableEditColumn';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileStatSummary from '@/components/MobileStatSummary';
import { getPartSalesStatistics, type SalesStatRow } from '@/api/jdy';

interface StatsItem {
  key: string;
  productName: string;
  netWeight: number | string;
  totalPrice: number | string;
}

const toRows = (rows?: SalesStatRow[]): StatsItem[] =>
  (rows || []).map((r, i) => ({
    key: r.key || String(i + 1),
    productName: r.productName || '',
    netWeight: Number(r.netWeight) || 0,
    totalPrice: Number(r.totalPrice) || 0,
  }));

const baseColumns: ColumnsType<StatsItem> = [
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
  onEdit: (record: StatsItem) => void;
}

const StatCard: React.FC<StatCardProps & { compact?: boolean }> = ({ title, data, compact, onEdit }) => {
  const summary = calculateSummary(data);
  const hasData = data.length > 0;
  const columns: ColumnsType<StatsItem> = [...baseColumns, makeEditColumn<StatsItem>(onEdit)];

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
        locale={{ emptyText: '暂无数据' }}
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
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [yearRows, setYearRows] = useState<StatsItem[]>([]);
  const [monthRows, setMonthRows] = useState<StatsItem[]>([]);
  const [todayRows, setTodayRows] = useState<StatsItem[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<StatsItem | null>(null);
  const [editForm] = Form.useForm();

  const loadData = useCallback(async (params?: {
    productName?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    setLoading(true);
    try {
      const res = await getPartSalesStatistics(params);
      setTodayRows(toRows(res.data?.today));
      setMonthRows(toRows(res.data?.month));
      setYearRows(toRows(res.data?.year));
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载销售统计失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (record: StatsItem) => {
    setEditing(record);
    editForm.setFieldsValue(record);
    setEditOpen(true);
  };

  const handleEditOk = async () => {
    const values = await editForm.validateFields();
    const patch = (prev: StatsItem[]) =>
      prev.map((r) => (r.key === editing?.key ? { ...r, ...values } : r));
    setTodayRows(patch);
    setMonthRows(patch);
    setYearRows(patch);
    message.success('修改成功');
    setEditOpen(false);
    setEditing(null);
  };

  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      const range = values.date as [dayjs.Dayjs, dayjs.Dayjs] | undefined;
      await loadData({
        productName: values.productName,
        startDate: range?.[0]?.format('YYYY-MM-DD'),
        endDate: range?.[1]?.format('YYYY-MM-DD'),
      });
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
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => setEditMode(!editMode)}>
            {editMode ? '取消编辑' : '编辑'}
          </Button>
          <Button icon={<SaveOutlined />} onClick={handleSave} disabled={!editMode}>
            保存
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            新增
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => loadData()} loading={loading}>
            刷新
          </Button>
        </Space>
        <Space wrap>
          <Form form={form} layout="inline">
            <Form.Item name="date" label="日期">
              <DatePicker.RangePicker />
            </Form.Item>
            <Form.Item name="productName" label="品名">
              <Select placeholder="请选择" allowClear style={{ width: 120 }} options={productNameOptions} />
            </Form.Item>
            <Form.Item>
              <Space wrap>
                <Button icon={<SearchOutlined />} type="primary" onClick={handleSearch} loading={loading}>
                  查询
                </Button>
                <Button icon={<ExportOutlined />}>导出</Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </div>

      <Spin spinning={loading}>
        <div style={{ padding: 16 }}>
          {isMobile && (
            <MobileStatSummary
              title="配件销售汇总"
              hint="手机端优先看汇总数字，明细可向下滑动。"
              items={[
                { label: '本日净重', value: calculateSummary(todayRows).netWeight.toFixed(3), unit: '吨' },
                { label: '本月净重', value: calculateSummary(monthRows).netWeight.toFixed(3), unit: '吨' },
                { label: '本年净重', value: calculateSummary(yearRows).netWeight.toFixed(3), unit: '吨' },
                {
                  label: '本年金额',
                  value: calculateSummary(yearRows).totalPrice.toLocaleString('zh-CN', { maximumFractionDigits: 0 }),
                  unit: '元',
                  color: '#cf1322',
                },
              ]}
            />
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <StatCard title="本日销售统计" data={todayRows} onEdit={handleEdit} compact={isMobile} />
            <StatCard title="本月销售统计" data={monthRows} onEdit={handleEdit} compact={isMobile} />
            <StatCard title="本年销售统计" data={yearRows} onEdit={handleEdit} compact={isMobile} />
          </div>
        </div>
      </Spin>

      <Modal
        title="编辑销售统计"
        open={editOpen}
        onOk={handleEditOk}
        onCancel={() => { setEditOpen(false); setEditing(null); }}
        width={720}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="productName" label="品名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="netWeight" label="净重"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="totalPrice" label="总价(含税)"><InputNumber style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

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
