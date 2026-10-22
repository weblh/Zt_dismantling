import { Card, Table, Input, Button, Space, message, Modal, Form, DatePicker, InputNumber } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined, ColumnHeightOutlined, CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { makeEditColumn } from '@/components/TableEditColumn';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyRecycleCertificateDaily } from '@/api/jdy';

const { TextArea } = Input;

interface DailyItem {
  id: number;
  date: string;
  received: number | null;
  issued: number | null;
  voided: number | null;
  other: number | null;
  unissued: number | null;
  remark: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

function toNumOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapRemoteRow(row: Record<string, unknown>): DailyItem {
  return {
    id: Number(row.id) || 0,
    date: row.date == null ? '' : String(row.date),
    received: toNumOrNull(row.received),
    issued: toNumOrNull(row.issued),
    voided: toNumOrNull(row.voided),
    other: toNumOrNull(row.other),
    unissued: toNumOrNull(row.unissued),
    remark: row.remark == null ? '' : String(row.remark),
    submitter: row.submitter == null ? '' : String(row.submitter),
    submitTime: row.submitTime == null ? '' : String(row.submitTime),
    updateTime: row.updateTime == null ? '' : String(row.updateTime),
  };
}

const renderNum = (v: number | null) => (v === null || v === undefined ? '' : v);

const nowrap = (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>;

const baseColumns: ColumnsType<DailyItem> = [
  { title: nowrap('日期'), dataIndex: 'date', width: 110, fixed: 'left' },
  { title: nowrap('回收证明领取数量'), dataIndex: 'received', width: 150, align: 'right', render: renderNum },
  { title: nowrap('回收证明开具数量'), dataIndex: 'issued', width: 150, align: 'right', render: renderNum },
  { title: nowrap('作废数量'), dataIndex: 'voided', width: 100, align: 'right', render: renderNum },
  { title: nowrap('其他'), dataIndex: 'other', width: 80, align: 'right', render: renderNum },
  { title: nowrap('回收证明未开具数'), dataIndex: 'unissued', width: 150, align: 'right', render: renderNum },
  { title: nowrap('备注'), dataIndex: 'remark', width: 200 },
  { title: nowrap('提交人'), dataIndex: 'submitter', width: 90, render: (v: string) => <span style={{ color: '#1890ff' }}>{v}</span> },
  { title: nowrap('提交时间'), dataIndex: 'submitTime', width: 160 },
  { title: nowrap('更新时间'), dataIndex: 'updateTime', width: 160 },
];

export default function RecycleCertificateDaily() {
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [dataSource, setDataSource] = useState<DailyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<DailyItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('recycle-certificate-daily', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        setDataSource(((res.data?.records || []) as Record<string, unknown>[]).map(mapRemoteRow));
        setTotal(res.data?.total || 0);
      } catch {
        if (!cancelled) {
          message.error('回收证明台账加载失败，请稍后重试');
          setDataSource([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageNo, pageSize, keyword, reloadKey]);

  const handleEdit = (record: DailyItem) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      date: record.date ? dayjs(record.date) : undefined,
    });
    setAddOpen(true);
  };

  const columns: ColumnsType<DailyItem> = [...baseColumns, makeEditColumn<DailyItem>(handleEdit)];

  const handleSearch = (value?: string) => {
    setPageNo(1);
    setKeyword((value ?? searchValue).trim());
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const payload = {
        ...values,
        date: values.date?.format?.('YYYY-MM-DD') || values.date || '',
        updateTime: now,
      };
      if (editing) {
        setDataSource((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...payload } : r)));
        message.success('修改成功（仅本地预览，请以简道云同步数据为准）');
      } else {
        const row = {
          id: Date.now(),
          ...payload,
          submitter: '系统',
          submitTime: now,
        } as DailyItem;
        setDataSource((prev) => [row, ...prev]);
        setTotal((t) => t + 1);
        message.success('提交成功（仅本地预览，请以简道云同步数据为准）');
      }
      setEditing(null);
      setAddOpen(false);
      form.resetFields();
    });
  };

  const handleSaveDraft = () => {
    message.success('保存草稿成功');
    setAddOpen(false);
    form.resetFields();
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} style={{ background: '#13c2c2', borderColor: '#13c2c2' }} onClick={() => { setEditing(null); form.resetFields(); setAddOpen(true); }}>添加</Button>
            <BusinessJdySyncButtons
              syncFn={syncJdyRecycleCertificateDaily}
              onSynced={() => {
                setPageNo(1);
                setReloadKey((k) => k + 1);
              }}
            />
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={() => message.success('导出成功')}>导出</Button>
            <Button icon={<DeleteOutlined />}>删除</Button>
            <Button>操作记录</Button>
          </Space>
          <Space wrap>
            <Input.Search
              placeholder="搜索数据"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ width: isMobile ? '100%' : 200 }}
              allowClear
            />
            <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
            <Button icon={<ColumnHeightOutlined />}>排序</Button>
            <Button>更多</Button>
          </Space>
        </div>
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={withMobilePagination(isMobile, {
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, size) => {
                setPageNo(p);
                setPageSize(size);
              },
            })}
          />
        </div>
      </Card>

      <Modal
        title={editing ? '编辑山西华成攒碳回收证明台账' : '山西华成攒碳回收证明台账'}
        open={addOpen}
        onCancel={() => { setEditing(null); setAddOpen(false); form.resetFields(); }}
        footer={null}
        width={800}
        centered
        closeIcon={<CloseOutlined />}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} suffixIcon={<CalendarOutlined />} />
          </Form.Item>
          <Form.Item label="回收证明领取数量" name="received">
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="回收证明开具数量" name="issued">
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="作废数量" name="voided">
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="其他" name="other">
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="回收证明未开具数" name="unissued">
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <TextArea rows={4} placeholder="请输入" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 16, marginTop: 16 }}>
            <Button type="primary" onClick={handleSubmit} style={{ background: '#13c2c2', borderColor: '#13c2c2', paddingLeft: 32, paddingRight: 32 }}>提交</Button>
            <Button onClick={handleSaveDraft} style={{ paddingLeft: 32, paddingRight: 32 }}>保存草稿</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
