import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, Button, Space, Tag, Input, Select, DatePicker, Modal, Form, Radio, Upload, InputNumber, message, Image } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined,
  HistoryOutlined, UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { makeEditColumn } from '@/components/TableEditColumn';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import PartApprovalDetailDrawer from '@/components/PartApprovalDetailDrawer';
import { getJdyBusinessData, syncJdyPartApproval } from '@/api/jdy';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import { getStoredUser } from '@/config/apps';
import { formatBizDateTime } from '@/utils/localBizStore';
import dayjs from 'dayjs';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { resolveNextSalesCode } from '@/utils/salesCode';

const BIZ_KEY = 'part-approval';

interface ApprovalItem {
  key: string;
  dataId?: string;
  id?: number | string;
  code: string;
  deliveryDate: string;
  syncDate: string;
  carNo: string;
  receiver: string;
  warehouse: string;
  productName: string;
  productNameColor: string;
  model: string;
  grossWeight: number | string;
  tareWeight: number | string;
  netWeight: number | string;
  contractNo: string;
  unitPrice: number | string;
  totalPrice: number | string;
  customer: string;
  address: string;
  contact: string;
  paymentStatus: string;
  outWeight: number | string;
  actualAmount: number | string;
  description: string;
  image?: string[] | string;
  attachment?: string[] | string;
  hasImage: boolean;
  hasAttachment: boolean;
  submitter: string;
  submitTime: string;
  updateTime: string;
  processStatus: string;
  processStatusColor: string;
  currentNode: string;
  currentHandler: string;
}

function toUrlList(value?: string[] | string | null): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((u) => String(u || '').trim()).filter((u) => /^https?:\/\//i.test(u) || u.startsWith('/images/'));
}

function urlsToFileList(urls: string[] = []): UploadFile[] {
  return urls.map((url, i) => ({
    uid: `${i}-${url}`,
    name: url.split('/').pop() || `file-${i + 1}`,
    status: 'done' as const,
    url,
  }));
}

function ImageStack({ urls }: { urls?: string[] | string | null }) {
  const list = toUrlList(urls);
  if (list.length === 0) {
    return <span style={{ color: '#999' }}>-</span>;
  }
  const preview = list.slice(0, 3);
  return (
    <Image.PreviewGroup items={list}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {preview.map((url, i) => (
          <Image
            key={`${url}-${i}`}
            src={url}
            width={48}
            height={36}
            style={{
              objectFit: 'cover',
              borderRadius: 4,
              marginLeft: i > 0 ? -10 : 0,
              border: '1px solid #f0f0f0',
            }}
          />
        ))}
        {list.length > 3 && (
          <span style={{ marginLeft: 4, color: '#666', fontSize: 12 }}>+{list.length - 3}</span>
        )}
      </div>
    </Image.PreviewGroup>
  );
}

function AttachmentLinks({ urls }: { urls?: string[] | string | null }) {
  const list = toUrlList(urls);
  if (list.length === 0) {
    return <span style={{ color: '#999' }}>-</span>;
  }
  return (
    <Space size={4} wrap>
      {list.map((url, i) => (
        <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer">
          附件{list.length > 1 ? i + 1 : ''}
        </a>
      ))}
    </Space>
  );
}

const productColors: Record<string, string> = {
  '撕碎料': 'red',
  '废钢': 'green',
  '底盘料': 'orange',
  '铜线': 'blue',
  '组件': 'geekblue',
  '塑料': 'purple',
  '小件': 'magenta',
  '橡胶': 'gold',
  '其他1': 'default',
  '其他2': 'green',
  '其他3垃圾': 'lime',
  '其他4': 'green',
  '其他5': 'orange',
  '其他6': 'purple',
};

const mockData: ApprovalItem[] = [
  { key: '1', code: 'XS20260803001', deliveryDate: '2026-08-03 18:03:42', syncDate: '2026.8.3', carNo: '晋LG330M', receiver: '散户', warehouse: '成品库', productName: '塑料', productNameColor: 'purple', model: '尾灯', grossWeight: 0.01, tareWeight: 0, netWeight: 0.01, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: '', description: '', hasImage: true, hasAttachment: false, submitter: '张三', submitTime: '2026-08-03 18:03:42', updateTime: '2026-08-03 18:03:42', processStatus: '审批中', processStatusColor: 'processing', currentNode: '经理审批', currentHandler: '李四' },
  { key: '2', code: 'XS20260803002', deliveryDate: '2026-08-03 18:02:43', syncDate: '2026.8.3', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '塑料', productNameColor: 'purple', model: '大灯', grossWeight: 0.002, tareWeight: 0, netWeight: 0.002, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: '', description: '', hasImage: false, hasAttachment: false, submitter: '张三', submitTime: '2026-08-03 18:02:43', updateTime: '2026-08-03 18:02:43', processStatus: '审批中', processStatusColor: 'processing', currentNode: '经理审批', currentHandler: '李四' },
  { key: '3', code: 'XS20260803003', deliveryDate: '2026-08-03 08:55:20', syncDate: '2026.8.3', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '其他6', productNameColor: 'purple', model: '其他1', grossWeight: 0, tareWeight: 0, netWeight: 0, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: '', description: '', hasImage: false, hasAttachment: false, submitter: '王五', submitTime: '2026-08-03 08:55:20', updateTime: '2026-08-03 08:55:20', processStatus: '已通过', processStatusColor: 'green', currentNode: '已完成', currentHandler: '-' },
  { key: '4', code: 'XS20260803004', deliveryDate: '2026-08-03 08:54:12', syncDate: '2026.8.3', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '其他3垃圾', productNameColor: 'lime', model: '其他3', grossWeight: 0.07, tareWeight: 0, netWeight: 0.07, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: '', description: '', hasImage: true, hasAttachment: true, submitter: '王五', submitTime: '2026-08-03 08:54:12', updateTime: '2026-08-03 08:54:12', processStatus: '审批中', processStatusColor: 'processing', currentNode: '经理审批', currentHandler: '李四' },
  { key: '5', code: 'XS20260802001', deliveryDate: '2026-08-02 18:15:34', syncDate: '2026.8.2', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '其他6', productNameColor: 'purple', model: '三元切割费', grossWeight: 0, tareWeight: 0, netWeight: 0, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: '', description: '', hasImage: false, hasAttachment: false, submitter: '赵六', submitTime: '2026-08-02 18:15:34', updateTime: '2026-08-02 18:15:34', processStatus: '已通过', processStatusColor: 'green', currentNode: '已完成', currentHandler: '-' },
  { key: '6', code: 'XS20260802002', deliveryDate: '2026-08-02 18:14:41', syncDate: '2026.8.2', carNo: '晋LG330M', receiver: '散户', warehouse: '成品库', productName: '塑料', productNameColor: 'purple', model: '尾灯', grossWeight: 0.014, tareWeight: 0, netWeight: 0.014, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: '', description: '', hasImage: false, hasAttachment: false, submitter: '赵六', submitTime: '2026-08-02 18:14:41', updateTime: '2026-08-02 18:14:41', processStatus: '已驳回', processStatusColor: 'red', currentNode: '已驳回', currentHandler: '-' },
  { key: '7', code: 'XS20260802003', deliveryDate: '2026-08-02 18:13:42', syncDate: '2026.8.2', carNo: '晋LG330M', receiver: '散户', warehouse: '成品库', productName: '铜线', productNameColor: 'blue', model: '电脑板', grossWeight: 0.001, tareWeight: 0, netWeight: 0.001, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: '', description: '', hasImage: true, hasAttachment: false, submitter: '赵六', submitTime: '2026-08-02 18:13:42', updateTime: '2026-08-02 18:13:42', processStatus: '审批中', processStatusColor: 'processing', currentNode: '经理审批', currentHandler: '李四' },
  { key: '8', code: 'XS20260802004', deliveryDate: '2026-08-02 18:12:16', syncDate: '2026.8.2', carNo: '晋LG330M', receiver: '散户', warehouse: '成品库', productName: '小件', productNameColor: 'magenta', model: 'CD机', grossWeight: 0.002, tareWeight: 0, netWeight: 0.002, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: '', description: '', hasImage: false, hasAttachment: false, submitter: '孙八', submitTime: '2026-08-02 18:12:16', updateTime: '2026-08-02 18:12:16', processStatus: '已通过', processStatusColor: 'green', currentNode: '已完成', currentHandler: '-' },
  { key: '9', code: 'XS20260801001', deliveryDate: '2026-08-01 16:41:09', syncDate: '2026.8.1', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '塑料', productNameColor: 'purple', model: '大灯', grossWeight: 0.011, tareWeight: 0, netWeight: 0.011, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: '', description: '', hasImage: false, hasAttachment: false, submitter: '孙八', submitTime: '2026-08-01 16:41:09', updateTime: '2026-08-01 16:41:09', processStatus: '审批中', processStatusColor: 'processing', currentNode: '经理审批', currentHandler: '李四' },
  { key: '10', code: 'XS20260730001', deliveryDate: '2026-07-30 18:37:04', syncDate: '2026.7.30', carNo: '晋L155N5', receiver: '散户', warehouse: '成品库', productName: '其他2', productNameColor: 'green', model: '废汽油', grossWeight: 0.024, tareWeight: 0, netWeight: 0.024, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: '', description: '', hasImage: false, hasAttachment: true, submitter: '王五', submitTime: '2026-07-30 18:37:04', updateTime: '2026-07-30 18:37:04', processStatus: '已通过', processStatusColor: 'green', currentNode: '已完成', currentHandler: '-' },
];

const formatVal = (val: number | string | null | undefined) => {
  if (val == null || val === '') return '-';
  if (typeof val === 'string') return val;
  const n = Number(val);
  if (!Number.isFinite(n)) return '-';
  return n.toFixed(n % 1 === 0 ? 0 : 3);
};

const baseColumns: ColumnsType<ApprovalItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>, dataIndex: 'code', width: 140, fixed: 'left' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>出货日期</span>, dataIndex: 'deliveryDate', width: 160, sorter: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅同步日期</span>, dataIndex: 'syncDate', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车号</span>, dataIndex: 'carNo', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>收货单位</span>, dataIndex: 'receiver', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>仓库</span>, dataIndex: 'warehouse', width: 90 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>品名</span>,
    dataIndex: 'productName',
    width: 110,
    render: (val: string, record: ApprovalItem) => (
      <Tag color={record.productNameColor}>{val}</Tag>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>型号</span>, dataIndex: 'model', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>毛重</span>, dataIndex: 'grossWeight', width: 90, align: 'right', render: formatVal },
  { title: <span style={{ whiteSpace: 'nowrap' }}>皮重</span>, dataIndex: 'tareWeight', width: 90, align: 'right', render: formatVal },
  { title: <span style={{ whiteSpace: 'nowrap' }}>净重</span>, dataIndex: 'netWeight', width: 90, align: 'right', render: formatVal },
  { title: <span style={{ whiteSpace: 'nowrap' }}>合同编号</span>, dataIndex: 'contractNo', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>单价(RMB/吨不含税)</span>, dataIndex: 'unitPrice', width: 160, align: 'right', render: formatVal },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>总价(不含税)</span>,
    dataIndex: 'totalPrice',
    width: 130,
    align: 'right',
    render: (val: number | string) => {
      if (typeof val === 'string' || !val) return '-';
      return <span style={{ color: '#f5222d' }}>{Number(val).toLocaleString()}</span>;
    },
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>客户</span>, dataIndex: 'customer', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>地址</span>, dataIndex: 'address', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>联系方式</span>, dataIndex: 'contact', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>回款情况</span>,
    dataIndex: 'paymentStatus',
    width: 100,
    render: (val: string) => <Tag color={val === '已回款' ? 'green' : 'orange'}>{val}</Tag>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>出库吨重</span>, dataIndex: 'outWeight', width: 100, align: 'right', render: formatVal },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>实际到账金额</span>,
    dataIndex: 'actualAmount',
    width: 130,
    align: 'right',
    render: (val: number | string) => {
      if (typeof val === 'string' || !val) return '-';
      return <span style={{ color: '#52c41a' }}>{Number(val).toLocaleString()}</span>;
    },
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>情况说明</span>, dataIndex: 'description', width: 150 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>图片</span>,
    dataIndex: 'image',
    width: 140,
    render: (val: string[] | string) => <ImageStack urls={val} />,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>附件</span>,
    dataIndex: 'attachment',
    width: 100,
    render: (val: string[] | string) => <AttachmentLinks urls={val} />,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 160, sorter: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 160 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>流程状态</span>,
    dataIndex: 'processStatus',
    width: 100,
    render: (val: string, record: ApprovalItem) => <Tag color={record.processStatusColor}>{val}</Tag>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>当前节点</span>, dataIndex: 'currentNode', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>当前负责人</span>, dataIndex: 'currentHandler', width: 100 },
];

const FILTER_FIELDS = [
  { key: 'code', label: '编号' },
  { key: 'deliveryDate', label: '出货日期' },
  { key: 'syncDate', label: '过磅同步日期' },
  { key: 'carNo', label: '车号' },
  { key: 'receiver', label: '收货单位' },
  { key: 'warehouse', label: '仓库' },
  { key: 'productName', label: '品名' },
  { key: 'model', label: '型号' },
  { key: 'contractNo', label: '合同编号' },
  { key: 'customer', label: '客户' },
  { key: 'paymentStatus', label: '回款情况' },
  { key: 'description', label: '情况说明' },
];

function salesRecordKey(record: Pick<ApprovalItem, 'key' | 'dataId' | 'id'> | null | undefined) {
  if (!record) return undefined;
  if (record.dataId) return String(record.dataId);
  if (record.id != null && record.id !== '') return String(record.id);
  if (record.key) return String(record.key);
  return undefined;
}

function mapSalesRow(r: Record<string, unknown>): ApprovalItem {
  const productName = String(r.productName || '');
  const processStatus = String(r.processStatus || '');
  const processStatusColor =
    processStatus === '已通过' || processStatus === '已完成'
      ? 'green'
      : processStatus === '已驳回'
        ? 'red'
        : processStatus
          ? 'processing'
          : 'default';
  const image = toUrlList(r.image as string[] | string | null);
  const attachment = toUrlList(r.attachment as string[] | string | null);
  return {
    ...(r as unknown as ApprovalItem),
    key: String(r.id ?? r.dataId ?? r.key ?? ''),
    dataId: r.dataId != null ? String(r.dataId) : undefined,
    id: r.id as number | string | undefined,
    description: String(r.description ?? r.remark ?? ''),
    productName,
    productNameColor: productColors[productName] || String(r.productNameColor || 'default'),
    processStatus,
    processStatusColor: String(r.processStatusColor || processStatusColor),
    image,
    attachment,
    hasImage: image.length > 0,
    hasAttachment: attachment.length > 0,
  };
}

export default function PartApproval() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [dataSource, setDataSource] = useState<ApprovalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalItem | null>(null);
  const [metaTick, setMetaTick] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ApprovalItem | null>(null);
  const [form] = Form.useForm();

  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [attachmentFileList, setAttachmentFileList] = useState<UploadFile[]>([]);

  const openDetail = (record: ApprovalItem) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('part-approval', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        setDataSource(((res.data?.records || []) as Record<string, unknown>[]).map(mapSalesRow));
        setTotal(res.data?.total || 0);
      } catch {
        if (!cancelled) {
          message.error('配件销售审批单加载失败，请稍后重试');
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

  const handleAdd = async () => {
    setEditing(null);
    form.resetFields();
    setImageFileList([]);
    setAttachmentFileList([]);
    setModalOpen(true);
    try {
      const code = await resolveNextSalesCode(
        'part-approval',
        dataSource.map((r) => r.code),
        dayjs(),
      );
      form.setFieldsValue({ code, deliveryDate: dayjs() });
    } catch {
      // 编号失败不阻断打开表单，提交时再试
    }
  };

  /** 工作台「发起流程」带 ?create=1 时自动打开新建 */
  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    void handleAdd();
    const next = new URLSearchParams(searchParams);
    next.delete('create');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅响应 create 参数
  }, [searchParams.get('create')]);

  const handleEdit = (record: ApprovalItem) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      deliveryDate: record.deliveryDate ? dayjs(record.deliveryDate) : undefined,
    });
    setImageFileList(urlsToFileList(toUrlList(record.image)));
    setAttachmentFileList(urlsToFileList(toUrlList(record.attachment)));
    setModalOpen(true);
  };

  const columns: ColumnsType<ApprovalItem> = [
    ...baseColumns.map((col) => {
      if ('dataIndex' in col && col.dataIndex === 'code') {
        return {
          ...col,
          render: (val: string, record: ApprovalItem) => (
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
      fixed: 'right' as const,
      render: (_: unknown, record: ApprovalItem) => (
        <Button type="link" size="small" onClick={() => openDetail(record)}>
          详情
        </Button>
      ),
    },
    makeEditColumn<ApprovalItem>(handleEdit),
  ];

  const handleModalOk = async (saveDraft: boolean) => {
    try {
      const values = await form.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      const operator = user.nickname || user.username || '系统';
      const image = imageFileList.map((f) => f.url || f.thumbUrl || '').filter(Boolean);
      const attachment = attachmentFileList.map((f) => f.url || f.thumbUrl || '').filter(Boolean);
      let code = String(values.code || '').trim();
      if (!editing) {
        code = await resolveNextSalesCode(
          'part-approval',
          dataSource.map((r) => r.code),
          values.deliveryDate || dayjs(),
        );
      }
      const payload = {
        ...values,
        code,
        deliveryDate: values.deliveryDate?.format?.('YYYY-MM-DD HH:mm:ss') || values.deliveryDate || '',
        image,
        attachment,
        hasImage: image.length > 0,
        hasAttachment: attachment.length > 0,
        submitter: editing?.submitter || operator,
        submitTime: editing?.submitTime || now,
        updateTime: now,
      };
      let saved: ApprovalItem;
      if (editing) {
        saved = { ...editing, ...payload };
        setDataSource((prev) => prev.map((r) => (r.key === editing.key ? saved : r)));
        message.success(saveDraft ? '草稿保存成功' : '修改成功');
      } else {
        saved = {
          key: String(Date.now()),
          ...payload,
        } as ApprovalItem;
        setDataSource((prev) => [saved, ...prev]);
        message.success(saveDraft ? '草稿保存成功' : '提交成功');
      }
      const recordKey = salesRecordKey(saved);
      if (recordKey) {
        try {
          await appendBizDataLog(BIZ_KEY, recordKey, {
            action: editing ? '更新' : '创建',
            summary: `${editing ? '更新' : '创建'}配件销售审批单：${saved.code || ''} ${saved.productName || ''}`.trim(),
            operatorName: operator,
          });
          setMetaTick((t) => t + 1);
        } catch {
          // 日志失败不阻断主流程
        }
      }
      setEditing(null);
      setImageFileList([]);
      setAttachmentFileList([]);
      setModalOpen(false);
    } catch {
      message.error('请填写必要信息');
    }
  };

  const metaRecordKey = salesRecordKey(editing);
  const formMeta = {
    submitter: editing?.submitter || getStoredUser().nickname || getStoredUser().username || '-',
    submitTime: editing?.submitTime || '-',
    updateTime: editing?.updateTime || '-',
  };

  const imageUploadProps: UploadProps = {
    listType: 'picture',
    fileList: imageFileList,
    onChange: ({ fileList }) => setImageFileList(fileList),
    beforeUpload: () => false,
  };

  const attachmentUploadProps: UploadProps = {
    fileList: attachmentFileList,
    onChange: ({ fileList }) => setAttachmentFileList(fileList),
    beforeUpload: () => false,
  };

  return (
    <div className="page-container">
      <div
        style={{
          padding: '8px 16px',
          background: '#fffbe6',
          color: '#ad6800',
          borderBottom: '1px solid #ffe58f',
        }}
      >
        本页读本地库，打开即可。「同步」有数据时增量、无数据时全量；「重新同步所有」仅全量拉取本菜单数据（与空数据时同步相同）。
      </div>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
          <BusinessJdySyncButtons
            syncFn={syncJdyPartApproval}
            onSynced={() => {
              setPageNo(1);
              setReloadKey((k) => k + 1);
            }}
          />
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>删除</Button>
          <Button icon={<HistoryOutlined />}>操作记录</Button>
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

      <div style={{ padding: 16 }}>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={displayData}
          loading={loading}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={withMobilePagination(isMobile, {
            current: pageNo,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => {
              setPageNo(p);
              setPageSize(s);
            },
          })}
          bordered
          size="middle"
          scroll={{ x: 4000 }}
        />
      </div>

      {/* 添加表单弹窗 */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => {
          setEditing(null);
          setImageFileList([]);
          setAttachmentFileList([]);
          setModalOpen(false);
        }}
        footer={null}
        width={isMobile ? '100%' : 1280}
        destroyOnHidden
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' } }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, padding: '16px 24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#333' }}>{editing ? '编辑配件销售审批单' : '配件销售审批单'}</h2>
          <Form form={form} layout="vertical">
            {/* 第一行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="code" label="编号" style={{ flex: 1 }}>
                <Input placeholder="自动生成无需填写" disabled />
              </Form.Item>
              <Form.Item name="deliveryDate" label="出货日期" rules={[{ required: true, message: '请选择出货日期' }]} style={{ flex: 1 }}>
                <DatePicker showTime style={{ width: '100%' }} placeholder="请选择" />
              </Form.Item>
              <Form.Item name="syncDate" label="过磅同步日期" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="carNo" label="车号" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第二行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="receiver" label="收货单位" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="warehouse" label="仓库" style={{ flex: 1 }}>
                <Select placeholder="请选择" options={[{ label: '成品库', value: '成品库' }]} />
              </Form.Item>
            </div>

            {/* 品名和型号 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="productName" label="品名" rules={[{ required: true, message: '请选择品名' }]} style={{ flex: 2 }}>
                <Radio.Group>
                  <Space direction="vertical" size={[8, 8]}>
                    <Space wrap>
                      <Radio value="撕碎料"><Tag color="red">撕碎料</Tag></Radio>
                      <Radio value="废钢"><Tag color="green">废钢</Tag></Radio>
                      <Radio value="底盘料"><Tag color="orange">底盘料</Tag></Radio>
                      <Radio value="铜线"><Tag color="blue">铜线</Tag></Radio>
                      <Radio value="组件"><Tag color="geekblue">组件</Tag></Radio>
                    </Space>
                    <Space wrap>
                      <Radio value="塑料"><Tag color="purple">塑料</Tag></Radio>
                      <Radio value="小件"><Tag color="magenta">小件</Tag></Radio>
                      <Radio value="橡胶"><Tag color="gold">橡胶</Tag></Radio>
                      <Radio value="其他1"><Tag color="default">其他1</Tag></Radio>
                      <Radio value="其他2"><Tag color="green">其他2</Tag></Radio>
                    </Space>
                    <Space wrap>
                      <Radio value="其他3垃圾"><Tag color="lime">其他3垃圾</Tag></Radio>
                      <Radio value="其他4"><Tag color="green">其他4</Tag></Radio>
                      <Radio value="其他5"><Tag color="orange">其他5</Tag></Radio>
                      <Radio value="其他6"><Tag color="purple">其他6</Tag></Radio>
                    </Space>
                  </Space>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="model" label="型号" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第三行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="grossWeight" label="毛重" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="tareWeight" label="皮重" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="netWeight" label="净重" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="contractNo" label="合同编号" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第四行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="unitPrice" label="单价(RMB/吨不含税)" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="totalPrice" label="总价(不含税)" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="customer" label="客户" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="address" label="地址" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第五行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="contact" label="联系方式" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="paymentStatus" label="回款情况" style={{ flex: 1 }}>
                <Select placeholder="请选择" options={[
                  { label: '已回款', value: '已回款' },
                  { label: '未回款', value: '未回款' },
                ]} />
              </Form.Item>
              <Form.Item name="outWeight" label="出库吨重" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="actualAmount" label="实际到账金额" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
            </div>

            {/* 情况说明 */}
            <Form.Item name="description" label="情况说明" style={{ marginBottom: 24 }}>
              <Input.TextArea rows={4} placeholder="请输入情况说明" />
            </Form.Item>

            {/* 图片和附件 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <Form.Item label="图片" style={{ flex: 1, marginBottom: 0 }}>
                <Upload {...imageUploadProps}>
                  <Button icon={<UploadOutlined />}>选择</Button>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>拖拽或单击上传</div>
                </Upload>
              </Form.Item>
              <Form.Item label="附件" style={{ flex: 1, marginBottom: 0 }}>
                <Upload {...attachmentUploadProps}>
                  <Button icon={<UploadOutlined />}>选择</Button>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>拖拽或单击后粘贴</div>
                </Upload>
              </Form.Item>
            </div>

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

            {/* 底部按钮 */}
            <div style={{ display: 'flex', gap: 16, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
              <Button type="primary" size="large" onClick={() => handleModalOk(false)}>提交</Button>
              <Button size="large" onClick={() => handleModalOk(true)}>保存草稿</Button>
            </div>
          </Form>
          </div>
          {!isMobile && (
            <div style={{ width: 280, flexShrink: 0, padding: '16px 16px 16px 0' }} key={`${metaRecordKey || 'new'}-${metaTick}`}>
              <BizRecordSidePanel bizKey={BIZ_KEY} recordKey={metaRecordKey} height={520} />
            </div>
          )}
        </div>
      </Modal>

      <PartApprovalDetailDrawer
        open={detailOpen}
        record={detailRecord}
        onClose={() => {
          setDetailOpen(false);
          setDetailRecord(null);
        }}
      />
    </div>
  );
}
