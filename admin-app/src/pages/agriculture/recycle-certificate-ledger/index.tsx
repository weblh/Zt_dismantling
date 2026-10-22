import { Card, Table, Input, Button, Space, message, Modal, Form, Select, DatePicker, Radio, InputNumber } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined, FundProjectionScreenOutlined, UnorderedListOutlined, ColumnHeightOutlined, CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { makeEditColumn } from '@/components/TableEditColumn';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyRecycleCertificate } from '@/api/jdy';

const { TextArea } = Input;

interface RecycleItem {
  id: number;
  no: string;
  closeOrNegotiate: string;
  weighDate: string;
  plateNo: string;
  returnDate: string;
  vehicleType: string;
  vehicleModel: string;
  supplier: string;
  salesperson: string;
  returnPlace: string;
  tonnage: number | string;
  flatten: string;
  operation: string;
  bLevel: string;
  iron: string;
  aluminum: string;
  ternary: string;
  battery: string;
  remark: string;
  cancelForm: string;
  cancelFormRemark: string;
  handover: string;
  handoverRemark: string;
  recycleCert: string;
  recycleCertNo: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

function str(v: unknown) {
  return v == null || v === '' ? '' : String(v);
}

function mapRemoteRow(row: Record<string, unknown>): RecycleItem {
  return {
    id: Number(row.id) || 0,
    no: str(row.no),
    closeOrNegotiate: str(row.closeOrNegotiate),
    weighDate: str(row.weighDate),
    plateNo: str(row.plateNo),
    returnDate: str(row.returnDate),
    vehicleType: str(row.vehicleType),
    vehicleModel: str(row.vehicleModel),
    supplier: str(row.supplier),
    salesperson: str(row.salesperson),
    returnPlace: str(row.returnPlace),
    tonnage: (row.tonnage as number | string) ?? '',
    flatten: str(row.flatten),
    operation: str(row.operation),
    bLevel: str(row.bLevel),
    iron: str(row.iron),
    aluminum: str(row.aluminum),
    ternary: str(row.ternary),
    battery: str(row.battery),
    remark: str(row.remark),
    cancelForm: str(row.cancelForm),
    cancelFormRemark: str(row.cancelFormRemark),
    handover: str(row.handover),
    handoverRemark: str(row.handoverRemark),
    recycleCert: str(row.recycleCert),
    recycleCertNo: str(row.recycleCertNo),
    submitter: str(row.submitter),
    submitTime: str(row.submitTime),
    updateTime: str(row.updateTime),
  };
}

const formatTonnage = (v: number | string | null | undefined) => {
  if (v == null || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
};

const nowrap = (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>;

const baseColumns: ColumnsType<RecycleItem> = [
  { title: nowrap('编号'), dataIndex: 'no', width: 90, fixed: 'left' },
  { title: nowrap('销户/议价'), dataIndex: 'closeOrNegotiate', width: 100 },
  { title: nowrap('过磅日期'), dataIndex: 'weighDate', width: 110 },
  { title: nowrap('车牌号'), dataIndex: 'plateNo', width: 110 },
  { title: nowrap('回车日期'), dataIndex: 'returnDate', width: 110 },
  { title: nowrap('车辆类型'), dataIndex: 'vehicleType', width: 90 },
  { title: nowrap('车辆型号'), dataIndex: 'vehicleModel', width: 110 },
  { title: nowrap('供应商'), dataIndex: 'supplier', width: 120 },
  { title: nowrap('业务员'), dataIndex: 'salesperson', width: 90 },
  { title: nowrap('回车地'), dataIndex: 'returnPlace', width: 80 },
  { title: nowrap('吨位'), dataIndex: 'tonnage', width: 80, align: 'right', render: formatTonnage },
  { title: nowrap('压扁'), dataIndex: 'flatten', width: 70, align: 'center' },
  { title: nowrap('营运'), dataIndex: 'operation', width: 70, align: 'center' },
  { title: nowrap('B级'), dataIndex: 'bLevel', width: 70, align: 'center' },
  { title: nowrap('铁'), dataIndex: 'iron', width: 80, align: 'right' },
  { title: nowrap('铝'), dataIndex: 'aluminum', width: 80, align: 'right' },
  { title: nowrap('三元'), dataIndex: 'ternary', width: 80, align: 'right' },
  { title: nowrap('电瓶'), dataIndex: 'battery', width: 80, align: 'right' },
  { title: nowrap('备注'), dataIndex: 'remark', width: 100 },
  { title: nowrap('注销单'), dataIndex: 'cancelForm', width: 90 },
  { title: nowrap('注销单备注'), dataIndex: 'cancelFormRemark', width: 110 },
  { title: nowrap('移交手续'), dataIndex: 'handover', width: 90 },
  { title: nowrap('移交手续备注'), dataIndex: 'handoverRemark', width: 120 },
  { title: nowrap('回收证明'), dataIndex: 'recycleCert', width: 90 },
  { title: nowrap('回收证明'), dataIndex: 'recycleCertNo', width: 140 },
  { title: nowrap('提交人'), dataIndex: 'submitter', width: 90 },
  { title: nowrap('提交时间'), dataIndex: 'submitTime', width: 160 },
  { title: nowrap('更新时间'), dataIndex: 'updateTime', width: 160 },
];

const vehicleTypeOptions = [
  '2厢', '3厢', '面包', '大面包', '旅行车', '小商务', '商务', '越野', '小越野',
  '单排', '双排', '皮卡', '轻卡', '客车', '中型客车', '重型货车', '摩托',
  '三轮摩托', '五轮农用车', '箱货', '二轮蹦蹦', '油罐车', '自行车', '奥拓', '其他',
];

const yesNoOptions = [
  { label: '是', value: '是', style: { background: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
  { label: '否', value: '否', style: { borderRadius: 4, padding: '2px 12px' } },
];

const openStatusOptions = [
  { label: '已开', value: '已开', style: { background: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
  { label: '未开', value: '未开', style: { background: '#fffbe6', borderColor: '#ffe58f', color: '#d48806', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
];

const handoverOptions = [
  { label: '已移交', value: '已移交', style: { background: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
  { label: '未移交', value: '未移交', style: { background: '#fffbe6', borderColor: '#ffe58f', color: '#d48806', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
];

const ternaryBatteryOptions = [
  { label: '√', value: '√', style: { background: '#f6ffed', borderColor: '#b7eb8f', color: '#389e0d', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
  { label: '×', value: '×', style: { background: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
];

export default function RecycleCertificateLedger() {
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [dataSource, setDataSource] = useState<RecycleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<RecycleItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('recycle-certificate', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        setDataSource(((res.data?.records || []) as Record<string, unknown>[]).map(mapRemoteRow));
        setTotal(res.data?.total || 0);
      } catch {
        if (!cancelled) {
          message.error('回收证明加载失败，请稍后重试');
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

  const handleEdit = (record: RecycleItem) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      weighDate: record.weighDate ? dayjs(record.weighDate) : undefined,
      returnDate: record.returnDate ? dayjs(record.returnDate) : undefined,
    });
    setAddOpen(true);
  };

  const columns: ColumnsType<RecycleItem> = [...baseColumns, makeEditColumn<RecycleItem>(handleEdit)];

  const handleSearch = (value?: string) => {
    setPageNo(1);
    setKeyword((value ?? searchValue).trim());
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const payload = {
        ...values,
        weighDate: values.weighDate?.format?.('YYYY-MM-DD') || values.weighDate || '',
        returnDate: values.returnDate?.format?.('YYYY-MM-DD') || values.returnDate || '',
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
        } as RecycleItem;
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
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', gap: 16 }}>
          <Space wrap>
            <Button type="primary" size="small" icon={<FundProjectionScreenOutlined />}>表格视图</Button>
            <Button size="small" icon={<UnorderedListOutlined />}>看板视图</Button>
            <Button size="small" icon={<FundProjectionScreenOutlined />}>表格视图</Button>
          </Space>
          <div style={{ flex: 1 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setAddOpen(true); }}>添加</Button>
            <BusinessJdySyncButtons
              syncFn={syncJdyRecycleCertificate}
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
            scroll={{ x: 2400 }}
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
        title={editing ? '编辑回收证明' : '回收证明'}
        open={addOpen}
        onCancel={() => { setEditing(null); setAddOpen(false); form.resetFields(); }}
        footer={null}
        width={1100}
        centered
        closeIcon={<CloseOutlined />}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 编号</span>} name="no" rules={[{ required: true, message: '请选择编号' }]}>
              <Select placeholder="请选择" />
            </Form.Item>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 销户/议价</span>} name="closeOrNegotiate" rules={[{ required: true, message: '请输入销户/议价' }]}>
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 过磅日期</span>} name="weighDate" rules={[{ required: true, message: '请选择过磅日期' }]}>
              <DatePicker style={{ width: '100%' }} suffixIcon={<CalendarOutlined />} />
            </Form.Item>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 车牌号</span>} name="plateNo" rules={[{ required: true, message: '请选择车牌号' }]}>
              <Select placeholder="请选择" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 回车日期</span>} name="returnDate" rules={[{ required: true, message: '请选择回车日期' }]}>
              <DatePicker style={{ width: '100%' }} suffixIcon={<CalendarOutlined />} />
            </Form.Item>
          </div>

          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 车辆类型</span>} name="vehicleType" rules={[{ required: true, message: '请选择车辆类型' }]}>
            <Radio.Group>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(9, 1fr)', gap: '8px 16px' }}>
                {vehicleTypeOptions.map((opt) => (
                  <Radio key={opt} value={opt} style={{ display: 'block', marginRight: 0 }}>{opt}</Radio>
                ))}
              </div>
            </Radio.Group>
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 车辆型号</span>} name="vehicleModel" rules={[{ required: true, message: '请选择车辆型号' }]}>
              <Select placeholder="请选择" />
            </Form.Item>
            <Form.Item label="供应商" name="supplier">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item label="业务员" name="salesperson">
              <Select placeholder="请选择" />
            </Form.Item>
            <Form.Item label="回车地" name="returnPlace">
              <Input placeholder="请输入" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 吨位</span>} name="tonnage" rules={[{ required: true, message: '请填写吨位' }]}>
              <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
            </Form.Item>
            <Form.Item label="压扁" name="flatten" initialValue="是">
              <Radio.Group options={yesNoOptions} />
            </Form.Item>
            <Form.Item label="营运" name="operation" initialValue="是">
              <Radio.Group options={yesNoOptions} />
            </Form.Item>
            <Form.Item label="B级" name="bLevel" initialValue="是">
              <Radio.Group options={yesNoOptions} />
            </Form.Item>
          </div>

          <div style={{ borderTop: '2px solid #52c41a', margin: '8px 0 16px' }}>
            <span style={{ color: '#52c41a', fontWeight: 500, fontSize: 14 }}>车辆情况</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label="铁" name="iron">
              <Select defaultValue={4}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="铝" name="aluminum">
              <Select defaultValue={4}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 三元</span>} name="ternary" rules={[{ required: true }]} initialValue="√">
              <Radio.Group options={ternaryBatteryOptions} />
            </Form.Item>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 电瓶</span>} name="battery" rules={[{ required: true }]} initialValue="√">
              <Radio.Group options={ternaryBatteryOptions} />
            </Form.Item>
          </div>

          <Form.Item label="备注" name="remark">
            <TextArea rows={3} placeholder="请输入" />
          </Form.Item>

          <div style={{ borderTop: '2px solid #52c41a', margin: '8px 0 16px' }}>
            <span style={{ color: '#52c41a', fontWeight: 500, fontSize: 14 }}>回收证明</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label="注销单" name="cancelForm" initialValue="已开">
              <Radio.Group options={openStatusOptions} />
            </Form.Item>
            <Form.Item label="注销单备注" name="cancelFormRemark">
              <TextArea rows={2} placeholder="请输入" />
            </Form.Item>
            <Form.Item label="移交手续" name="handover" initialValue="已移交">
              <Radio.Group options={handoverOptions} />
            </Form.Item>
            <Form.Item label="移交手续备注" name="handoverRemark">
              <TextArea rows={2} placeholder="请输入" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
            <Form.Item label="回收证明" name="recycleCert" initialValue="已开">
              <Radio.Group options={openStatusOptions} />
            </Form.Item>
            <Form.Item label="回收证明" name="recycleCertNo">
              <TextArea rows={2} placeholder="请输入" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <Button type="primary" onClick={handleSubmit} style={{ background: '#13c2c2', borderColor: '#13c2c2', paddingLeft: 32, paddingRight: 32 }}>提交</Button>
            <Button onClick={handleSaveDraft} style={{ paddingLeft: 32, paddingRight: 32 }}>保存草稿</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
