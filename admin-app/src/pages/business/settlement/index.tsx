import { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getStoredUser } from '@/config/apps';
import {
  addLocalBizRow,
  deleteLocalBizRows,
  formatBizDateTime,
  getLocalBizRows,
  mergeLocalRemoteRows,
  upsertLocalBizRow,
} from '@/utils/localBizStore';
import DictSelect from '@/components/DictSelect';
import { makeEditColumn } from '@/components/TableEditColumn';
import BizLinkDataModal, { mapLinkedRowToFormValues } from '@/components/BizLinkDataModal';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import { getJdyBusinessData, syncJdySettlement } from '@/api/jdy';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import dayjs from 'dayjs';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Radio,
  Select,
  DatePicker,
  InputNumber,
  Divider,
  Upload,
  Steps,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  ExpandOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';

const BIZ_KEY = 'settlement';

interface SettlementItem {
  id: number;
  dataId?: string;
  settlementStatus: 'settled' | 'unsettled';
  code: string;
  returnDate: string;
  weighDate: string;
  plateNumber: string;
  vehicleType: string;
  vehicleModel: string;
  supplier: string;
  salesperson: string;
  returnLocation: string;
  tonnage: number;
  iron: number;
  aluminum: number;
  ternary: number;
  battery: number;
  kgDiff: number;
  deductNetWeight: number;
  deductBattery: number;
  goodCondition: number;
  deductTwoBox: number;
  deductBreadBox: number;
  deductIronRing: number;
  deductDiesel: number;
  selfDelivery: number;
  deductSmallParts: number;
  unitPrice: number;
  totalPrice: number;
  remark: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

/** 接口字段可能是 string，统一安全格式化 */
function formatFixed(val: unknown, digits = 2): string {
  if (val == null || val === '') return '';
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(digits) : String(val);
}

function formatLocale(val: unknown): string {
  if (val == null || val === '') return '';
  const n = Number(val);
  return Number.isFinite(n) ? n.toLocaleString() : String(val);
}

const FILTER_FIELDS = [
  { key: 'settlementStatus', label: '结账情况' },
  { key: 'code', label: '编号' },
  { key: 'returnDate', label: '回车日期' },
  { key: 'weighDate', label: '过磅日期' },
  { key: 'plateNumber', label: '车牌号' },
  { key: 'vehicleType', label: '车辆类型' },
  { key: 'vehicleModel', label: '车辆型号' },
  { key: 'supplier', label: '供应商' },
  { key: 'salesperson', label: '业务员' },
  { key: 'returnLocation', label: '回车地' },
  { key: 'tonnage', label: '吨位' },
  { key: 'unitPrice', label: '单价' },
  { key: 'totalPrice', label: '总价' },
  { key: 'remark', label: '备注' },
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FILTER_FIELDS.map(({ key, label }) => [key, label]),
);

function settlementStatusLabel(val: unknown) {
  if (val === 'settled') return '已结账';
  if (val === 'unsettled') return '未结账';
  return String(val ?? '');
}

function settlementRecordKey(record: Pick<SettlementItem, 'id' | 'dataId'> | null | undefined) {
  if (!record) return undefined;
  if (record.dataId) return String(record.dataId);
  if (record.id != null) return String(record.id);
  return undefined;
}

function buildChangeSummary(before: SettlementItem | null, after: Record<string, unknown>) {
  if (!before) {
    return `创建业务结账：${after.code || ''} ${after.plateNumber || ''}`.trim();
  }
  const keys = Object.keys(FIELD_LABELS);
  const parts: string[] = [];
  keys.forEach((key) => {
    const prev = (before as unknown as Record<string, unknown>)[key];
    const next = after[key];
    const prevStr = key === 'settlementStatus' ? settlementStatusLabel(prev) : String(prev ?? '');
    const nextStr = key === 'settlementStatus' ? settlementStatusLabel(next) : String(next ?? '');
    if (prevStr !== nextStr) {
      parts.push(`${FIELD_LABELS[key]}：${prevStr || '空'} → ${nextStr || '空'}`);
    }
  });
  return parts.length ? parts.join('；') : '保存业务结账（无字段变更）';
}

const baseColumns: ColumnsType<SettlementItem> = [
  {
    title: '结账情况',
    dataIndex: 'settlementStatus',
    width: 100,
    fixed: 'left',
    render: (val: string) => (
      <Tag color={val === 'settled' ? 'green' : 'red'} style={{ borderRadius: 10, padding: '2px 10px' }}>
        {val === 'settled' ? '已结账' : '未结账'}
      </Tag>
    ),
  },
  { title: '编号', dataIndex: 'code', width: 100, fixed: 'left' },
  { title: '回车日期', dataIndex: 'returnDate', width: 110 },
  { title: '过磅日期', dataIndex: 'weighDate', width: 110 },
  { title: '车牌号', dataIndex: 'plateNumber', width: 110 },
  { title: '车辆类型', dataIndex: 'vehicleType', width: 100 },
  { title: '车辆型号', dataIndex: 'vehicleModel', width: 90 },
  { title: '供应商', dataIndex: 'supplier', width: 160, ellipsis: true },
  { title: '业务员', dataIndex: 'salesperson', width: 90 },
  { title: '回车地', dataIndex: 'returnLocation', width: 80 },
  { title: '吨位', dataIndex: 'tonnage', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '铁', dataIndex: 'iron', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '铝', dataIndex: 'aluminum', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '三元', dataIndex: 'ternary', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '电瓶', dataIndex: 'battery', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '公斤差', dataIndex: 'kgDiff', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '扣净重', dataIndex: 'deductNetWeight', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '扣电瓶', dataIndex: 'deductBattery', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '车况较好', dataIndex: 'goodCondition', width: 90, align: 'right', render: (val) => formatFixed(val) },
  { title: '扣两厢', dataIndex: 'deductTwoBox', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '扣面包斗斗', dataIndex: 'deductBreadBox', width: 100, align: 'right', render: (val) => formatFixed(val) },
  { title: '扣铁圈', dataIndex: 'deductIronRing', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '扣柴油', dataIndex: 'deductDiesel', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '自送', dataIndex: 'selfDelivery', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '扣小件', dataIndex: 'deductSmallParts', width: 80, align: 'right', render: (val) => formatFixed(val) },
  { title: '单价', dataIndex: 'unitPrice', width: 90, align: 'right', render: (val) => formatLocale(val) },
  { title: '总价', dataIndex: 'totalPrice', width: 110, align: 'right', render: (val) => formatLocale(val) },
  { title: '备注', dataIndex: 'remark', width: 150, ellipsis: true },
  {
    title: '提交人',
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>,
  },
  { title: '提交时间', dataIndex: 'submitTime', width: 170 },
  { title: '更新时间', dataIndex: 'updateTime', width: 170 },
];

export default function SettlementPage() {
  const isMobile = useIsMobile();
  const [dataSource, setDataSource] = useState<SettlementItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<SettlementItem | null>(null);
  const [metaTick, setMetaTick] = useState(0);
  const [addForm] = Form.useForm();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [importMode, setImportMode] = useState('only_add');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('settlement', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = (res.data?.records || []) as unknown as SettlementItem[];
        const local = keyword ? [] : getLocalBizRows<SettlementItem>('settlement');
        const merged = pageNo === 1 ? mergeLocalRemoteRows(local, remote) : remote.map((r) => {
          const hit = local.find((l) => l.id === r.id);
          return hit || r;
        });
        setDataSource(merged);
        setTotal((res.data?.total || 0) + (keyword ? 0 : local.filter((l) => !remote.some((r) => r.id === l.id)).length));
      } catch {
        if (!cancelled) {
          message.error('业务结账加载失败，请稍后重试');
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

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchValue.trim();
      if (next === keyword) return;
      setPageNo(1);
      setKeyword(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, keyword]);

  const displayData = useMemo(
    () => filterBasicRows(dataSource, searchValue, selectedFields),
    [dataSource, searchValue, selectedFields],
  );

  const handleAdd = () => {
    setEditing(null);
    addForm.resetFields();
    setAddModalOpen(true);
  };

  const handleEdit = (record: SettlementItem) => {
    setEditing(record);
    addForm.setFieldsValue({
      ...record,
      returnDate: record.returnDate ? dayjs(record.returnDate) : undefined,
      weighDate: record.weighDate ? dayjs(record.weighDate) : undefined,
    });
    setAddModalOpen(true);
  };

  const columns: ColumnsType<SettlementItem> = [...baseColumns, makeEditColumn<SettlementItem>(handleEdit)];

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      const operator = user.nickname || user.username || '系统';
      const payload = {
        settlementStatus: (values.settlementStatus || editing?.settlementStatus || 'unsettled') as SettlementItem['settlementStatus'],
        code: values.code || editing?.code || `JZ${Date.now().toString().slice(-6)}`,
        returnDate: values.returnDate?.format?.('YYYY-MM-DD') || values.returnDate || '',
        weighDate: values.weighDate?.format?.('YYYY-MM-DD') || values.weighDate || '',
        plateNumber: values.plateNumber || '',
        vehicleType: values.vehicleType || '',
        vehicleModel: values.vehicleModel || '',
        supplier: values.supplier || '',
        salesperson: values.salesperson || '',
        returnLocation: values.returnLocation || '',
        tonnage: Number(values.tonnage || 0),
        iron: Number(values.iron || 0),
        aluminum: Number(values.aluminum || 0),
        ternary: Number(values.ternary || 0),
        battery: Number(values.battery || 0),
        kgDiff: Number(values.kgDiff || 0),
        deductNetWeight: Number(values.deductNetWeight || 0),
        deductBattery: Number(values.deductBattery || 0),
        goodCondition: Number(values.goodCondition || 0),
        deductTwoBox: Number(values.deductTwoBox || 0),
        deductBreadBox: Number(values.deductBreadBox || 0),
        deductIronRing: Number(values.deductIronRing || 0),
        deductDiesel: Number(values.deductDiesel || 0),
        selfDelivery: Number(values.selfDelivery || 0),
        deductSmallParts: Number(values.deductSmallParts || 0),
        unitPrice: Number(values.unitPrice || 0),
        totalPrice: Number(values.totalPrice || 0),
        remark: values.remark || '',
        submitter: editing?.submitter || operator,
        submitTime: editing?.submitTime || now,
        updateTime: now,
      };
      const summary = buildChangeSummary(editing, payload);
      let saved: SettlementItem;
      if (editing) {
        saved = upsertLocalBizRow<SettlementItem>('settlement', {
          ...payload,
          id: editing.id,
          dataId: editing.dataId,
        });
        message.success('修改成功！');
      } else {
        saved = addLocalBizRow<SettlementItem>('settlement', payload);
        message.success('提交成功！');
      }
      const recordKey = settlementRecordKey(saved);
      if (recordKey) {
        try {
          await appendBizDataLog(BIZ_KEY, recordKey, {
            action: editing ? '更新' : '创建',
            summary,
            operatorName: operator,
          });
          setMetaTick((t) => t + 1);
        } catch {
          // 日志失败不阻断主流程
        }
      }
      setPageNo(1);
      setReloadKey((k) => k + 1);
      setEditing(null);
      setAddModalOpen(false);
    } catch {
      // validation failed
    }
  };

  const handleSaveDraft = () => {
    message.success('草稿保存成功！');
    setAddModalOpen(false);
  };

  const handleImport = () => {
    setImportStep(0);
    setImportMode('only_add');
    setImportFile(null);
    setImportModalOpen(true);
  };

  const handleImportFileChange = (file: File) => {
    setImportFile(file);
  };

  const handleImportNext = () => {
    setImportStep(importStep + 1);
  };

  const handleImportPrev = () => {
    setImportStep(importStep - 1);
  };

  const handleImportComplete = () => {
    message.success('导入成功！');
    setImportModalOpen(false);
  };

  const handleExport = () => {
    message.success('导出成功');
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    deleteLocalBizRows('settlement', selectedRowKeys.map(Number));
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
    setSelectedRowKeys([]);
    setReloadKey((k) => k + 1);
  };

  const metaRecordKey = settlementRecordKey(editing);
  const formMeta = {
    submitter: editing?.submitter || getStoredUser().nickname || getStoredUser().username || '-',
    submitTime: editing?.submitTime || '-',
    updateTime: editing?.updateTime || '-',
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        <div
          style={{
            padding: '8px 16px',
            background: '#fffbe6',
            color: '#ad6800',
            borderBottom: '1px solid #ffe58f',
          }}
        >
          本页读本地库，打开即可；「同步」仅拉取上次之后的增量，「重新同步所有」才全量拉取。已映射列表全部字段（结账情况～备注）。
        </div>

        {/* 操作工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            gap: 8,
          }}
        >
          <Space wrap>
            <Tooltip title="查验完成后数据自动流转，不可手动新增">
              <Button type="primary" icon={<PlusOutlined />} disabled onClick={handleAdd}>
                添加
              </Button>
            </Tooltip>
            <BusinessJdySyncButtons
              syncFn={syncJdySettlement}
              onSynced={() => {
                setPageNo(1);
                setReloadKey((k) => k + 1);
              }}
            />
            <Button onClick={() => setLinkModalOpen(true)}>从过磅/收货带入</Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              导入
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>
              删除
            </Button>
          </Space>
          <BasicFuzzyFilter
            fields={FILTER_FIELDS}
            keyword={searchValue}
            onKeywordChange={setSearchValue}
            selectedFields={selectedFields}
            onSelectedFieldsChange={(next) => {
              setSelectedFields(next);
              setPageNo(1);
            }}
            inputWidth={isMobile ? '100%' : 200}
          />
        </div>

        {/* 数据表格 */}
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={displayData}
            loading={loading}
            scroll={{ x: 2800 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={withMobilePagination(isMobile, {
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
              onShowSizeChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
            })}
          />
        </div>
      </Card>

      {/* 添加 / 编辑业务结账弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => {
          setEditing(null);
          setAddModalOpen(false);
        }}
        width={isMobile ? '100%' : 1100}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' } }}
        footer={
          <div style={{ display: 'flex', gap: 16 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleAddSubmit}
              style={{ flex: 1, background: '#00a884', borderColor: '#00a884', height: 44 }}
            >
              提交
            </Button>
            <Button size="large" onClick={handleSaveDraft} style={{ flex: 1, height: 44 }}>
              保存草稿
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, padding: '16px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
                {editing ? '编辑业务结账' : '业务结账'}
              </span>
              <Space>
                <ExpandOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
                <span
                  onClick={() => {
                    setEditing(null);
                    setAddModalOpen(false);
                  }}
                  style={{ fontSize: 18, cursor: 'pointer', color: '#999', lineHeight: '20px' }}
                >
                  ×
                </span>
              </Space>
            </div>

            <Form form={addForm} layout="vertical" initialValues={{ settlementStatus: 'unsettled' }}>
              <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
                结账情况
              </Divider>

              <Form.Item name="settlementStatus" label="结账情况">
                <Radio.Group>
                  <Radio value="settled">已结账</Radio>
                  <Radio value="unsettled">未结账</Radio>
                </Radio.Group>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="code" label="编号" rules={[{ required: true, message: '请选择编号' }]}>
                    <Select placeholder="请选择" allowClear showSearch optionFilterProp="children">
                      {dataSource.map((item) => (
                        <Select.Option key={item.id} value={item.code}>{item.code}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="returnDate" label="回车日期" rules={[{ required: true, message: '请选择回车日期' }]}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="weighDate" label="过磅日期" rules={[{ required: true, message: '请选择过磅日期' }]}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
                    <Input placeholder="请输入车牌号" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="vehicleType" label="车辆类型" rules={[{ required: true, message: '请输入车辆类型' }]}>
                    <Input placeholder="请输入车辆类型" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="vehicleModel" label="车辆型号">
                    <DictSelect dict="vehicleModel" placeholder="请选择车辆型号（基础资料）" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="supplier" label="供应商">
                    <DictSelect
                      dict="supplier"
                      placeholder="请选择供应商（基础资料）"
                      onChange={(v) => addForm.setFieldsValue({ supplier: v })}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="salesperson" label="业务员">
                    <DictSelect dict="salesman" placeholder="请选择业务员（基础资料）" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="returnLocation" label="回车地">
                    <Input placeholder="请输入回车地" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
                吨位分解
              </Divider>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)', gap: '0 16px' }}>
                <Form.Item name="tonnage" label="吨位" rules={[{ required: true, message: '请输入吨位' }]}>
                  <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                </Form.Item>
                <Form.Item name="iron" label="铁">
                  <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                </Form.Item>
                <Form.Item name="aluminum" label="铝">
                  <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                </Form.Item>
                <Form.Item name="ternary" label="三元">
                  <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                </Form.Item>
                <Form.Item name="battery" label="电瓶">
                  <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                </Form.Item>
              </div>

              <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
                车辆情况
              </Divider>

              <Row gutter={16}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="kgDiff" label="公斤差">
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="deductNetWeight" label="扣净重">
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="deductBattery" label="扣电瓶">
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="goodCondition" label="车况较好">
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="deductTwoBox" label="扣两厢">
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="deductBreadBox" label="扣面包斗斗">
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="deductIronRing" label="扣铁圈">
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="deductDiesel" label="扣柴油">
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="selfDelivery" label="自送">
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="deductSmallParts" label="扣小件">
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="unitPrice" label="单价" rules={[{ required: true, message: '请输入单价' }]}>
                    <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={1} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="totalPrice" label="总价">
                    <InputNumber style={{ width: '100%' }} placeholder="暂无内容" disabled min={0} step={1} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注内容" />
              </Form.Item>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 24,
                  padding: '12px 0 20px',
                  borderTop: '1px solid #f0f0f0',
                  color: '#666',
                  fontSize: 13,
                }}
              >
                <span>
                  <span style={{ color: '#999' }}>提交人</span>
                  <span style={{ marginLeft: 8, color: '#1890ff' }}>{formMeta.submitter}</span>
                </span>
                <span>
                  <span style={{ color: '#999' }}>提交时间</span>
                  <span style={{ marginLeft: 8 }}>{formMeta.submitTime}</span>
                </span>
                <span>
                  <span style={{ color: '#999' }}>更新时间</span>
                  <span style={{ marginLeft: 8 }}>{formMeta.updateTime}</span>
                </span>
              </div>
            </Form>
          </div>

          {!isMobile && (
            <div style={{ width: 280, flexShrink: 0 }} key={`${metaRecordKey || 'new'}-${metaTick}`}>
              <BizRecordSidePanel bizKey={BIZ_KEY} recordKey={metaRecordKey} height={520} />
            </div>
          )}
        </div>
      </Modal>

      {/* 导入Excel数据弹窗 */}
      <Modal
        title={null}
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        width={900}
        closable={false}
        centered
        styles={{ body: { padding: 0 } }}
        footer={null}
      >
        <div style={{ padding: '16px 24px 24px' }}>
          {/* 标题栏 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
              导入 Excel 数据
            </span>
            <Space>
              <ExpandOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
              <span
                onClick={() => setImportModalOpen(false)}
                style={{
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#999',
                  lineHeight: '20px',
                }}
              >
                ×
              </span>
            </Space>
          </div>

          {/* 步骤条 */}
          <Steps
            current={importStep}
            items={[
              { title: '选择Excel' },
              { title: '预览数据' },
              { title: '配置表单' },
              { title: '导入数据' },
            ]}
            style={{ marginBottom: 24 }}
          />

          {/* 导入模式 */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 12, color: '#666' }}>导入模式</span>
            <Select
              value={importMode}
              onChange={setImportMode}
              style={{ width: 200 }}
              options={[
                { value: 'only_add', label: '仅新增数据' },
                { value: 'update', label: '更新已有数据' },
                { value: 'overwrite', label: '覆盖所有数据' },
              ]}
            />
          </div>

          {/* 提示信息 */}
          <div
            style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 4,
              padding: '12px 16px',
              marginBottom: 16,
            }}
          >
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 13 }}>
              <li>
                支持 20MB 的xlsx格式文件或 5MB 的xls格式文件，行数不超过10万行，列数不超过500列，推荐使用
                <a style={{ color: '#1890ff' }}>标准模板</a>
              </li>
              <li>若导入存在部门成员字段，则不能超过1万行</li>
              <li>
                更多导入说明和示例，请查看
                <a style={{ color: '#1890ff' }}>帮助文档</a>
              </li>
            </ul>
          </div>

          {/* 文件上传区域 */}
          {importStep === 0 && (
            <Upload.Dragger
              name="file"
              multiple={false}
              beforeUpload={(file) => {
                handleImportFileChange(file);
                return false;
              }}
              showUploadList={true}
              fileList={
                importFile
                  ? [{ uid: '-1', name: importFile.name, status: 'done' as const }]
                  : []
              }
              onRemove={() => {
                setImportFile(null);
              }}
              style={{
                borderStyle: 'dashed',
                borderColor: '#d9d9d9',
                borderRadius: 4,
                padding: '40px 0',
              }}
            >
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              </p>
              <p className="ant-upload-text">将文件拖拽到此区域，或点击添加</p>
              <p className="ant-upload-hint" style={{ color: '#999' }}>
                支持 .xlsx 和 .xls 格式文件
              </p>
            </Upload.Dragger>
          )}

          {importStep === 1 && (
            <div
              style={{
                border: '1px dashed #d9d9d9',
                borderRadius: 4,
                padding: 40,
                textAlign: 'center',
                color: '#999',
              }}
            >
              数据预览区域（请选择Excel文件后查看）
            </div>
          )}

          {importStep === 2 && (
            <div
              style={{
                border: '1px dashed #d9d9d9',
                borderRadius: 4,
                padding: 40,
                textAlign: 'center',
                color: '#999',
              }}
            >
              表单配置区域（请选择Excel文件后配置）
            </div>
          )}

          {importStep === 3 && (
            <div
              style={{
                border: '1px dashed #d9d9d9',
                borderRadius: 4,
                padding: 40,
                textAlign: 'center',
                color: '#999',
              }}
            >
              开始导入数据（请选择Excel文件后导入）
            </div>
          )}

          {/* 底部按钮 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <Button onClick={() => setImportModalOpen(false)}>取消</Button>
            {importStep > 0 && (
              <Button onClick={handleImportPrev}>上一步</Button>
            )}
            {importStep < 3 && (
              <Button
                type="primary"
                onClick={handleImportNext}
                disabled={importStep === 0 && !importFile}
              >
                下一步
              </Button>
            )}
            {importStep === 3 && (
              <Button
                type="primary"
                onClick={handleImportComplete}
                style={{ background: '#00a884', borderColor: '#00a884' }}
              >
                确认导入
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <BizLinkDataModal
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        sources={['weighing-inspection', 'receipt']}
        title="从过磅查验 / 业务收货带入"
        onSelect={(row) => {
          addForm.setFieldsValue({
            ...mapLinkedRowToFormValues(row),
            plateNumber: row.plateNumber,
            supplier: row.supplier,
            salesperson: row.salesperson,
            vehicleModel: row.vehicleModel,
            vehicleType: row.vehicleType,
          });
          setLinkModalOpen(false);
          setAddModalOpen(true);
        }}
      />
    </div>
  );
}
