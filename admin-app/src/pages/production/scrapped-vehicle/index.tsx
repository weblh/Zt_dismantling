import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Dropdown,
  message,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Radio,
  Select,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  MoreOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import BizFormMetaFooter, { bizRecordKey } from '@/components/BizFormMetaFooter';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import DictSelect from '@/components/DictSelect';
import { makeEditColumn } from '@/components/TableEditColumn';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { getJdyBusinessData, syncJdyScrappedVehicle } from '@/api/jdy';
import {
  addLocalBizRow,
  formatBizDateTime,
  getLocalBizRows,
  mergeLocalRemoteRows,
  upsertLocalBizRow,
} from '@/utils/localBizStore';
import { getStoredUser } from '@/config/apps';

const BIZ_KEY = 'scrapped-vehicle';

interface ScrappedVehicleItem {
  id: number;
  dataId?: string;
  entryCode: string;
  negotiation: string;
  weighDate: string;
  netWeight: number | string;
  supplier: string;
  vehicleType: string;
  vehicleModel: string;
  weighmaster: string;
  flatten: string;
  operation: string;
  bLevel: string;
  iron: number | string;
  aluminum: number | string;
  ternary: number | string;
  battery: number | string;
  tire: number | string;
  remark: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

/** 过磅查验编号选项（选中后带入全字段） */
interface WeighInspectionOption {
  value: string;
  label: string;
  negotiation?: string;
  weighDate?: string;
  tonnage?: number | string;
  supplier?: string;
  vehicleType?: string;
  vehicleModel?: string;
  weighmaster?: string;
  flatten?: string;
  operation?: string;
  bLevel?: string;
  iron?: number | string;
  aluminum?: number | string;
  ternary?: number | string;
  battery?: number | string;
  tire?: number | string;
  remark?: string;
}

const FILTER_FIELDS = [
  { key: 'entryCode', label: '入场编号' },
  { key: 'negotiation', label: '销户/议价' },
  { key: 'weighDate', label: '过磅日期' },
  { key: 'netWeight', label: '净重' },
  { key: 'supplier', label: '供应商' },
  { key: 'vehicleType', label: '车辆类型' },
  { key: 'vehicleModel', label: '车辆型号' },
  { key: 'weighmaster', label: '司磅员' },
  { key: 'flatten', label: '压扁' },
  { key: 'operation', label: '营运' },
  { key: 'bLevel', label: 'B级' },
  { key: 'iron', label: '铁' },
  { key: 'aluminum', label: '铝' },
  { key: 'ternary', label: '三元' },
  { key: 'battery', label: '电瓶' },
  { key: 'tire', label: '轮胎' },
  { key: 'remark', label: '备注' },
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FILTER_FIELDS.map(({ key, label }) => [key, label]),
);

function renderMarkOrText(val: unknown) {
  if (val == null || val === '') return '-';
  const s = String(val);
  if (s === '√' || s === '✓' || s === '✔' || s === '议价' || s === '是') {
    return <CheckOutlined style={{ color: '#52c41a' }} />;
  }
  if (s === '×' || s === '✕' || s === '✖' || s === 'x' || s === 'X' || s === '否') {
    return <span style={{ color: '#999' }}>×</span>;
  }
  return s;
}

function renderYesNo(val: unknown) {
  if (val == null || val === '') return '';
  const s = String(val);
  if (s === '是' || s === '√' || s === '✓') return '是';
  if (s === '否' || s === '×') return '否';
  return s;
}

function renderNumOrMark(val: unknown) {
  if (val == null || val === '') return '-';
  const n = Number(val);
  if (Number.isFinite(n) && String(val).trim() !== '' && !Number.isNaN(n) && /^-?\d+(\.\d+)?$/.test(String(val).trim())) {
    return <span style={{ textAlign: 'right', display: 'block' }}>{n.toFixed(2)}</span>;
  }
  return renderMarkOrText(val);
}

function buildChangeSummary(before: ScrappedVehicleItem | null, after: Record<string, unknown>) {
  if (!before) {
    return `创建报废车入库：${after.entryCode || ''} ${after.supplier || ''}`.trim();
  }
  const parts: string[] = [];
  Object.keys(FIELD_LABELS).forEach((key) => {
    const prevStr = String((before as unknown as Record<string, unknown>)[key] ?? '');
    const nextStr = String(after[key] ?? '');
    if (prevStr !== nextStr) {
      parts.push(`${FIELD_LABELS[key]}：${prevStr || '空'} → ${nextStr || '空'}`);
    }
  });
  return parts.length ? parts.join('；') : '保存报废车入库（无字段变更）';
}

function toWeighInspectionOption(row: Record<string, unknown>): WeighInspectionOption | null {
  const code = String(row.code || row.entryCode || '').trim();
  if (!code) return null;
  const tonnage = row.tonnage ?? row.netWeight;
  return {
    value: code,
    label: code,
    negotiation: row.negotiation != null ? String(row.negotiation) : undefined,
    weighDate: row.weighDate != null ? String(row.weighDate) : undefined,
    tonnage: tonnage as number | string | undefined,
    supplier: row.supplier != null ? String(row.supplier) : undefined,
    vehicleType: row.vehicleType != null ? String(row.vehicleType) : undefined,
    vehicleModel: row.vehicleModel != null ? String(row.vehicleModel) : undefined,
    weighmaster: row.weighmaster != null ? String(row.weighmaster) : undefined,
    flatten: row.flatten != null ? String(row.flatten) : undefined,
    operation: row.operation != null ? String(row.operation) : undefined,
    bLevel: row.bLevel != null ? String(row.bLevel) : undefined,
    iron: row.iron as number | string | undefined,
    aluminum: row.aluminum as number | string | undefined,
    ternary: row.ternary as number | string | undefined,
    battery: row.battery as number | string | undefined,
    tire: row.tire as number | string | undefined,
    remark: row.remark != null ? String(row.remark) : undefined,
  };
}

const baseColumns: ColumnsType<ScrappedVehicleItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>, dataIndex: 'entryCode', width: 100, fixed: 'left' },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>销户/议价</span>,
    dataIndex: 'negotiation',
    width: 100,
    fixed: 'left',
    render: (val: string) => renderMarkOrText(val),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'weighDate', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>净重</span>,
    dataIndex: 'netWeight',
    width: 90,
    render: (val: number | string) => renderNumOrMark(val),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>供应商</span>, dataIndex: 'supplier', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 100 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>司磅员</span>,
    dataIndex: 'weighmaster',
    width: 100,
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val || '-'}</span>
    ),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>压扁</span>,
    dataIndex: 'flatten',
    width: 70,
    render: (val: string) => renderYesNo(val),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>营运</span>,
    dataIndex: 'operation',
    width: 70,
    render: (val: string) => renderYesNo(val),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>B级</span>,
    dataIndex: 'bLevel',
    width: 70,
    render: (val: string) => renderYesNo(val),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>, dataIndex: 'iron', width: 80, render: renderNumOrMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>, dataIndex: 'aluminum', width: 80, render: renderNumOrMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>, dataIndex: 'ternary', width: 80, render: renderNumOrMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>, dataIndex: 'battery', width: 80, render: renderNumOrMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>轮胎</span>, dataIndex: 'tire', width: 80, render: renderNumOrMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>备注</span>, dataIndex: 'remark', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val || '-'}</span>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
];

function mapRemoteRow(row: Record<string, unknown>): ScrappedVehicleItem {
  return {
    id: Number(row.id),
    dataId: row.dataId != null ? String(row.dataId) : undefined,
    entryCode: String(row.entryCode || ''),
    negotiation: String(row.negotiation ?? ''),
    weighDate: String(row.weighDate || ''),
    netWeight: (row.netWeight as number | string) ?? '',
    supplier: String(row.supplier || ''),
    vehicleType: String(row.vehicleType || ''),
    vehicleModel: String(row.vehicleModel || ''),
    weighmaster: String(row.weighmaster || ''),
    flatten: String(row.flatten || ''),
    operation: String(row.operation || ''),
    bLevel: String(row.bLevel || ''),
    iron: (row.iron as number | string) ?? '',
    aluminum: (row.aluminum as number | string) ?? '',
    ternary: (row.ternary as number | string) ?? '',
    battery: (row.battery as number | string) ?? '',
    tire: (row.tire as number | string) ?? '',
    remark: String(row.remark || ''),
    submitter: String(row.submitter || ''),
    submitTime: String(row.submitTime || ''),
    updateTime: String(row.updateTime || ''),
  };
}

export default function ScrappedVehicle() {
  const isMobile = useIsMobile();
  const [dataSource, setDataSource] = useState<ScrappedVehicleItem[]>([]);
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
  const [editing, setEditing] = useState<ScrappedVehicleItem | null>(null);
  const [metaTick, setMetaTick] = useState(0);
  const [form] = Form.useForm();
  const [inspectionOptionsLoading, setInspectionOptionsLoading] = useState(false);
  const [inspectionOptions, setInspectionOptions] = useState<WeighInspectionOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('scrapped-vehicle', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = ((res.data?.records || []) as Record<string, unknown>[]).map(mapRemoteRow);
        const local = keyword
          ? []
          : getLocalBizRows<ScrappedVehicleItem>('scrapped-vehicle');
        const merged =
          pageNo === 1
            ? mergeLocalRemoteRows(local, remote)
            : remote.map((r) => local.find((l) => l.id === r.id) || r);
        setDataSource(merged);
        setTotal(
          (res.data?.total || 0) +
            (keyword ? 0 : local.filter((l) => !remote.some((r) => r.id === l.id)).length),
        );
      } catch {
        if (!cancelled) {
          message.error('报废车入库加载失败，请稍后重试');
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

  const loadInspectionOptions = async () => {
    setInspectionOptionsLoading(true);
    try {
      const map = new Map<string, WeighInspectionOption>();
      const push = (row: Record<string, unknown>) => {
        const opt = toWeighInspectionOption(row);
        if (opt) map.set(opt.value, opt);
      };
      getLocalBizRows<Record<string, unknown>>('weighing-inspection').forEach(push);
      const res = await getJdyBusinessData('weighing-inspection', {
        pageNo: 1,
        pageSize: 500,
      });
      ((res.data?.records || []) as Record<string, unknown>[]).forEach(push);
      setInspectionOptions(Array.from(map.values()));
    } catch {
      message.warning('过磅查验编号加载失败，可手动填写或稍后重试');
      setInspectionOptions([]);
    } finally {
      setInspectionOptionsLoading(false);
    }
  };

  const entryCodeSelectOptions = useMemo(() => {
    const list = [...inspectionOptions];
    const current = editing?.entryCode?.trim();
    if (current && !list.some((o) => o.value === current)) {
      list.unshift({
        value: current,
        label: current,
        negotiation: editing?.negotiation,
        weighDate: editing?.weighDate,
        tonnage: editing?.netWeight,
        supplier: editing?.supplier,
        vehicleType: editing?.vehicleType,
        vehicleModel: editing?.vehicleModel,
        weighmaster: editing?.weighmaster,
        flatten: editing?.flatten,
        operation: editing?.operation,
        bLevel: editing?.bLevel,
        iron: editing?.iron,
        aluminum: editing?.aluminum,
        ternary: editing?.ternary,
        battery: editing?.battery,
        tire: editing?.tire,
        remark: editing?.remark,
      });
    }
    return list;
  }, [inspectionOptions, editing]);

  const handleEntryCodeChange = (code: string | undefined) => {
    if (!code) return;
    const hit = entryCodeSelectOptions.find((o) => o.value === code);
    if (!hit) return;
    const weighDate = hit.weighDate ? dayjs(String(hit.weighDate)) : undefined;
    const tonnage = hit.tonnage;
    const patch: Record<string, unknown> = {
      entryCode: code,
      negotiation: hit.negotiation ?? undefined,
      weighDate: weighDate?.isValid() ? weighDate : undefined,
      netWeight: tonnage != null && tonnage !== '' ? Number(tonnage) : undefined,
      supplier: hit.supplier ?? undefined,
      vehicleType: hit.vehicleType ?? undefined,
      vehicleModel: hit.vehicleModel ?? undefined,
      flatten: hit.flatten ?? undefined,
      operation: hit.operation ?? undefined,
      bLevel: hit.bLevel ?? undefined,
      iron: hit.iron ?? undefined,
      aluminum: hit.aluminum ?? undefined,
      ternary: hit.ternary ?? undefined,
      battery: hit.battery ?? undefined,
      tire: hit.tire ?? undefined,
      remark: hit.remark ?? undefined,
    };
    // 司磅员：源有则带入，否则保留手动值
    if (hit.weighmaster) {
      patch.weighmaster = hit.weighmaster;
    }
    form.setFieldsValue(patch);
  };

  const handleAdd = () => {
    setEditing(null);
    setAddModalOpen(true);
    form.resetFields();
    void loadInspectionOptions();
  };

  const handleEdit = (record: ScrappedVehicleItem) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      weighDate: record.weighDate ? dayjs(record.weighDate) : undefined,
    });
    setAddModalOpen(true);
    void loadInspectionOptions();
  };

  const columns: ColumnsType<ScrappedVehicleItem> = [
    ...baseColumns.map((col) => {
      if ('dataIndex' in col && col.dataIndex === 'entryCode') {
        return {
          ...col,
          render: (val: string, record: ScrappedVehicleItem) => (
            <span
              style={{ color: '#1890ff', cursor: 'pointer' }}
              onClick={() => handleEdit(record)}
            >
              {val || '-'}
            </span>
          ),
        };
      }
      return col;
    }),
    makeEditColumn<ScrappedVehicleItem>(handleEdit),
  ];

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      const operator = user.nickname || user.username || '系统';
      const weighDate =
        values.weighDate && dayjs.isDayjs(values.weighDate)
          ? values.weighDate.format('YYYY-MM-DD')
          : String(values.weighDate || '');
      const payload = {
        entryCode: values.entryCode || editing?.entryCode || `RK${Date.now()}`,
        negotiation: values.negotiation || '',
        weighDate,
        netWeight: values.netWeight ?? '',
        supplier: values.supplier || '',
        vehicleType: values.vehicleType || '',
        vehicleModel: values.vehicleModel || '',
        weighmaster: values.weighmaster || '',
        flatten: values.flatten || '',
        operation: values.operation || '',
        bLevel: values.bLevel || '',
        iron: values.iron ?? '',
        aluminum: values.aluminum ?? '',
        ternary: values.ternary ?? '',
        battery: values.battery ?? '',
        tire: values.tire ?? '',
        remark: values.remark || '',
        submitter: editing?.submitter || operator,
        submitTime: editing?.submitTime || now,
        updateTime: now,
      };
      const summary = buildChangeSummary(editing, payload);
      let saved: ScrappedVehicleItem;
      if (editing) {
        saved = upsertLocalBizRow<ScrappedVehicleItem>('scrapped-vehicle', {
          ...payload,
          id: editing.id,
          dataId: editing.dataId,
        });
        message.success('修改成功');
      } else {
        saved = addLocalBizRow<ScrappedVehicleItem>('scrapped-vehicle', payload);
        message.success('入库完成，已写入列表（本地）');
      }
      const recordKey = bizRecordKey(saved);
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
      form.resetFields();
    } catch {
      message.error('请填写完整信息');
    }
  };

  const handleImport = () => {
    message.info('导入功能开发中');
  };

  const handleExport = () => {
    message.success('导出成功');
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    message.info('简道云同步数据请在简道云中删除');
  };

  const moreMenuItems = [
    { key: 'batchUpdate', label: '批量更新' },
    { key: 'batchDelete', label: '批量删除' },
    { key: 'exportAll', label: '导出全部' },
  ];

  const metaRecordKey = bizRecordKey(editing);
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <BusinessJdySyncButtons
              syncFn={syncJdyScrappedVehicle}
              onSynced={() => {
                setPageNo(1);
                setReloadKey((k) => k + 1);
              }}
            />
            <Button icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
            <Dropdown menu={{ items: moreMenuItems }}>
              <Button>
                <MoreOutlined />
              </Button>
            </Dropdown>
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

      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => {
          setEditing(null);
          setAddModalOpen(false);
        }}
        width={isMobile ? '100%' : 1280}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto', overflowX: 'hidden' } }}
        footer={null}
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '16px 16px 0' : '16px 28px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
                {editing ? '编辑报废车入库' : '报废车入库'}
              </span>
              <span
                onClick={() => {
                  setEditing(null);
                  setAddModalOpen(false);
                }}
                style={{ fontSize: 18, cursor: 'pointer', color: '#999', lineHeight: '20px' }}
              >
                ×
              </span>
            </div>

            <Form form={form} layout="vertical" requiredMark>
              <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
                入场编号：从过磅查验选择后自动带入字段
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
                <Form.Item
                  label="入场编号"
                  name="entryCode"
                  rules={[{ required: true, message: '请选择入场编号' }]}
                >
                  <Select
                    showSearch
                    allowClear
                    loading={inspectionOptionsLoading}
                    placeholder="搜索过磅查验编号"
                    options={entryCodeSelectOptions}
                    optionFilterProp="label"
                    onChange={handleEntryCodeChange}
                    notFoundContent={inspectionOptionsLoading ? '加载中…' : '暂无过磅查验编号'}
                  />
                </Form.Item>

                <Form.Item label="销户/议价" name="negotiation">
                  <Input placeholder="选择编号后带入" />
                </Form.Item>

                <Form.Item
                  label="过磅日期"
                  name="weighDate"
                  rules={[{ required: true, message: '请选择过磅日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} placeholder="选择编号后带入" />
                </Form.Item>

                <Form.Item
                  label="净重"
                  name="netWeight"
                  rules={[{ required: true, message: '请输入净重' }]}
                >
                  <InputNumber
                    placeholder="选择编号后带入"
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    step={0.01}
                  />
                </Form.Item>

                <Form.Item
                  label="供应商"
                  name="supplier"
                  rules={[{ required: true, message: '请选择供应商' }]}
                >
                  <DictSelect dict="supplier" placeholder="选择编号后带入 / 基础资料" />
                </Form.Item>

                <Form.Item
                  label="车辆类型"
                  name="vehicleType"
                  rules={[{ required: true, message: '请输入车辆类型' }]}
                >
                  <Input placeholder="选择编号后带入" />
                </Form.Item>

                <Form.Item label="车辆型号" name="vehicleModel">
                  <DictSelect dict="vehicleModel" placeholder="选择编号后带入 / 基础资料" />
                </Form.Item>

                <Form.Item
                  label="司磅员"
                  name="weighmaster"
                  rules={[{ required: true, message: '请选择司磅员' }]}
                >
                  <DictSelect dict="staff" placeholder="请选择司磅员（生产人员）" />
                </Form.Item>
              </div>

              <div style={{ margin: '12px 0 8px', color: '#666', fontSize: 13 }}>
                下方字段：选择过磅查验后可带入，亦可手动调整
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '0 16px' }}>
                <Form.Item label="压扁" name="flatten">
                  <Radio.Group>
                    <Radio value="是">是</Radio>
                    <Radio value="否">否</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item label="营运" name="operation">
                  <Radio.Group>
                    <Radio value="是">是</Radio>
                    <Radio value="否">否</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item label="B级" name="bLevel">
                  <Radio.Group>
                    <Radio value="是">是</Radio>
                    <Radio value="否">否</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr', gap: '0 16px', marginTop: 8 }}>
                <Form.Item label="铁" name="iron">
                  <Input placeholder="数值或标记" />
                </Form.Item>

                <Form.Item label="铝" name="aluminum">
                  <Input placeholder="数值或标记" />
                </Form.Item>

                <Form.Item label="三元" name="ternary">
                  <Input placeholder="数值或 √ / ×" />
                </Form.Item>

                <Form.Item label="电瓶" name="battery">
                  <Input placeholder="数值或 √ / ×" />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 3fr', gap: '0 16px', marginTop: 8 }}>
                <Form.Item label="轮胎" name="tire">
                  <Input placeholder="数值或标记" />
                </Form.Item>

                <Form.Item label="备注" name="remark">
                  <Input.TextArea placeholder="请输入" rows={2} />
                </Form.Item>
              </div>

              <BizFormMetaFooter
                submitter={formMeta.submitter}
                submitTime={formMeta.submitTime}
                updateTime={formMeta.updateTime}
              />

              <Form.Item style={{ marginTop: 8, marginBottom: 16 }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleAddSubmit}
                  style={{
                    width: 160,
                    background: '#52c41a',
                    borderColor: '#52c41a',
                    height: 48,
                    fontSize: 16,
                  }}
                >
                  入库完成
                </Button>
              </Form.Item>
            </Form>
          </div>

          {!isMobile && (
            <div style={{ width: 280, flexShrink: 0 }} key={`${metaRecordKey || 'new'}-${metaTick}`}>
              <BizRecordSidePanel bizKey={BIZ_KEY} recordKey={metaRecordKey} height={520} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
