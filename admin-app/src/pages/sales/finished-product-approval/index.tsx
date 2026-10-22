import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, Button, Space, Tag, Input, Select, DatePicker, Modal, Form, Radio, Upload, InputNumber, message, Image } from 'antd';
import {
  PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined,
  HistoryOutlined, UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { makeEditColumn } from '@/components/TableEditColumn';
import BusinessJdySyncButtons from '@/components/BusinessJdySyncButtons';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import FinishedProductApprovalDetailDrawer from '@/components/FinishedProductApprovalDetailDrawer';
import { getJdyBusinessData, syncJdyFinishedProductApproval } from '@/api/jdy';
import { appendBizDataLog } from '@/api/bizRecordMeta';
import { getStoredUser } from '@/config/apps';
import { formatBizDateTime } from '@/utils/localBizStore';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd/es/upload/interface';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import { resolveNextSalesCode } from '@/utils/salesCode';

const BIZ_KEY = 'finished-product-approval';

interface ApprovalItem {
  key: string;
  dataId?: string;
  id?: number | string;
  code: string;
  deliveryDate: string;
  poundNo: string;
  syncDate: string;
  carNo: string;
  receiver: string;
  warehouse: string;
  productName: string;
  productNameColor: string;
  model: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  contractNo?: string;
  unitPrice: number;
  totalPrice: number;
  customer: string;
  address: string;
  contact: string;
  paymentStatus: string;
  outWeight: number;
  timeAmount: number;
  description: string;
  image?: string[] | string;
  attachment?: string[] | string;
  submitter: string;
  submitTime: string;
  updateTime: string;
  processStatus: string;
  currentNode: string;
  currentHandler: string;
}

function toUrlList(value?: string[] | string | null): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((u) => String(u || '').trim()).filter((u) => /^https?:\/\//i.test(u) || u.startsWith('/images/'));
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

const productNameColors: Record<string, string> = {
  '撕碎料': 'red',
  '废钢': 'green',
  '底盘料': 'orange',
  '铜线': 'blue',
  '铝件': 'cyan',
  '塑料': 'purple',
  '小件': 'magenta',
  '橡胶': 'gold',
  '其他1': 'geekblue',
  '其他2': 'volcano',
  '其他3': 'lime',
  '其他4': 'amber',
  '其他5': 'yellow',
  '其他6': 'pink',
};

const mockData: ApprovalItem[] = [
  {
    key: '1', code: '202608030...', deliveryDate: '2026-08-03 18:34:47', poundNo: 'XS20260803002',
    syncDate: '2026-08-03 10:10:38', carNo: '晋A6TS98', receiver: '冯张', warehouse: '',
    productName: '底盘料', productNameColor: 'orange', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '张三', submitTime: '2026-08-03 18:34:47', updateTime: '2026-08-03 18:34:47',
    processStatus: '已通过', currentNode: '已完成', currentHandler: '-'
  },
  {
    key: '2', code: '202608030...', deliveryDate: '2026-08-03 18:35:44', poundNo: 'XS20260803001',
    syncDate: '2026-08-03 10:09:20', carNo: '晋A6TS98', receiver: '冯张', warehouse: '',
    productName: '橡胶', productNameColor: 'gold', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '张三', submitTime: '2026-08-03 18:35:44', updateTime: '2026-08-03 18:35:44',
    processStatus: '已通过', currentNode: '已完成', currentHandler: '-'
  },
  {
    key: '3', code: '202608020...', deliveryDate: '2026-08-02 18:33:57', poundNo: 'XS20260802002',
    syncDate: '2026-08-02 13:39:24', carNo: '晋A6TS98', receiver: '冯张', warehouse: '',
    productName: '底盘料', productNameColor: 'orange', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '张三', submitTime: '2026-08-02 18:33:57', updateTime: '2026-08-02 18:33:57',
    processStatus: '审批中', currentNode: '部门审批', currentHandler: '李四'
  },
  {
    key: '4', code: '202608020...', deliveryDate: '2026-08-02 18:32:13', poundNo: 'XS20260802001',
    syncDate: '2026-08-02 13:37:20', carNo: '晋A6TS98', receiver: '冯张', warehouse: '',
    productName: '橡胶', productNameColor: 'gold', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '张三', submitTime: '2026-08-02 18:32:13', updateTime: '2026-08-02 18:32:13',
    processStatus: '审批中', currentNode: '部门审批', currentHandler: '李四'
  },
  {
    key: '5', code: '202608010...', deliveryDate: '2026-08-01 16:34:13', poundNo: 'XS20260801005',
    syncDate: '2026-08-01 16:43:14', carNo: '晋L73813', receiver: '丰驰', warehouse: '',
    productName: '撕碎料', productNameColor: 'red', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '王五', submitTime: '2026-08-01 16:34:13', updateTime: '2026-08-01 16:34:13',
    processStatus: '已通过', currentNode: '已完成', currentHandler: '-'
  },
  {
    key: '6', code: '202608010...', deliveryDate: '2026-08-01 16:15:50', poundNo: 'XS20260801004',
    syncDate: '2026-08-01 16:15:50', carNo: '晋L3456', receiver: '丰驰', warehouse: '',
    productName: '撕碎料', productNameColor: 'red', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '王五', submitTime: '2026-08-01 16:15:50', updateTime: '2026-08-01 16:15:50',
    processStatus: '已通过', currentNode: '已完成', currentHandler: '-'
  },
  {
    key: '7', code: '202608010...', deliveryDate: '2026-08-01 18:31:12', poundNo: 'XS20260801003',
    syncDate: '2026-08-01 16:02:10', carNo: '晋JRL297', receiver: '洪洞', warehouse: '',
    productName: '其他3', productNameColor: 'lime', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '赵六', submitTime: '2026-08-01 18:31:12', updateTime: '2026-08-01 18:31:12',
    processStatus: '已驳回', currentNode: '已完成', currentHandler: '-'
  },
  {
    key: '8', code: '202608010...', deliveryDate: '2026-08-01 18:30:58', poundNo: 'XS20260801002',
    syncDate: '2026-08-01 13:59:25', carNo: '晋JRL297', receiver: '洪洞', warehouse: '',
    productName: '其他3', productNameColor: 'lime', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '赵六', submitTime: '2026-08-01 18:30:58', updateTime: '2026-08-01 18:30:58',
    processStatus: '已驳回', currentNode: '已完成', currentHandler: '-'
  },
  {
    key: '9', code: '202608010...', deliveryDate: '2026-08-01 18:30:43', poundNo: 'XS20260801001',
    syncDate: '2026-08-01 09:12:07', carNo: '晋JRL297', receiver: '洪洞', warehouse: '',
    productName: '其他3', productNameColor: 'lime', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '赵六', submitTime: '2026-08-01 18:30:43', updateTime: '2026-08-01 18:30:43',
    processStatus: '审批中', currentNode: '总经理审批', currentHandler: '孙七'
  },
  {
    key: '10', code: '202607310...', deliveryDate: '2026-07-31 18:21:38', poundNo: 'XS20260731001',
    syncDate: '2026-07-31 17:24:05', carNo: '晋A6TS98', receiver: '冯张', warehouse: '',
    productName: '橡胶', productNameColor: 'gold', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '张三', submitTime: '2026-07-31 18:21:38', updateTime: '2026-07-31 18:21:38',
    processStatus: '已通过', currentNode: '已完成', currentHandler: '-'
  },
  {
    key: '11', code: '202607300...', deliveryDate: '2026-07-30 15:18:03', poundNo: 'XS20260730001',
    syncDate: '2026-07-30 15:05:55', carNo: '晋JRL297', receiver: '洪洞', warehouse: '',
    productName: '其他3', productNameColor: 'lime', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '赵六', submitTime: '2026-07-30 15:18:03', updateTime: '2026-07-30 15:18:03',
    processStatus: '已驳回', currentNode: '已完成', currentHandler: '-'
  },
  {
    key: '12', code: '202607310...', deliveryDate: '2026-07-30 15:17:53', poundNo: 'XS20260713007',
    syncDate: '2026-07-13 09:10:35', carNo: '晋L3456', receiver: '丰驰', warehouse: '',
    productName: '撕碎料', productNameColor: 'red', model: '',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '王五', submitTime: '2026-07-30 15:17:53', updateTime: '2026-07-30 15:17:53',
    processStatus: '已通过', currentNode: '已完成', currentHandler: '-'
  },
  {
    key: '13', code: '202607300...', deliveryDate: '2026-07-30 11:57:17', poundNo: '',
    syncDate: '2026-07-30', carNo: '晋L11155', receiver: '丰驰', warehouse: '成品库',
    productName: '撕碎料', productNameColor: 'red', model: '破碎',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '王五', submitTime: '2026-07-30 11:57:17', updateTime: '2026-07-30 11:57:17',
    processStatus: '审批中', currentNode: '部门审批', currentHandler: '李四'
  },
  {
    key: '14', code: '202607300...', deliveryDate: '2026-07-14 11:55:09', poundNo: '',
    syncDate: '2026-07-14', carNo: '晋L11155', receiver: '华成', warehouse: '成品库',
    productName: '撕碎料', productNameColor: 'red', model: '车',
    grossWeight: 0, tareWeight: 0, netWeight: 0, unitPrice: 0, totalPrice: 0,
    customer: '', address: '', contact: '', paymentStatus: '', outWeight: 0, timeAmount: 0,
    description: '', image: '', attachment: '',
    submitter: '孙八', submitTime: '2026-07-14 11:55:09', updateTime: '2026-07-14 11:55:09',
    processStatus: '已通过', currentNode: '已完成', currentHandler: '-'
  },
];

const baseColumns: ColumnsType<ApprovalItem> = [
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>,
    dataIndex: 'code',
    width: 140,
    fixed: 'left',
    render: (val: string) => <span>{val}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>出货日期</span>,
    dataIndex: 'deliveryDate',
    width: 160,
    sorter: true,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>磅单号</span>,
    dataIndex: 'poundNo',
    width: 160,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>过磅同步日期</span>,
    dataIndex: 'syncDate',
    width: 160,
    sorter: true,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>车号</span>,
    dataIndex: 'carNo',
    width: 120,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>收货单位</span>,
    dataIndex: 'receiver',
    width: 100,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>仓库</span>,
    dataIndex: 'warehouse',
    width: 100,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>品名</span>,
    dataIndex: 'productName',
    width: 100,
    render: (val: string, record: ApprovalItem) => (
      <Tag color={record.productNameColor}>{val}</Tag>
    ),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>型号</span>,
    dataIndex: 'model',
    width: 80,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>毛重</span>,
    dataIndex: 'grossWeight',
    width: 90,
    align: 'right',
    render: (val: number) => val ? val.toFixed(2) : '-',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>皮重</span>,
    dataIndex: 'tareWeight',
    width: 90,
    align: 'right',
    render: (val: number) => val ? val.toFixed(2) : '-',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>净重</span>,
    dataIndex: 'netWeight',
    width: 90,
    align: 'right',
    render: (val: number) => val ? val.toFixed(2) : '-',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>单价(RMB/吨含税)</span>,
    dataIndex: 'unitPrice',
    width: 140,
    align: 'right',
    render: (val: number) => val ? val.toFixed(2) : '-',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>总价(含税)</span>,
    dataIndex: 'totalPrice',
    width: 120,
    align: 'right',
    render: (val: number) => val ? val.toFixed(2) : '-',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>客户</span>,
    dataIndex: 'customer',
    width: 100,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>地址</span>,
    dataIndex: 'address',
    width: 120,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>联系方式</span>,
    dataIndex: 'contact',
    width: 120,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>回款情况</span>,
    dataIndex: 'paymentStatus',
    width: 100,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>出库吨重</span>,
    dataIndex: 'outWeight',
    width: 100,
    align: 'right',
    render: (val: number) => val ? val.toFixed(2) : '-',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>时间到账金额</span>,
    dataIndex: 'timeAmount',
    width: 120,
    align: 'right',
    render: (val: number) => val ? val.toFixed(2) : '-',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>情况说明</span>,
    dataIndex: 'description',
    width: 120,
  },
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
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>,
    dataIndex: 'submitTime',
    width: 160,
    sorter: true,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>,
    dataIndex: 'updateTime',
    width: 160,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>流程状态</span>,
    dataIndex: 'processStatus',
    width: 100,
    fixed: 'right',
    render: (val: string) => {
      const colorMap: Record<string, string> = {
        '已通过': 'green',
        '审批中': 'blue',
        '已驳回': 'red',
      };
      return <Tag color={colorMap[val] || 'default'}>{val}</Tag>;
    },
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>当前节点</span>,
    dataIndex: 'currentNode',
    width: 120,
    render: (val: string) => val !== '-' ? val : '',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>当前负责人</span>,
    dataIndex: 'currentHandler',
    width: 100,
    render: (val: string) => val !== '-' ? val : '',
  },
];

const productOptions = [
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
];

const beforeUpload = (file: UploadFile) => {
  const isLt5M = (file.size ?? 0) / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('文件大小不能超过 5MB!');
  }
  return isLt5M || false;
};

const FILTER_FIELDS = [
  { key: 'code', label: '编号' },
  { key: 'deliveryDate', label: '出货日期' },
  { key: 'poundNo', label: '磅单号' },
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
  return {
    ...(r as unknown as ApprovalItem),
    key: String(r.id ?? r.dataId ?? r.key ?? ''),
    dataId: r.dataId != null ? String(r.dataId) : undefined,
    id: r.id as number | string | undefined,
    description: String(r.description ?? r.remark ?? ''),
    productName,
    productNameColor: productNameColors[productName] || String(r.productNameColor || 'default'),
    image: toUrlList(r.image as string[] | string | null),
    attachment: toUrlList(r.attachment as string[] | string | null),
  };
}

export default function FinishedProductApproval() {
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

  const openDetail = (record: ApprovalItem) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJdyBusinessData('finished-product-approval', {
          pageNo,
          pageSize,
          keyword: keyword || undefined,
        });
        if (cancelled) return;
        const remote = ((res.data?.records || []) as Record<string, unknown>[]).map(mapSalesRow);
        setDataSource(remote);
        setTotal(res.data?.total || 0);
      } catch {
        if (!cancelled) {
          message.error('成品销售审批单加载失败，请稍后重试');
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
    setModalOpen(true);
    try {
      const code = await resolveNextSalesCode(
        'finished-product-approval',
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

  const toPickerDate = (value?: string | null) => {
    if (!value) return undefined;
    const d = dayjs(value);
    return d.isValid() ? d : undefined;
  };

  const handleEdit = (record: ApprovalItem) => {
    setEditing(record);
    setModalOpen(true);
    // destroyOnHidden 下先打开再赋值，避免 Form 未挂载；DatePicker 必须传 dayjs
    queueMicrotask(() => {
      form.setFieldsValue({
        ...record,
        deliveryDate: toPickerDate(record.deliveryDate),
        syncDate: toPickerDate(record.syncDate),
      });
    });
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
      let code = String(values.code || '').trim();
      if (!editing) {
        code = await resolveNextSalesCode(
          'finished-product-approval',
          dataSource.map((r) => r.code),
          values.deliveryDate || dayjs(),
        );
      }
      const payload = {
        ...values,
        code,
        deliveryDate: values.deliveryDate?.format?.('YYYY-MM-DD HH:mm:ss') || values.deliveryDate || '',
        syncDate: values.syncDate?.format?.('YYYY-MM-DD HH:mm:ss') || values.syncDate || '',
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
            summary: `${editing ? '更新' : '创建'}成品销售审批单：${saved.code || ''} ${saved.productName || ''}`.trim(),
            operatorName: operator,
          });
          setMetaTick((t) => t + 1);
        } catch {
          // 日志失败不阻断主流程
        }
      }
      setEditing(null);
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
            syncFn={syncJdyFinishedProductApproval}
            onSynced={() => {
              setPageNo(1);
              setReloadKey((k) => k + 1);
            }}
          />
          <Button icon={<ImportOutlined />}>导入</Button>
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
            onChange: (p, s) => {
              setPageNo(p);
              setPageSize(s);
            },
          })}
          bordered
          size="middle"
          scroll={{ x: 3200 }}
        />
      </div>

      {/* 添加表单弹窗 */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => { setEditing(null); setModalOpen(false); }}
        footer={null}
        width={isMobile ? '100%' : 1280}
        destroyOnHidden
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' } }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, padding: '16px 24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#333' }}>{editing ? '编辑成品销售审批单' : '成品销售审批单'}</h2>
          <Form
            form={form}
            layout="vertical"
            className="approval-form"
          >
            {/* 第一行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="code"
                label="编号"
                style={{ flex: 1 }}
              >
                <Input placeholder="自动生成无需填写" disabled />
              </Form.Item>
              <Form.Item
                name="deliveryDate"
                label="出货日期"
                rules={[{ required: true, message: '请选择出货日期' }]}
                style={{ flex: 1 }}
              >
                <DatePicker showTime style={{ width: '100%' }} placeholder="请选择" />
              </Form.Item>
            </div>

            {/* 第二行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="poundNo"
                label="磅单号"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="syncDate"
                label="过磅同步日期"
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择" />
              </Form.Item>
            </div>

            {/* 第三行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="carNo"
                label="车号"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="receiver"
                label="收货单位"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="warehouse"
                label="仓库"
                style={{ flex: 1 }}
              >
                <Select placeholder="请选择" options={[{ label: '成品库', value: '成品库' }]} />
              </Form.Item>
            </div>

            {/* 品名和型号 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="productName"
                label="品名"
                rules={[{ required: true, message: '请选择品名' }]}
                style={{ flex: 2 }}
              >
                <Radio.Group>
                  <Space direction="vertical" size={[8, 8]}>
                    <Space wrap>
                      <Radio value="撕碎料"><Tag color="red">撕碎料</Tag></Radio>
                      <Radio value="废钢"><Tag color="green">废钢</Tag></Radio>
                      <Radio value="底盘料"><Tag color="orange">底盘料</Tag></Radio>
                      <Radio value="铜线"><Tag color="blue">铜线</Tag></Radio>
                      <Radio value="铝件"><Tag color="cyan">铝件</Tag></Radio>
                    </Space>
                    <Space wrap>
                      <Radio value="塑料"><Tag color="purple">塑料</Tag></Radio>
                      <Radio value="小件"><Tag color="magenta">小件</Tag></Radio>
                      <Radio value="橡胶"><Tag color="gold">橡胶</Tag></Radio>
                      <Radio value="其他1"><Tag color="geekblue">其他1</Tag></Radio>
                      <Radio value="其他2"><Tag color="volcano">其他2</Tag></Radio>
                    </Space>
                    <Space wrap>
                      <Radio value="其他3"><Tag color="lime">其他3</Tag></Radio>
                      <Radio value="其他4"><Tag color="amber">其他4</Tag></Radio>
                      <Radio value="其他5"><Tag color="yellow">其他5</Tag></Radio>
                      <Radio value="其他6"><Tag color="pink">其他6</Tag></Radio>
                    </Space>
                  </Space>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="model"
                label="型号"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第四行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="grossWeight"
                label="毛重"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="tareWeight"
                label="皮重"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="netWeight"
                label="净重"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="contractNo"
                label="合同编号"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第五行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="unitPrice"
                label="单价(RMB/吨含税)"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="totalPrice"
                label="总价(含税)"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="customer"
                label="客户"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="address"
                label="地址"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第六行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="contact"
                label="联系方式"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="paymentStatus"
                label="回款情况"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="outWeight"
                label="出库吨重"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="timeAmount"
                label="时间到账金额"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
            </div>

            {/* 情况说明 */}
            <Form.Item
              name="description"
              label="情况说明"
              style={{ marginBottom: 16 }}
            >
              <Input.TextArea rows={4} placeholder="请输入情况说明" />
            </Form.Item>

            {/* 图片和附件 */}
            <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
              <Form.Item
                name="images"
                label="图片"
                style={{ flex: 1 }}
                valuePropName="fileList"
                getValueFromEvent={(e: any) => (Array.isArray(e) ? e : e?.fileList)}
              >
                <Upload
                  listType="picture"
                  multiple
                  beforeUpload={beforeUpload}
                  accept="image/*"
                >
                  <div>
                    <UploadOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <div style={{ marginTop: 8, color: '#1890ff' }}>选择</div>
                    <div style={{ fontSize: 12, color: '#999' }}>拖拽或单击上传</div>
                  </div>
                </Upload>
              </Form.Item>
              <Form.Item
                name="attachments"
                label="附件"
                style={{ flex: 1 }}
                valuePropName="fileList"
                getValueFromEvent={(e: any) => (Array.isArray(e) ? e : e?.fileList)}
              >
                <Upload
                  multiple
                  beforeUpload={beforeUpload}
                >
                  <div>
                    <UploadOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <div style={{ marginTop: 8, color: '#1890ff' }}>选择</div>
                    <div style={{ fontSize: 12, color: '#999' }}>拖拽或单击后上传</div>
                  </div>
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
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-start', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
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

      <FinishedProductApprovalDetailDrawer
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
