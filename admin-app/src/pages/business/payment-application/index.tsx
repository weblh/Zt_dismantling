import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { findPayeeBySelectValue } from '@/utils/payeeStore';
import DictSelect from '@/components/DictSelect';
import BizLinkDataModal from '@/components/BizLinkDataModal';
import PaymentDetailDrawer, { ImageStack } from '@/components/PaymentDetailDrawer';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import { getStoredUser } from '@/config/apps';
import { useDepartmentOptions } from '@/config/departments';
import { getJdyBusinessData, syncJdyPaymentApplication } from '@/api/jdy';
import { submitPaymentApplication } from '@/api/paymentApplication';
import { printPaymentApplication } from '@/utils/printPaymentApplication';
import {
  addLocalBizRow,
  deleteLocalBizRows,
  formatBizDateTime,
  getLocalBizRows,
  mergeLocalRemoteRows,
  upsertLocalBizRow,
} from '@/utils/localBizStore';
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
  Select,
  Radio,
  Upload,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  FullscreenOutlined,
  UploadOutlined,
  MinusCircleOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import { makeEditColumn } from '@/components/TableEditColumn';
import QrPhotoUpload from '@/components/QrPhotoUpload';
import type { UploadFile } from 'antd';

interface PaymentDetailItem {
  key: number;
  serialNo: number;
  vehicleVin: string;
  overweightDate: string;
  plateNo: string;
  vehicleType: string;
  vehicleModel: string;
  supplier: string;
  salesman: string;
  returnLocation: string;
  tonnage: string;
  iron: string;
  aluminum: string;
  ternary: string;
  battery: string;
  kgDiff: string;
  deductNetWeight: string;
  deductBattery: string;
  goodCondition: string;
  deductTwoBox: string;
  deductBreadBox: string;
  deductIronRing: string;
  deductDiesel: string;
  selfDelivery: string;
  deductSmallParts: string;
  unitPrice: string;
  totalPrice: string;
  remark: string;
}

interface PaymentApplicationItem {
  id: number;
  dataId?: string;
  date: string;
  applicant: string;
  department: string;
  details: PaymentDetailItem[];
  totalAmount: string;
  totalAmountCapital: string;
  vehicleCount: number;
  totalTonnage: string;
  paymentAccount: string;
  paymentMethod: string;
  payeeName1: string;
  payeeAccount1: string;
  bankName1: string;
  bankAccount1: string;
  image: string;
  images?: string[];
  payeeName2: string;
  payeeAccount2: string;
  bankName2: string;
  bankAccount2: string;
  attachment: string;
  attachments?: string[];
  paymentReason: string;
  paymentReceipt: string | string[];
  submitter: string;
  submitTime: string;
  updateTime: string;
  processStatus: string;
  currentNode: string;
  currentHandler: string;
}

const FILTER_FIELDS = [
  { key: 'date', label: '日期' },
  { key: 'applicant', label: '申请人' },
  { key: 'department', label: '部门单选' },
  { key: 'vehicleVin', label: '编号' },
  { key: 'plateNo', label: '车牌号' },
  { key: 'supplier', label: '供应商' },
  { key: 'totalAmount', label: '合计金额(小写)' },
  { key: 'paymentAccount', label: '付款账户' },
  { key: 'paymentMethod', label: '付款方式' },
  { key: 'payeeName1', label: '收款单位1' },
  { key: 'paymentReason', label: '付款事由' },
  { key: 'processStatus', label: '流程状态' },
  { key: 'currentNode', label: '当前节点' },
  { key: 'currentHandler', label: '当前负责人' },
];

/** 明细字段摊平到行上，便于勾选字段模糊搜索 */
function withFilterFlat(row: PaymentApplicationItem) {
  const details = row.details || [];
  return {
    ...row,
    vehicleVin: details.map((d) => d.vehicleVin).filter(Boolean).join(' '),
    plateNo: details.map((d) => d.plateNo).filter(Boolean).join(' '),
    supplier: details.map((d) => d.supplier).filter(Boolean).join(' '),
    processStatus:
      row.processStatus === 'completed' || row.processStatus === '流转完成'
        ? '流转完成'
        : row.processStatus === 'processing'
          ? '处理中'
          : row.processStatus,
    paymentAccount:
      row.paymentAccount === 'big'
        ? '大账户'
        : row.paymentAccount === 'small'
          ? '小账户'
          : row.paymentAccount,
    paymentMethod:
      ({ cash: '现金', bank: '电汇', transfer: '承兑' } as Record<string, string>)[
        row.paymentMethod
      ] || row.paymentMethod,
  };
}

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

function toNumber(v: unknown): number {
  const n = Number(String(v ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

/** 金额转人民币大写 */
function amountToChinese(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return '人民币零元整';
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿'];
  const neg = amount < 0;
  const abs = Math.abs(amount);
  const yuan = Math.floor(abs + 1e-8);
  const fen = Math.round((abs - yuan) * 100);

  const section = (n: number) => {
    let s = '';
    let zero = false;
    for (let i = 0; i < 4 && n > 0; i++) {
      const d = n % 10;
      if (d === 0) {
        if (!zero && s) {
          s = digits[0] + s;
          zero = true;
        }
      } else {
        s = digits[d] + units[i] + s;
        zero = false;
      }
      n = Math.floor(n / 10);
    }
    return s.replace(/零+$/, '');
  };

  let intPart = '';
  let rest = yuan;
  let bi = 0;
  while (rest > 0) {
    const seg = rest % 10000;
    if (seg === 0) {
      if (intPart && !intPart.startsWith(digits[0])) intPart = digits[0] + intPart;
    } else {
      intPart = section(seg) + bigUnits[bi] + intPart;
    }
    rest = Math.floor(rest / 10000);
    bi++;
  }
  intPart = intPart.replace(/零+/g, '零').replace(/零+$/, '') || '零';

  let out = `人民币${intPart}元`;
  if (fen === 0) {
    out += '整';
  } else {
    const jiao = Math.floor(fen / 10);
    const f = fen % 10;
    if (jiao > 0) out += `${digits[jiao]}角`;
    else if (f > 0) out += '零';
    if (f > 0) out += `${digits[f]}分`;
  }
  return neg ? `负${out}` : out;
}

function summarizeDetails(items: PaymentDetailItem[]) {
  const filled = items.filter((d) => d.vehicleVin || d.plateNo || d.totalPrice || d.unitPrice);
  const totalAmount = filled.reduce((sum, d) => sum + toNumber(d.totalPrice), 0);
  const totalTonnage = filled.reduce((sum, d) => sum + toNumber(d.tonnage), 0);
  const amountStr =
    totalAmount > 0
      ? (Number.isInteger(totalAmount) ? String(totalAmount) : totalAmount.toFixed(2))
      : '';
  return {
    totalAmount: amountStr,
    totalAmountCapital: amountStr ? amountToChinese(totalAmount) : '',
    vehicleCount: filled.length > 0 ? String(filled.length) : '',
    totalTonnage:
      totalTonnage > 0
        ? (Number.isInteger(totalTonnage) ? String(totalTonnage) : totalTonnage.toFixed(2))
        : '',
  };
}

function normalizeDetail(d: Record<string, unknown>, i: number): PaymentDetailItem {
  return {
    key: Number(d.key) || i + 1,
    serialNo: Number(d.serialNo) || i + 1,
    vehicleVin: str(d.vehicleVin),
    overweightDate: str(d.overweightDate),
    plateNo: str(d.plateNo),
    vehicleType: str(d.vehicleType),
    vehicleModel: str(d.vehicleModel),
    supplier: str(d.supplier),
    salesman: str(d.salesman),
    returnLocation: str(d.returnLocation),
    tonnage: str(d.tonnage),
    iron: str(d.iron),
    aluminum: str(d.aluminum),
    ternary: str(d.ternary),
    battery: str(d.battery),
    kgDiff: str(d.kgDiff),
    deductNetWeight: str(d.deductNetWeight),
    deductBattery: str(d.deductBattery),
    goodCondition: str(d.goodCondition),
    deductTwoBox: str(d.deductTwoBox),
    deductBreadBox: str(d.deductBreadBox),
    deductIronRing: str(d.deductIronRing),
    deductDiesel: str(d.deductDiesel),
    selfDelivery: str(d.selfDelivery),
    deductSmallParts: str(d.deductSmallParts),
    unitPrice: str(d.unitPrice),
    totalPrice: str(d.totalPrice),
    remark: str(d.remark),
  };
}

function toUrlList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(str).filter(Boolean);
  if (raw == null || raw === '') return [];
  return [str(raw)].filter(Boolean);
}

function normalizeRow(raw: Record<string, unknown>): PaymentApplicationItem {
  const detailsRaw = Array.isArray(raw.details) ? raw.details : [];
  const images = toUrlList(raw.images ?? raw.image);
  const paymentReceipt = toUrlList(raw.paymentReceipt);
  const status = str(raw.processStatus);
  return {
    id: Number(raw.id) || 0,
    dataId: raw.dataId ? str(raw.dataId) : undefined,
    date: str(raw.date).slice(0, 10),
    applicant: str(raw.applicant),
    department: str(raw.department),
    details: detailsRaw.map((d, i) => normalizeDetail((d || {}) as Record<string, unknown>, i)),
    totalAmount: str(raw.totalAmount),
    totalAmountCapital: str(raw.totalAmountCapital),
    vehicleCount: Number(raw.vehicleCount) || detailsRaw.length,
    totalTonnage: str(raw.totalTonnage),
    paymentAccount: str(raw.paymentAccount),
    paymentMethod: str(raw.paymentMethod),
    payeeName1: str(raw.payeeName1),
    payeeAccount1: str(raw.payeeAccount1),
    bankName1: str(raw.bankName1),
    bankAccount1: str(raw.bankAccount1),
    image: images[0] || '',
    images,
    payeeName2: str(raw.payeeName2),
    payeeAccount2: str(raw.payeeAccount2),
    bankName2: str(raw.bankName2),
    bankAccount2: str(raw.bankAccount2),
    attachment: str(raw.attachment),
    attachments: toUrlList(raw.attachments ?? raw.attachment),
    paymentReason: str(raw.paymentReason),
    paymentReceipt,
    submitter: str(raw.submitter),
    submitTime: str(raw.submitTime),
    updateTime: str(raw.updateTime),
    processStatus:
      status === 'completed' || status === '1' || status === '流转完成' ? 'completed' : status || 'processing',
    currentNode: str(raw.currentNode),
    currentHandler: str(raw.currentHandler),
  };
}

const paymentDetailColumns: ColumnsType<PaymentDetailItem> = [
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>序号</span>,
    dataIndex: 'serialNo',
    width: 80,
    fixed: 'left',
    render: (_: unknown, record: PaymentDetailItem) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{record.serialNo}</span>
        <MinusCircleOutlined
          style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 14 }}
          onClick={() => {}}
        />
      </div>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>, dataIndex: 'vehicleVin', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'overweightDate', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车牌号</span>, dataIndex: 'plateNo', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>供应商</span>, dataIndex: 'supplier', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>业务员</span>, dataIndex: 'salesman', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>回车地</span>, dataIndex: 'returnLocation', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>吨位</span>, dataIndex: 'tonnage', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>, dataIndex: 'iron', width: 70 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>, dataIndex: 'aluminum', width: 70 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>, dataIndex: 'ternary', width: 70 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>, dataIndex: 'battery', width: 70 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>公斤差</span>, dataIndex: 'kgDiff', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>扣净重</span>, dataIndex: 'deductNetWeight', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>扣电瓶</span>, dataIndex: 'deductBattery', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车况较好</span>, dataIndex: 'goodCondition', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>扣两厢</span>, dataIndex: 'deductTwoBox', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>扣面包斗斗</span>, dataIndex: 'deductBreadBox', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>扣铁圈</span>, dataIndex: 'deductIronRing', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>扣柴油</span>, dataIndex: 'deductDiesel', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>自送</span>, dataIndex: 'selfDelivery', width: 70 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>扣小件</span>, dataIndex: 'deductSmallParts', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>单价</span>, dataIndex: 'unitPrice', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>总价</span>, dataIndex: 'totalPrice', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>备注</span>, dataIndex: 'remark', width: 100 },
];

const baseColumns: ColumnsType<PaymentApplicationItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>日期</span>, dataIndex: 'date', width: 110, fixed: 'left' },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>申请人</span>,
    dataIndex: 'applicant',
    width: 120,
    fixed: 'left',
    render: (val: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>部门单选</span>,
    dataIndex: 'department',
    width: 120,
    fixed: 'left',
    render: (val: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>,
  },
  {
    title: '付款明细',
    dataIndex: 'details',
    width: 1500,
    render: (details: PaymentDetailItem[]) => (
      <div style={{ overflowX: 'auto' }}>
        <Table
          rowKey="key"
          columns={paymentDetailColumns}
          dataSource={details}
          pagination={false}
          size="small"
          scroll={{ x: 1500 }}
          bordered
        />
      </div>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>合计金额(小写)</span>, dataIndex: 'totalAmount', width: 120, align: 'right' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>合计金额(大写)</span>, dataIndex: 'totalAmountCapital', width: 180 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆数量</span>, dataIndex: 'vehicleCount', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>总吨位</span>, dataIndex: 'totalTonnage', width: 90 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>付款账户</span>,
    dataIndex: 'paymentAccount',
    width: 100,
    render: (val: string) => {
      if (val === 'big' || val === '大账户') return '大账户';
      if (val === 'small' || val === '小账户') return '小账户';
      return val || '-';
    },
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>付款方式</span>,
    dataIndex: 'paymentMethod',
    width: 100,
    render: (val: string) => {
      const map: Record<string, string> = { cash: '现金', bank: '电汇', transfer: '承兑' };
      return map[val] || val || '-';
    },
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>收款单位1</span>, dataIndex: 'payeeName1', width: 140 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>收款账号1</span>, dataIndex: 'payeeAccount1', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>开户行1</span>, dataIndex: 'bankName1', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>银行账号1</span>, dataIndex: 'bankAccount1', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>图片</span>,
    dataIndex: 'images',
    width: 140,
    render: (_: unknown, record: PaymentApplicationItem) => (
      <ImageStack urls={record.images?.length ? record.images : record.image} />
    ),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>附件</span>,
    dataIndex: 'attachment',
    width: 100,
    render: (_: unknown, record: PaymentApplicationItem) => {
      const list = record.attachments?.length ? record.attachments : toUrlList(record.attachment);
      return list.length ? `${list.length} 个` : '-';
    },
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>付款事由</span>, dataIndex: 'paymentReason', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>付款回执单</span>,
    dataIndex: 'paymentReceipt',
    width: 140,
    render: (val: string | string[]) => <ImageStack urls={val} />,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>流程状态</span>,
    dataIndex: 'processStatus',
    width: 100,
    render: (val: string) => (
      <Tag
        color={val === 'completed' ? 'green' : 'orange'}
        style={{ borderRadius: 10, padding: '2px 10px' }}
      >
        {val === 'completed' ? '流转完成' : '处理中'}
      </Tag>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>当前节点</span>, dataIndex: 'currentNode', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>当前负责人</span>, dataIndex: 'currentHandler', width: 100 },
];

export default function PaymentApplicationPage() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const departmentOptions = useDepartmentOptions();
  const [dataSource, setDataSource] = useState<PaymentApplicationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentApplicationItem | null>(null);
  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [receiptFileList, setReceiptFileList] = useState<UploadFile[]>([]);
  const [detailLinkModalOpen, setDetailLinkModalOpen] = useState(false);
  const [settlementPickerRowKey, setSettlementPickerRowKey] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<PaymentApplicationItem | null>(null);
  const [autoShowProcess, setAutoShowProcess] = useState(false);
  const [addForm] = Form.useForm();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('payment-application', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = (res.data?.records || []).map((r) =>
          normalizeRow(r as Record<string, unknown>),
        );
        const local = keyword
          ? []
          : getLocalBizRows<PaymentApplicationItem>('payment-application').map((r) =>
              normalizeRow(r as unknown as Record<string, unknown>),
            );
        const merged =
          pageNo === 1
            ? mergeLocalRemoteRows(local, remote)
            : remote.map((r) => local.find((l) => l.id === r.id) || r);
        setDataSource(merged.slice(0, pageSize));
        setTotal(
          (res.data?.total || 0) +
            (keyword ? 0 : local.filter((l) => !remote.some((r) => r.id === l.id)).length),
        );
      } catch {
        if (!cancelled) {
          message.error('付款申请加载失败，请稍后重试或先点「同步」');
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

  // 与业务结账一致：输入防抖走服务端 keyword，勾选字段在当前页结果上再模糊
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchValue.trim();
      if (next === keyword) return;
      setPageNo(1);
      setKeyword(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, keyword]);

  const displayData = useMemo(() => {
    const flat = dataSource.map(withFilterFlat);
    const hitIds = new Set(
      filterBasicRows(flat, searchValue, selectedFields).map((r) => r.id),
    );
    return dataSource.filter((r) => hitIds.has(r.id));
  }, [dataSource, searchValue, selectedFields]);

  const [detailItems, setDetailItems] = useState<PaymentDetailItem[]>([
    {
      key: 1,
      serialNo: 1,
      vehicleVin: '',
      overweightDate: '',
      plateNo: '',
      vehicleType: '',
      vehicleModel: '',
      supplier: '',
      salesman: '',
      returnLocation: '',
      tonnage: '',
      iron: '',
      aluminum: '',
      ternary: '',
      battery: '',
      kgDiff: '',
      deductNetWeight: '',
      deductBattery: '',
      goodCondition: '',
      deductTwoBox: '',
      deductBreadBox: '',
      deductIronRing: '',
      deductDiesel: '',
      selfDelivery: '',
      deductSmallParts: '',
      unitPrice: '',
      totalPrice: '',
      remark: '',
    },
  ]);


  const emptyDetailItem = (): PaymentDetailItem => ({
    key: 1,
    serialNo: 1,
    vehicleVin: '',
    overweightDate: '',
    plateNo: '',
    vehicleType: '',
    vehicleModel: '',
    supplier: '',
    salesman: '',
    returnLocation: '',
    tonnage: '',
    iron: '',
    aluminum: '',
    ternary: '',
    battery: '',
    kgDiff: '',
    deductNetWeight: '',
    deductBattery: '',
    goodCondition: '',
    deductTwoBox: '',
    deductBreadBox: '',
    deductIronRing: '',
    deductDiesel: '',
    selfDelivery: '',
    deductSmallParts: '',
    unitPrice: '',
    totalPrice: '',
    remark: '',
  });

  const urlsToFileList = (urls: string[] = []): UploadFile[] =>
    urls.filter(Boolean).map((url, i) => ({
      uid: `pay-${i}-${url}`,
      name: url.split('/').pop() || `img-${i}`,
      status: 'done' as const,
      url,
      thumbUrl: url,
    }));

  const fileListToUrls = (list: UploadFile[]) =>
    list.map((f) => f.url || f.thumbUrl || '').filter(Boolean);

  const handleAdd = () => {
    const user = getStoredUser();
    setEditing(null);
    addForm.resetFields();
    addForm.setFieldsValue({
      date: new Date().toISOString().slice(0, 10),
      applicant: user.nickname || user.username || '',
      department: user.department || user.deptIds || undefined,
    });
    setImageFileList([]);
    setReceiptFileList([]);
    setDetailItems([emptyDetailItem()]);
    setAddModalOpen(true);
  };

  /** 工作台「发起流程」带 ?create=1 时自动打开新建 */
  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    handleAdd();
    const next = new URLSearchParams(searchParams);
    next.delete('create');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅响应 create 参数
  }, [searchParams.get('create')]);

  const handleEdit = (record: PaymentApplicationItem) => {
    setEditing(record);
    addForm.setFieldsValue({
      date: record.date,
      applicant: record.applicant,
      department: record.department,
      totalAmount: record.totalAmount,
      totalAmountCapital: record.totalAmountCapital,
      vehicleCount: record.vehicleCount,
      totalTonnage: record.totalTonnage,
      paymentAccount: record.paymentAccount,
      paymentMethod: record.paymentMethod,
      payeeName1: record.payeeAccount1
        ? `${record.payeeName1}|${record.payeeAccount1}`
        : record.payeeName1,
      payeeAccount1: record.payeeAccount1,
      bankName1: record.bankName1,
      bankAccount1: record.bankAccount1,
      paymentReason: record.paymentReason,
    });
    const imageUrls = record.images?.length
      ? record.images
      : record.image
        ? [record.image]
        : [];
    setImageFileList(urlsToFileList(imageUrls));
    setReceiptFileList(urlsToFileList(record.paymentReceipt || []));
    setDetailItems(
      record.details?.length
        ? record.details.map((d, i) => ({ ...d, key: d.key || i + 1, serialNo: i + 1 }))
        : [emptyDetailItem()],
    );
    setAddModalOpen(true);
  };

  const openDetail = (record: PaymentApplicationItem) => {
    setAutoShowProcess(false);
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const columns: ColumnsType<PaymentApplicationItem> = [
    ...baseColumns.map((col) => {
      if ('dataIndex' in col && col.dataIndex === 'applicant') {
        return {
          ...col,
          render: (val: string, record: PaymentApplicationItem) => (
            <span
              style={{ color: '#1890ff', cursor: 'pointer' }}
              onClick={() => openDetail(record)}
            >
              {val}
            </span>
          ),
        };
      }
      return col;
    }),
    {
      title: '详情',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: PaymentApplicationItem) => (
        <Button type="link" onClick={() => openDetail(record)}>
          详情
        </Button>
      ),
    },
    {
      title: '打印',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: PaymentApplicationItem) => (
        <Button
          type="link"
          icon={<PrinterOutlined />}
          onClick={() => {
            try {
              printPaymentApplication(record);
            } catch (e) {
              message.error(e instanceof Error ? e.message : '打印失败');
            }
          }}
        >
          打印
        </Button>
      ),
    },
    makeEditColumn<PaymentApplicationItem>(handleEdit),
  ];

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      const summary = summarizeDetails(detailItems);
      const user = getStoredUser();
      const now = formatBizDateTime();
      const payload = {
        date: values.date || new Date().toISOString().slice(0, 10),
        applicant: values.applicant || '',
        department: values.department || '',
        details: detailItems,
        totalAmount: summary.totalAmount,
        totalAmountCapital: summary.totalAmountCapital,
        vehicleCount: summary.vehicleCount,
        totalTonnage: summary.totalTonnage,
        paymentAccount: values.paymentAccount || 'big',
        paymentMethod: values.paymentMethod || 'cash',
        payeeName1: payeeUnitOnly(values.payeeName1),
        payeeAccount1: values.payeeAccount1 || '',
        bankName1: values.bankName1 || '',
        bankAccount1: values.bankAccount1 || '',
        payeeName2: '',
        payeeAccount2: '',
        bankName2: '',
        bankAccount2: '',
        paymentReason: values.paymentReason || '',
        processStatus: editing?.processStatus || 'processing',
        currentNode: editing?.currentNode || '流程发起节点',
        currentHandler: editing?.currentHandler || '',
        image: fileListToUrls(imageFileList)[0] || '',
        images: fileListToUrls(imageFileList),
        attachment: editing?.attachment || '',
        paymentReceipt: fileListToUrls(receiptFileList),
        submitter: user.nickname || user.username || '系统',
        submitTime: editing?.submitTime || now,
        updateTime: now,
        operatorName: user.nickname || user.username || '系统',
      };
      if (editing) {
        upsertLocalBizRow<PaymentApplicationItem>('payment-application', {
          ...editing,
          ...payload,
        });
        message.success('修改成功！');
        setReloadKey((k) => k + 1);
      } else {
        setSubmitting(true);
        let dataId: string | undefined;
        let processStatus = 'processing';
        let currentNode = '财务审核';
        try {
          const res = await submitPaymentApplication(payload);
          dataId = res.data?.dataId ? String(res.data.dataId) : undefined;
          processStatus = String(res.data?.processStatus || 'processing');
          currentNode = String(res.data?.currentNode || '财务审核');
          message.success(String(res.data?.message || '已在本系统提交（未向简道云发送）'));
        } catch {
          message.warning('提交失败，已先保存到本地');
        } finally {
          setSubmitting(false);
        }
        const saved = addLocalBizRow<PaymentApplicationItem>('payment-application', {
          ...payload,
          dataId,
          processStatus,
          currentNode,
        });
        setReloadKey((k) => k + 1);
        // 发起后展示流程图
        setDetailRecord({ ...saved, dataId, processStatus, currentNode });
        setAutoShowProcess(true);
        setDetailOpen(true);
      }
      setEditing(null);
      setImageFileList([]);
      setReceiptFileList([]);
      setAddModalOpen(false);
    } catch {
      // validation failed
    }
  };

  const handleSaveDraft = () => {
    message.success('草稿保存成功！');
    setEditing(null);
    setImageFileList([]);
    setReceiptFileList([]);
    setAddModalOpen(false);
  };

  const handleImport = () => {
    message.info('导入');
  };

  const handleExport = () => {
    message.success('导出成功');
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    deleteLocalBizRows('payment-application', selectedRowKeys.map(Number));
    setSelectedRowKeys([]);
    setReloadKey((k) => k + 1);
    message.success('删除成功');
  };

  const payeeUnitOnly = (selected?: string) => {
    const raw = (selected || '').trim();
    const i = raw.indexOf('|');
    return i > 0 ? raw.slice(0, i) : raw;
  };

  const fillPayeeBank = (selected: string) => {
    const payee = findPayeeBySelectValue(selected);
    if (!payee) return;
    // payeeName 表单值保持下拉唯一键（单位|账号），提交时再截成单位名
    addForm.setFieldsValue({
      payeeAccount1: payee.payeeAccount,
      bankName1: payee.openingBank,
      bankAccount1: payee.payeeAccount,
    });
  };

  // 明细变化后自动汇总红框四项（不可手填）
  useEffect(() => {
    if (!addModalOpen) return;
    const summary = summarizeDetails(detailItems);
    addForm.setFieldsValue(summary);
  }, [detailItems, addModalOpen, addForm]);

  const applySettlementToDetail = (row: Record<string, unknown>, detailKey: number) => {
    setDetailItems((items) =>
      items.map((item) =>
        item.key === detailKey
          ? {
              ...item,
              vehicleVin: String(row.code || ''),
              overweightDate: String(row.weighDate || ''),
              plateNo: String(row.plateNumber || ''),
              vehicleType: String(row.vehicleType || ''),
              vehicleModel: String(row.vehicleModel || ''),
              supplier: String(row.supplier || ''),
              salesman: String(row.salesperson || ''),
              returnLocation: String(row.returnLocation || ''),
              tonnage: String(row.tonnage ?? ''),
              iron: String(row.iron ?? ''),
              aluminum: String(row.aluminum ?? ''),
              ternary: String(row.ternary ?? ''),
              battery: String(row.battery ?? ''),
              kgDiff: String(row.kgDiff ?? ''),
              deductNetWeight: String(row.deductNetWeight ?? ''),
              deductBattery: String(row.deductBattery ?? ''),
              goodCondition: String(row.goodCondition ?? ''),
              deductTwoBox: String(row.deductTwoBox ?? ''),
              deductBreadBox: String(row.deductBreadBox ?? ''),
              deductIronRing: String(row.deductIronRing ?? ''),
              deductDiesel: String(row.deductDiesel ?? ''),
              selfDelivery: String(row.selfDelivery ?? ''),
              deductSmallParts: String(row.deductSmallParts ?? ''),
              unitPrice: String(row.unitPrice ?? ''),
              totalPrice: String(row.totalPrice ?? ''),
              remark: String(row.remark || ''),
            }
          : item,
      ),
    );
  };

  const addDetailItem = () => {
    const newItem: PaymentDetailItem = {
      key: Date.now(),
      serialNo: detailItems.length + 1,
      vehicleVin: '',
      overweightDate: '',
      plateNo: '',
      vehicleType: '',
      vehicleModel: '',
      supplier: '',
      salesman: '',
      returnLocation: '',
      tonnage: '',
      iron: '',
      aluminum: '',
      ternary: '',
      battery: '',
      kgDiff: '',
      deductNetWeight: '',
      deductBattery: '',
      goodCondition: '',
      deductTwoBox: '',
      deductBreadBox: '',
      deductIronRing: '',
      deductDiesel: '',
      selfDelivery: '',
      deductSmallParts: '',
      unitPrice: '',
      totalPrice: '',
      remark: '',
    };
    setDetailItems([...detailItems, newItem]);
  };

  const handleDeleteDetailItem = (key: number) => {
    const newItems = detailItems.filter((item) => item.key !== key);
    newItems.forEach((item, idx) => {
      item.serialNo = idx + 1;
    });
    setDetailItems(newItems);
  };

  const addDetailColumns: ColumnsType<PaymentDetailItem> = [
    {
      title: '序号',
      dataIndex: 'serialNo',
      width: 70,
      fixed: 'left',
      render: (_: unknown, record: PaymentDetailItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{record.serialNo}</span>
          <MinusCircleOutlined
            style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 14 }}
            onClick={() => handleDeleteDetailItem(record.key)}
          />
        </div>
      ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>选择数据</span>,
      width: 100,
      fixed: 'left',
      render: (_: unknown, record: PaymentDetailItem) => (
        <Button
          type="dashed"
          size="small"
          onClick={() => {
            setSettlementPickerRowKey(record.key);
            setDetailLinkModalOpen(true);
          }}
        >
          选择数据
        </Button>
      ),
    },
    { title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>, dataIndex: 'vehicleVin', width: 80, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'overweightDate', width: 100, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>车牌号</span>, dataIndex: 'plateNo', width: 90, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 90, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 80, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>供应商</span>, dataIndex: 'supplier', width: 100, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>业务员</span>, dataIndex: 'salesman', width: 80, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>回车地</span>, dataIndex: 'returnLocation', width: 70, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>吨位</span>, dataIndex: 'tonnage', width: 70, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>, dataIndex: 'iron', width: 60, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>, dataIndex: 'aluminum', width: 60, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>, dataIndex: 'ternary', width: 70, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>, dataIndex: 'battery', width: 70, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>公斤差</span>, dataIndex: 'kgDiff', width: 70, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>扣净重</span>, dataIndex: 'deductNetWeight', width: 80, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>扣电瓶</span>, dataIndex: 'deductBattery', width: 80, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>车况较好</span>, dataIndex: 'goodCondition', width: 80, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>扣两厢</span>, dataIndex: 'deductTwoBox', width: 70, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>扣面包斗斗</span>, dataIndex: 'deductBreadBox', width: 90, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>扣铁圈</span>, dataIndex: 'deductIronRing', width: 80, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>扣柴油</span>, dataIndex: 'deductDiesel', width: 80, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>自送</span>, dataIndex: 'selfDelivery', width: 60, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>扣小件</span>, dataIndex: 'deductSmallParts', width: 80, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>单价</span>, dataIndex: 'unitPrice', width: 70, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>总价</span>, dataIndex: 'totalPrice', width: 80, render: (v: string) => v || '暂无内容' },
    { title: <span style={{ whiteSpace: 'nowrap' }}>备注</span>, dataIndex: 'remark', width: 100, render: (v: string) => v || '暂无内容' },
  ];

  return (
    <div className="page-container">
      <Card
        bordered={false}
        styles={{ body: { padding: 0 } }}
        title={
          <span style={{ fontSize: 16, fontWeight: 500 }}>业务结账付款申请</span>
        }
      >
        {/* 操作工具栏 */}
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <BusinessJdySyncButtons
              syncFn={syncJdyPaymentApplication}
              successExtra="（图片已尝试落盘到 public/images）"
              onSynced={() => {
                setPageNo(1);
                setReloadKey((k) => k + 1);
              }}
            />
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
            scroll={{ x: 3800 }}
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

      {/* 添加付款申请弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => {
          setEditing(null);
          setImageFileList([]);
          setReceiptFileList([]);
          setAddModalOpen(false);
        }}
        width={1000}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' } }}
        footer={null}
      >
        <div style={{ padding: '16px 32px 24px' }}>
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
              {editing ? '编辑付款申请' : '发起流程'}
            </span>
            <Space>
              <FullscreenOutlined
                style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
              />
              <span
                onClick={() => {
                  setEditing(null);
                  setImageFileList([]);
                  setReceiptFileList([]);
                  setAddModalOpen(false);
                }}
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

          <Form form={addForm} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label={<span>日期</span>} name="date">
                  <Input
                    type="date"
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span>申请人</span>} name="applicant" rules={[{ required: true, message: '请输入申请人' }]}>
                  <Input placeholder="申请人" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span>部门</span>} name="department" rules={[{ required: true, message: '请选择部门' }]}>
                  <Select placeholder="请选择部门" options={departmentOptions} showSearch optionFilterProp="label" />
                </Form.Item>
              </Col>
            </Row>

            {/* 付款明细 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <Tag color="orange">付款明细</Tag>
              </div>
              <Table
                rowKey="key"
                columns={addDetailColumns}
                dataSource={detailItems}
                pagination={false}
                scroll={{ x: 1800 }}
                size="small"
                footer={() => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={addDetailItem}>
                      + 添加
                    </Button>
                    <Button type="dashed" icon={<UploadOutlined />} size="small">快速填报</Button>
                  </div>
                )}
              />
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Form.Item label="合计金额(小写)" name="totalAmount">
                  <Input placeholder="暂无内容" readOnly disabled />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="合计金额(大写)" name="totalAmountCapital">
                  <Input placeholder="暂无内容" readOnly disabled />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="车辆数量" name="vehicleCount">
                  <Input placeholder="暂无内容" readOnly disabled />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="总吨位" name="totalTonnage">
                  <Input placeholder="暂无内容" readOnly disabled />
                </Form.Item>
              </Col>
            </Row>

            {/* 付款信息 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <Tag color="blue">付款信息</Tag>
              </div>
              <div style={{ borderTop: '1px dashed #d9d9d9' }} />
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span>付款账户</span>} name="paymentAccount" rules={[{ required: true, message: '请选择付款账户' }]}>
                  <Radio.Group defaultValue="big">
                    <Radio value="big"><Tag color="blue">大账户</Tag></Radio>
                    <Radio value="small"><Tag color="orange">小账户</Tag></Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span>付款方式</span>} name="paymentMethod" rules={[{ required: true, message: '请选择付款方式' }]}>
                  <Radio.Group defaultValue="cash">
                    <Radio value="cash"><Tag color="red">现金</Tag></Radio>
                    <Radio value="bank"><Tag color="yellow">电汇</Tag></Radio>
                    <Radio value="transfer"><Tag color="green">承兑</Tag></Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="收款单位1" name="payeeName1">
                  <DictSelect
                    dict="payee"
                    placeholder="请选择收款单位（基础资料）"
                    onChange={(v) => fillPayeeBank(String(v || ''))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Form.Item label="开户行1" name="bankName1">
                  <Input placeholder="自动带出开户行" readOnly />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="银行账号1" name="bankAccount1">
                  <Input placeholder="请输入银行账号" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="收款账号1" name="payeeAccount1">
                  <Input placeholder="请输入收款账号" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Form.Item label="图片" required={false}>
                  <QrPhotoUpload
                    fileList={imageFileList}
                    onFiles={setImageFileList}
                    label="拍照/选择图片"
                    active={addModalOpen}
                    title="付款申请图片上传"
                    bizKey="payment-application-image"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Form.Item label="附件" name="attachment">
                  <Upload.Dragger
                    action="/upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    showUploadList={{ showPreviewIcon: false, showRemoveIcon: true }}
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">选择 拖拽或单击后粘贴文件，单个500MB以内</p>
                  </Upload.Dragger>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="付款事由" name="paymentReason">
                  <Input.TextArea
                    rows={6}
                    placeholder="请输入付款事由"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="付款回执单" required={false}>
                  <QrPhotoUpload
                    fileList={receiptFileList}
                    onFiles={setReceiptFileList}
                    label="拍照/选择回执单"
                    active={addModalOpen}
                    title="付款回执单上传"
                    bizKey="payment-application-receipt"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* 底部按钮 */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                loading={submitting}
                onClick={handleAddSubmit}
                style={{
                  flex: 1,
                  background: '#00a884',
                  borderColor: '#00a884',
                  height: 44,
                }}
              >
                {editing ? '保存修改' : '提交申请（钉钉通知）'}
              </Button>
              <Button
                size="large"
                onClick={handleSaveDraft}
                style={{ flex: 1, height: 44 }}
              >
                保存草稿
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <BizLinkDataModal
        open={detailLinkModalOpen}
        onCancel={() => setDetailLinkModalOpen(false)}
        sources={['settlement']}
        settlementStatusFilter="unsettled"
        requireUnitPrice
        title="选择数据（未结账且已填单价）"
        onSelect={(row) => {
          if (settlementPickerRowKey != null) {
            applySettlementToDetail(row as Record<string, unknown>, settlementPickerRowKey);
          }
          setDetailLinkModalOpen(false);
        }}
      />

      <PaymentDetailDrawer
        open={detailOpen}
        record={detailRecord}
        autoShowProcess={autoShowProcess}
        onClose={() => {
          setDetailOpen(false);
          setDetailRecord(null);
          setAutoShowProcess(false);
        }}
      />
    </div>
  );
}
