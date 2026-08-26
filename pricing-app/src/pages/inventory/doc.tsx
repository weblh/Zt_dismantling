import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, message } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getBizLocalRows, getJdyBusinessData, putBizLocalRows } from '@/api/bizData';
import { getStoredUser } from '@/config/apps';
import dayjs from 'dayjs';

type Row = Record<string, unknown> & { id: number };

const WAREHOUSE_OPTIONS = ['成品库', '三元库', '废旧鞋帽库'];

type Variant = 'product-inbound' | 'product-outbound' | 'other-inbound' | 'other-outbound';

const META: Record<
  Variant,
  {
    title: string;
    typeField: string;
    typeLabel: string;
    typeOptions: string[];
    warehouseField: string;
    warehouseLabel: string;
    qtyField: string;
    qtyLabel: string;
    timeField: string;
    timeLabel: string;
    nameFields: { key: string; label: string }[];
  }
> = {
  'product-inbound': {
    title: '产成品入库单',
    typeField: 'inboundType',
    typeLabel: '入库类型',
    typeOptions: ['生产入库', '回收入库', '调拨入库'],
    warehouseField: 'inboundWarehouse',
    warehouseLabel: '入库仓库',
    qtyField: 'inboundTonnage',
    qtyLabel: '入库吨位',
    timeField: 'inboundTime',
    timeLabel: '入库时间',
    nameFields: [
      { key: 'productType', label: '产品类型' },
      { key: 'detail', label: '明细' },
    ],
  },
  'product-outbound': {
    title: '产成品出库单',
    typeField: 'outboundType',
    typeLabel: '出库类型',
    typeOptions: ['销售出库', '调拨出库', '报损出库'],
    warehouseField: 'outboundWarehouse',
    warehouseLabel: '出库仓库',
    qtyField: 'outboundTonnage',
    qtyLabel: '出库吨位',
    timeField: 'outboundTime',
    timeLabel: '出库时间',
    nameFields: [
      { key: 'productType', label: '产品类型' },
      { key: 'detail', label: '明细' },
    ],
  },
  'other-inbound': {
    title: '其他入库单',
    typeField: 'inboundType',
    typeLabel: '入库类型',
    typeOptions: ['生产入库', '调拨入库', '盘盈入库', '退换货入库'],
    warehouseField: 'inboundWarehouse',
    warehouseLabel: '入库仓库',
    qtyField: 'inboundQuantity',
    qtyLabel: '入库数量',
    timeField: 'inboundTime',
    timeLabel: '入库时间',
    nameFields: [{ key: 'name', label: '产品明细' }],
  },
  'other-outbound': {
    title: '其他出库单',
    typeField: 'outboundType',
    typeLabel: '出库类型',
    typeOptions: ['销售出库', '调拨出库', '报损出库'],
    warehouseField: 'outboundWarehouse',
    warehouseLabel: '出库仓库',
    qtyField: 'outboundQuantity',
    qtyLabel: '出库数量',
    timeField: 'outboundTime',
    timeLabel: '出库时间',
    nameFields: [{ key: 'name', label: '产品明细' }],
  },
};

async function loadMerged(bizKey: string): Promise<Row[]> {
  const local = await getBizLocalRows<Row>(bizKey)
    .then((r) => r.data || [])
    .catch(() => [] as Row[]);
  const remote = await getJdyBusinessData(bizKey, { pageNo: 1, pageSize: 5000 })
    .then((r) => (r.data?.records || []) as Row[])
    .catch(() => [] as Row[]);
  const map = new Map<number, Row>();
  remote.forEach((row) => {
    if (row?.id != null) map.set(Number(row.id), row);
  });
  local.forEach((row) => {
    if (row?.id != null) map.set(Number(row.id), row);
  });
  return Array.from(map.values()).sort((a, b) => Number(b.id) - Number(a.id));
}

export default function InventoryDocPage({ variant }: { variant: Variant }) {
  const meta = META[variant];
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await loadMerged(variant));
    } finally {
      setLoading(false);
    }
  }, [variant]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: ColumnsType<Row> = useMemo(
    () => [
      { title: meta.typeLabel, dataIndex: meta.typeField, width: 110 },
      { title: meta.warehouseLabel, dataIndex: meta.warehouseField, width: 110 },
      ...meta.nameFields.map((f) => ({ title: f.label, dataIndex: f.key, width: 120, ellipsis: true })),
      {
        title: meta.qtyLabel,
        dataIndex: meta.qtyField,
        width: 100,
        align: 'right' as const,
      },
      { title: meta.timeLabel, dataIndex: meta.timeField, width: 160 },
      { title: '提交人', dataIndex: 'submitter', width: 100 },
      { title: '提交时间', dataIndex: 'submitTime', width: 160 },
    ],
    [meta],
  );

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const user = getStoredUser();
      const me = user.nickname || user.username || '系统';
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const next: Row = {
        id: Date.now(),
        ...values,
        [meta.qtyField]: Number(values[meta.qtyField]) || 0,
        [meta.timeField]: now,
        department: user.department || '',
        submitter: me,
        submitTime: now,
        updateTime: now,
      };
      const localOnly = await getBizLocalRows<Row>(variant)
        .then((r) => r.data || [])
        .catch(() => [] as Row[]);
      const mergedLocal = [next, ...localOnly.filter((r) => Number(r.id) !== next.id)];
      await putBizLocalRows(variant, mergedLocal);
      message.success('添加成功');
      setOpen(false);
      form.resetFields();
      refresh();
    } catch {
      /* validate */
    }
  };

  const handleDelete = () => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择要删除的记录');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${selectedRowKeys.length} 条？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        const ids = new Set(selectedRowKeys.map(Number));
        const localOnly = await getBizLocalRows<Row>(variant)
          .then((r) => r.data || [])
          .catch(() => [] as Row[]);
        await putBizLocalRows(
          variant,
          localOnly.filter((r) => !ids.has(Number(r.id))),
        );
        setSelectedRowKeys([]);
        message.success('删除成功');
        refresh();
      },
    });
  };

  return (
    <div style={{ margin: 16, background: '#fff', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Space>
          <strong>{meta.title}</strong>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            添加
          </Button>
          <Button icon={<DeleteOutlined />} onClick={handleDelete}>
            删除
          </Button>
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            刷新
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1100 }}
        size="middle"
      />

      <Modal
        title={`添加${meta.title}`}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleAdd}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name={meta.typeField} label={meta.typeLabel} rules={[{ required: true }]}>
            <Select options={meta.typeOptions.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name={meta.warehouseField} label={meta.warehouseLabel} rules={[{ required: true }]}>
            <Select options={WAREHOUSE_OPTIONS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          {meta.nameFields.map((f) => (
            <Form.Item key={f.key} name={f.key} label={f.label} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          ))}
          <Form.Item name={meta.qtyField} label={meta.qtyLabel} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.001} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
