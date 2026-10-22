import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DictSelect from '@/components/DictSelect';
import { makeEditColumn } from '@/components/TableEditColumn';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import BizFormMetaFooter, { bizRecordKey } from '@/components/BizFormMetaFooter';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import { getStoredUser } from '@/config/apps';
import {
  addLocalBizRow,
  deleteLocalBizRows,
  formatBizDateTime,
  getLocalBizRows,
  mergeLocalRemoteRows,
  upsertLocalBizRow,
} from '@/utils/localBizStore';
import { getJdyBusinessData, syncJdyWeighingInspection } from '@/api/jdy';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import dayjs from 'dayjs';

const BIZ_KEY = 'weighing-inspection';

/** 过磅同步：待同步编号 → 吨位 */
interface PendingSyncOption {
  value: string;
  label: string;
  tonnage: number | undefined;
  negotiation: string;
}

/** 业务收货车牌（排除已进业务结账的） */
interface ReceiptPlateOption {
  value: string;
  label: string;
  supplier: string;
  returnLocation: string;
  datetime: string;
}

function normalizeSyncStatus(val: unknown): '0' | '1' {
  const s = String(val ?? '').trim();
  if (s === '1' || s === '待同步') return '1';
  return '0';
}

function normalizePlate(val: unknown): string {
  return String(val ?? '').trim().toUpperCase();
}

function parseReceiptDate(val: unknown) {
  if (!val) return undefined;
  const d = dayjs(String(val));
  return d.isValid() ? d : undefined;
}

function mapNegotiation(val: unknown): string {
  const s = String(val ?? '').trim();
  if (!s) return '销户';
  if (s === '议价' || s.includes('议')) return '议价';
  return '销户';
}

interface WeighingInspectionItem {
  id: number;
  dataId?: string;
  code: string;
  negotiation: string;
  weighDate: string;
  plateNumber: string;
  returnDate: string;
  vehicleType: string;
  vehicleModel: string;
  supplier: string;
  salesperson: string;
  returnLocation: string;
  tonnage: number;
  flatten: string;
  operation: string;
  bLevel: string;
  iron: number;
  aluminum: number;
  /** 是/否（勾选控件，非数值） */
  ternary: string;
  /** 是/否（勾选控件，非数值） */
  battery: string;
  tire: number;
  remark: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const FILTER_FIELDS = [
  { key: 'code', label: '编号' },
  { key: 'negotiation', label: '销户/议价' },
  { key: 'weighDate', label: '过磅日期' },
  { key: 'plateNumber', label: '车牌号' },
  { key: 'returnDate', label: '回车日期' },
  { key: 'vehicleType', label: '车辆类型' },
  { key: 'vehicleModel', label: '车辆型号' },
  { key: 'supplier', label: '供应商' },
  { key: 'salesperson', label: '业务员' },
  { key: 'returnLocation', label: '回车地' },
  { key: 'tonnage', label: '吨位' },
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

function displayChangeValue(key: string, val: unknown): string {
  if (key === 'ternary' || key === 'battery') {
    return normalizeYesNoMark(val);
  }
  if (typeof val === 'number' && Number.isNaN(val)) return '';
  const s = String(val ?? '').trim();
  return s === 'NaN' ? '' : s;
}

function buildChangeSummary(before: WeighingInspectionItem | null, after: Record<string, unknown>) {
  if (!before) {
    return `创建过磅查验：${after.code || ''} ${after.plateNumber || ''}`.trim();
  }
  const parts: string[] = [];
  Object.keys(FIELD_LABELS).forEach((key) => {
    const prevStr = displayChangeValue(key, (before as unknown as Record<string, unknown>)[key]);
    const nextStr = displayChangeValue(key, after[key]);
    if (prevStr !== nextStr) {
      parts.push(`${FIELD_LABELS[key]}：${prevStr || '空'} → ${nextStr || '空'}`);
    }
  });
  return parts.length ? parts.join('；') : '保存过磅查验（无字段变更）';
}

const baseColumns: ColumnsType<WeighingInspectionItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>, dataIndex: 'code', width: 100, fixed: 'left' },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>销户/议价</span>,
    dataIndex: 'negotiation',
    width: 100,
    fixed: 'left',
    render: (val: string) => (
      <span style={{ color: val === '议价' ? '#fa8c16' : '#52c41a' }}>
        {val === '议价' ? '议价' : '×'}
      </span>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'weighDate', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车牌号</span>, dataIndex: 'plateNumber', width: 130 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>回车日期</span>, dataIndex: 'returnDate', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>供应商</span>, dataIndex: 'supplier', width: 160, ellipsis: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>业务员</span>, dataIndex: 'salesperson', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>回车地</span>, dataIndex: 'returnLocation', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>吨位</span>, dataIndex: 'tonnage', width: 80, align: 'right', render: formatAmount },
  { title: <span style={{ whiteSpace: 'nowrap' }}>压扁</span>, dataIndex: 'flatten', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>营运</span>, dataIndex: 'operation', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>B级</span>, dataIndex: 'bLevel', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>, dataIndex: 'iron', width: 80, align: 'right', render: formatAmount },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>, dataIndex: 'aluminum', width: 80, align: 'right', render: formatAmount },
  { title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>, dataIndex: 'ternary', width: 80, align: 'center', render: renderYesNoMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>, dataIndex: 'battery', width: 80, align: 'center', render: renderYesNoMark },
  { title: <span style={{ whiteSpace: 'nowrap' }}>轮胎</span>, dataIndex: 'tire', width: 80, align: 'right', render: formatAmount },
  { title: <span style={{ whiteSpace: 'nowrap' }}>备注</span>, dataIndex: 'remark', width: 150, ellipsis: true },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: '2厢40', bg: '#ffccc7' },
  { value: '3厢50', bg: '#ffd8bf' },
  { value: '三厢B级75', bg: '#ffe7ba' },
  { value: '三厢BBA85', bg: '#fff1b8' },
  { value: '面包30', bg: '#f4ffb8' },
  { value: '大面包50', bg: '#d9f7be' },
  { value: '旅行车', bg: '#b5f5ec' },
  { value: '小商务40', bg: '#bae0ff' },
  { value: '商务55', bg: '#d6e4ff' },
  { value: '越野55', bg: '#efdbff' },
  { value: '小越野40', bg: '#ffd6e7' },
  { value: '单排30', bg: '#ffccc7' },
  { value: '双排30', bg: '#ffd8bf' },
  { value: '皮卡40', bg: '#ffe7ba' },
  { value: '轻卡30', bg: '#d9f7be' },
  { value: '客车', bg: '#b5f5ec' },
  { value: '中型客车', bg: '#bae0ff' },
  { value: '重型货车', bg: '#d6e4ff' },
  { value: '摩托20', bg: '#fff1b8' },
  { value: '三轮摩托20', bg: '#ffe58f' },
  { value: '五轮农用车30', bg: '#bae7ff' },
  { value: '箱货40', bg: '#d3adf7' },
  { value: '二轮蹦蹦20', bg: '#ffadd2' },
  { value: '油罐车', bg: '#ffbb96' },
  { value: '自行车15', bg: '#ffd591' },
  { value: '奥拓40', bg: '#ffe58f' },
  { value: '其他', bg: '#d9d9d9' },
];

const KNOWN_VEHICLE_TYPES = new Set(VEHICLE_TYPE_OPTIONS.map((o) => o.value));

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: n, label: String(n) }));

function formatAmount(val: unknown) {
  if (val == null || val === '') return '';
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(2) : String(val);
}

/** 三元/电瓶：MarkField 值为「是/否」，兼容历史 √/×、布尔及误存的 NaN */
function normalizeYesNoMark(val: unknown): string {
  if (val == null || val === '') return '';
  if (typeof val === 'number' && Number.isNaN(val)) return '';
  const s = String(val).trim();
  if (!s || s === 'NaN' || s === 'undefined' || s === 'null') return '';
  if (s === '是' || s === '√' || s === '✓' || s === '✔' || s === 'true' || s === '1') return '是';
  if (s === '否' || s === '×' || s === '✕' || s === '✖' || s === 'x' || s === 'X' || s === 'false' || s === '0') {
    return '否';
  }
  return '';
}

function renderYesNoMark(val: unknown) {
  const mark = normalizeYesNoMark(val);
  if (mark === '是') return <CheckOutlined style={{ color: '#52c41a' }} />;
  if (mark === '否') return <span style={{ color: '#999' }}>×</span>;
  return '';
}

function VehicleTypeField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="weigh-chip-grid">
      {VEHICLE_TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`weigh-chip${value === opt.value ? ' is-active' : ''}`}
          style={{ background: opt.bg }}
          onClick={() => onChange?.(opt.value)}
        >
          {opt.value}
        </button>
      ))}
    </div>
  );
}

function FlagField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="weigh-flag-row">
      {(['是', '否'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          className={`weigh-flag${opt === '否' ? ' is-no' : ''}${value === opt ? ' is-active' : ''}`}
          onClick={() => onChange?.(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MarkField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="weigh-mark-row">
      <button
        type="button"
        className={`weigh-mark is-yes${value === '是' ? ' is-active' : ''}`}
        onClick={() => onChange?.('是')}
        aria-label="是"
      >
        <CheckOutlined />
      </button>
      <button
        type="button"
        className={`weigh-mark is-no${value === '否' ? ' is-active' : ''}`}
        onClick={() => onChange?.('否')}
        aria-label="否"
      >
        <CloseOutlined />
      </button>
    </div>
  );
}

function ScoreSelect(props: React.ComponentProps<typeof Select>) {
  return (
    <Select
      placeholder="请选择"
      options={SCORE_OPTIONS}
      labelRender={(item) => <span className="weigh-score-tag">{item.label}</span>}
      optionRender={(opt) => <span className="weigh-score-tag">{String(opt.label ?? '')}</span>}
      {...props}
    />
  );
}

export default function WeighingInspection() {
  const isMobile = useIsMobile();
  const [dataSource, setDataSource] = useState<WeighingInspectionItem[]>([]);
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
  const [editing, setEditing] = useState<WeighingInspectionItem | null>(null);
  const [metaTick, setMetaTick] = useState(0);
  const [formExpanded, setFormExpanded] = useState(false);
  const [addForm] = Form.useForm();
  const watchedVehicleType = Form.useWatch('vehicleType', addForm);
  const [linkOptionsLoading, setLinkOptionsLoading] = useState(false);
  const [pendingSyncOptions, setPendingSyncOptions] = useState<PendingSyncOption[]>([]);
  const [receiptPlateOptions, setReceiptPlateOptions] = useState<ReceiptPlateOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('weighing-inspection', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = (res.data?.records || []) as unknown as WeighingInspectionItem[];
        const local = keyword ? [] : getLocalBizRows<WeighingInspectionItem>('weighing-inspection');
        const merged = pageNo === 1 ? mergeLocalRemoteRows(local, remote) : remote.map((r) => {
          const hit = local.find((l) => l.id === r.id);
          return hit || r;
        });
        setDataSource(merged);
        setTotal((res.data?.total || 0) + (keyword ? 0 : local.filter((l) => !remote.some((r) => r.id === l.id)).length));
      } catch {
        if (!cancelled) {
          message.error('过磅查验加载失败，请稍后重试');
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

  const toPendingOption = (row: Record<string, unknown>): PendingSyncOption | null => {
    const code = String(row.code || '').trim();
    if (!code) return null;
    if (normalizeSyncStatus(row.status) !== '1') return null;
    const tonnageRaw = row.tonnage;
    const tonnage =
      tonnageRaw == null || tonnageRaw === '' ? undefined : Number(tonnageRaw);
    return {
      value: code,
      label: code,
      tonnage: Number.isFinite(tonnage as number) ? (tonnage as number) : undefined,
      negotiation: mapNegotiation(row.negotiation),
    };
  };

  const mergePendingOptions = (rows: Record<string, unknown>[]) => {
    setPendingSyncOptions((prev) => {
      const map = new Map(prev.map((o) => [o.value, o]));
      rows.forEach((row) => {
        const opt = toPendingOption(row);
        if (opt) map.set(opt.value, opt);
      });
      return Array.from(map.values());
    });
  };

  const loadLinkOptions = async () => {
    setLinkOptionsLoading(true);
    try {
      const pendingMap = new Map<string, PendingSyncOption>();
      const pushPending = (row: Record<string, unknown>) => {
        const opt = toPendingOption(row);
        if (opt) pendingMap.set(opt.value, opt);
      };

      getLocalBizRows<Record<string, unknown>>('weighing-sync').forEach(pushPending);

      // 过磅同步列表按新到旧；待同步通常在前几页，不足再按搜索补
      for (let page = 1; page <= 3; page += 1) {
        const res = await getJdyBusinessData('weighing-sync', { pageNo: page, pageSize: 100 });
        const records = (res.data?.records || []) as Record<string, unknown>[];
        if (records.length === 0) break;
        records.forEach(pushPending);
        if ((page * 100) >= Number(res.data?.total || 0)) break;
      }

      const [receiptRes, settlementRes] = await Promise.all([
        getJdyBusinessData('receipt', { pageNo: 1, pageSize: 500 }),
        getJdyBusinessData('settlement', { pageNo: 1, pageSize: 500 }),
      ]);

      const usedPlates = new Set<string>();
      const markUsed = (row: Record<string, unknown>) => {
        const plate = normalizePlate(row.plateNumber || row.plateNo);
        if (plate) usedPlates.add(plate);
      };
      getLocalBizRows<Record<string, unknown>>('settlement').forEach(markUsed);
      ((settlementRes.data?.records || []) as Record<string, unknown>[]).forEach(markUsed);

      const plateMap = new Map<string, ReceiptPlateOption>();
      const pushPlate = (row: Record<string, unknown>) => {
        const plate = String(row.plateNo || row.plateNumber || '').trim();
        if (!plate) return;
        if (usedPlates.has(normalizePlate(plate))) return;
        plateMap.set(normalizePlate(plate), {
          value: plate,
          label: plate,
          supplier: String(row.supplierName || row.supplier || ''),
          returnLocation: String(row.returnLocation || ''),
          datetime: String(row.datetime || row.returnDate || row.weighDate || ''),
        });
      };
      getLocalBizRows<Record<string, unknown>>('receipt').forEach(pushPlate);
      ((receiptRes.data?.records || []) as Record<string, unknown>[]).forEach(pushPlate);

      setPendingSyncOptions(Array.from(pendingMap.values()));
      setReceiptPlateOptions(Array.from(plateMap.values()));
    } catch {
      message.warning('联动选项加载失败，可手动填写或稍后重试');
      setPendingSyncOptions([]);
      setReceiptPlateOptions([]);
    } finally {
      setLinkOptionsLoading(false);
    }
  };

  const handleCodeSearch = async (text: string) => {
    const kw = text.trim();
    if (kw.length < 2) return;
    try {
      const res = await getJdyBusinessData('weighing-sync', {
        pageNo: 1,
        pageSize: 50,
        keyword: kw,
      });
      mergePendingOptions((res.data?.records || []) as Record<string, unknown>[]);
    } catch {
      // 本地已加载选项仍可筛选
    }
  };

  const codeSelectOptions = useMemo(() => {
    const list = [...pendingSyncOptions];
    const current = editing?.code?.trim();
    if (current && !list.some((o) => o.value === current)) {
      list.unshift({
        value: current,
        label: current,
        tonnage: editing?.tonnage,
        negotiation: mapNegotiation(editing?.negotiation),
      });
    }
    return list;
  }, [pendingSyncOptions, editing]);

  const plateSelectOptions = useMemo(() => {
    const list = [...receiptPlateOptions];
    const current = editing?.plateNumber?.trim();
    if (current && !list.some((o) => normalizePlate(o.value) === normalizePlate(current))) {
      list.unshift({
        value: current,
        label: current,
        supplier: editing?.supplier || '',
        returnLocation: editing?.returnLocation || '',
        datetime: editing?.returnDate || editing?.weighDate || '',
      });
    }
    return list;
  }, [receiptPlateOptions, editing]);

  const handleCodeChange = (code: string | undefined) => {
    if (!code) {
      addForm.setFieldsValue({ tonnage: undefined });
      return;
    }
    const hit = codeSelectOptions.find((o) => o.value === code);
    if (!hit) return;
    addForm.setFieldsValue({
      tonnage: hit.tonnage,
      negotiation: hit.negotiation || addForm.getFieldValue('negotiation') || '销户',
    });
  };

  const handlePlateChange = (plate: string | undefined) => {
    if (!plate) return;
    const hit = plateSelectOptions.find((o) => normalizePlate(o.value) === normalizePlate(plate));
    if (!hit) return;
    const dateVal = parseReceiptDate(hit.datetime);
    addForm.setFieldsValue({
      weighDate: dateVal,
      returnDate: dateVal,
      supplier: hit.supplier || undefined,
      returnLocation: hit.returnLocation || undefined,
    });
  };

  const handleAdd = () => {
    setEditing(null);
    addForm.resetFields();
    addForm.setFieldsValue({
      negotiation: '销户',
      weighDate: dayjs(),
      iron: 4,
      aluminum: 4,
      tire: 4,
    });
    setAddModalOpen(true);
    void loadLinkOptions();
  };

  const handleEdit = (record: WeighingInspectionItem) => {
    setEditing(record);
    const rawType = String(record.vehicleType || '').trim();
    const isKnown = KNOWN_VEHICLE_TYPES.has(rawType);
    addForm.setFieldsValue({
      ...record,
      negotiation: mapNegotiation(record.negotiation) || '销户',
      weighDate: record.weighDate ? dayjs(record.weighDate) : undefined,
      returnDate: record.returnDate ? dayjs(record.returnDate) : undefined,
      vehicleType: isKnown ? rawType : '其他',
      vehicleTypeOther: isKnown || !rawType ? undefined : rawType,
      ternary: normalizeYesNoMark(record.ternary) || undefined,
      battery: normalizeYesNoMark(record.battery) || undefined,
    });
    setAddModalOpen(true);
    void loadLinkOptions();
  };

  const columns: ColumnsType<WeighingInspectionItem> = [
    ...baseColumns.map((col) => {
      if ('dataIndex' in col && col.dataIndex === 'code') {
        return {
          ...col,
          render: (val: string, record: WeighingInspectionItem) => (
            <span
              style={{ color: '#1890ff', cursor: 'pointer' }}
              onClick={() => handleEdit(record)}
            >
              {val}
            </span>
          ),
        };
      }
      return col;
    }),
    makeEditColumn<WeighingInspectionItem>(handleEdit),
  ];

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      const operator = user.nickname || user.username || '系统';
      const otherText = String(values.vehicleTypeOther || '').trim();
      const vehicleType =
        values.vehicleType === '其他'
          ? (otherText || '其他')
          : (values.vehicleType || '');
      const payload = {
        code: values.code || '',
        negotiation: values.negotiation || '',
        weighDate: values.weighDate?.format?.('YYYY-MM-DD') || values.weighDate || '',
        plateNumber: values.plateNumber || '',
        returnDate: values.returnDate?.format?.('YYYY-MM-DD') || values.returnDate || '',
        vehicleType,
        vehicleModel: values.vehicleModel || '',
        supplier: values.supplier || '',
        salesperson: values.salesperson || '',
        returnLocation: values.returnLocation || '',
        tonnage: Number(values.tonnage || 0),
        flatten: values.flatten || '',
        operation: values.operation || '',
        bLevel: values.bLevel || '',
        iron: Number(values.iron || 0),
        aluminum: Number(values.aluminum || 0),
        ternary: normalizeYesNoMark(values.ternary),
        battery: normalizeYesNoMark(values.battery),
        tire: Number(values.tire || 0),
        remark: values.remark || '',
        submitter: editing?.submitter || operator,
        submitTime: editing?.submitTime || now,
        updateTime: now,
      };
      const summary = buildChangeSummary(editing, payload);
      let saved: WeighingInspectionItem;
      if (editing) {
        saved = upsertLocalBizRow<WeighingInspectionItem>('weighing-inspection', {
          ...payload,
          id: editing.id,
          dataId: editing.dataId,
        });
        message.success('修改成功！');
      } else {
        saved = addLocalBizRow<WeighingInspectionItem>('weighing-inspection', payload);
        message.success('提交成功！');
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
    } catch {
      // validation failed
    }
  };

  const handleSaveDraft = () => {
    message.success('草稿保存成功！');
    setEditing(null);
    setAddModalOpen(false);
  };

  const handleExport = () => {
    message.success('导出成功');
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    deleteLocalBizRows('weighing-inspection', selectedRowKeys.map(Number));
    setReloadKey((k) => k + 1);
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
    setSelectedRowKeys([]);
  };

  const handleImport = () => {
    message.info('导入功能开发中');
  };

  const metaRecordKey = bizRecordKey(editing);
  const formMeta = {
    submitter: editing?.submitter || getStoredUser().nickname || getStoredUser().username || '-',
    submitTime: editing?.submitTime || '-',
    updateTime: editing?.updateTime || '-',
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* 操作工具栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <BusinessJdySyncButtons
              syncFn={syncJdyWeighingInspection}
              onSynced={() => {
                setPageNo(1);
                setReloadKey((k) => k + 1);
              }}
            />
            <Button icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
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
              showTotal: (t) => `${Math.floor(pageSize * (pageNo - 1))}条/共 ${t} 条`,
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

      {/* 添加过磅查验弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => {
          setEditing(null);
          setAddModalOpen(false);
        }}
        width={isMobile ? '100%' : formExpanded ? 'min(1480px, calc(100vw - 48px))' : 1380}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto', overflowX: 'hidden' } }}
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
          <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '16px 16px 0' : '16px 28px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
                {editing ? '编辑过磅查验' : '过磅查验'}
              </span>
              <Space>
                {!isMobile && (
                  formExpanded
                    ? <FullscreenExitOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} onClick={() => setFormExpanded(false)} />
                    : <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} onClick={() => setFormExpanded(true)} />
                )}
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

            <Form form={addForm} layout="vertical" className="weigh-form" initialValues={{ negotiation: '销户' }}>
              <div className="weigh-grid">
                <Form.Item name="code" label="编号" rules={[{ required: true, message: '请选择编号' }]}>
                  <Select
                    showSearch
                    allowClear
                    loading={linkOptionsLoading}
                    placeholder="搜索过磅同步（待同步）编号"
                    options={codeSelectOptions}
                    optionFilterProp="label"
                    onSearch={handleCodeSearch}
                    onChange={handleCodeChange}
                    notFoundContent={linkOptionsLoading ? '加载中…' : '暂无待同步编号'}
                  />
                </Form.Item>

                <Form.Item name="negotiation" label="销户/议价" rules={[{ required: true, message: '请选择销户/议价' }]}>
                  <Select
                    placeholder="请选择"
                    options={[
                      { value: '销户', label: '销户' },
                      { value: '议价', label: '议价' },
                    ]}
                  />
                </Form.Item>

                <Form.Item name="weighDate" label="过磅日期" rules={[{ required: true, message: '请选择过磅日期' }]}>
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
                </Form.Item>

                <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true, message: '请选择车牌号' }]}>
                  <Select
                    showSearch
                    allowClear
                    loading={linkOptionsLoading}
                    placeholder="搜索业务收货车牌"
                    options={plateSelectOptions}
                    optionFilterProp="label"
                    onChange={handlePlateChange}
                    notFoundContent={linkOptionsLoading ? '加载中…' : '暂无可选车牌（已结账车牌不可选）'}
                  />
                </Form.Item>

                <Form.Item name="returnDate" label="回车日期" rules={[{ required: true, message: '请选择回车日期' }]}>
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
                </Form.Item>
              </div>

              <Form.Item name="vehicleType" label="车辆类型" rules={[{ required: true, message: '请选择车辆类型' }]}>
                <VehicleTypeField />
              </Form.Item>

              {watchedVehicleType === '其他' && (
                <Form.Item name="vehicleTypeOther" label="其他车辆类型" rules={[{ required: true, message: '请填写此内容' }]}>
                  <Input placeholder="请填写此内容" />
                </Form.Item>
              )}

              <div className="weigh-grid">
                <Form.Item name="vehicleModel" label="车辆型号" rules={[{ required: true, message: '请选择车辆型号' }]}>
                  <DictSelect dict="vehicleModel" placeholder="请选择车辆型号（基础资料）" />
                </Form.Item>

                <Form.Item name="supplier" label="供应商">
                  <DictSelect dict="supplier" placeholder="请选择供应商（基础资料）" />
                </Form.Item>

                <Form.Item name="salesperson" label="业务员">
                  <DictSelect dict="salesman" placeholder="请选择业务员（基础资料）" />
                </Form.Item>

                <Form.Item name="returnLocation" label="回车地">
                  <Input placeholder="请输入" />
                </Form.Item>

                <Form.Item name="tonnage" label="吨位" rules={[{ required: true, message: '请输入吨位' }]}>
                  <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
                </Form.Item>

                <Form.Item name="flatten" label="压扁">
                  <FlagField />
                </Form.Item>

                <Form.Item name="operation" label="营运">
                  <FlagField />
                </Form.Item>

                <Form.Item name="bLevel" label="B级">
                  <FlagField />
                </Form.Item>
              </div>

              <div className="weigh-section-title">车辆情况</div>

              <div className="weigh-grid">
                <Form.Item name="iron" label="铁">
                  <ScoreSelect />
                </Form.Item>

                <Form.Item name="aluminum" label="铝">
                  <ScoreSelect />
                </Form.Item>

                <Form.Item name="ternary" label="三元" rules={[{ required: true, message: '请选择三元' }]}>
                  <MarkField />
                </Form.Item>

                <Form.Item name="battery" label="电瓶" rules={[{ required: true, message: '请选择电瓶' }]}>
                  <MarkField />
                </Form.Item>
              </div>

              <div className="weigh-grid-remark">
                <Form.Item name="tire" label="轮胎">
                  <ScoreSelect />
                </Form.Item>

                <Form.Item name="remark" label="备注">
                  <Input.TextArea rows={2} placeholder="请输入备注内容" />
                </Form.Item>
              </div>

              <BizFormMetaFooter
                submitter={formMeta.submitter}
                submitTime={formMeta.submitTime}
                updateTime={formMeta.updateTime}
              />
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
