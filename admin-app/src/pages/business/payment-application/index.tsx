import { useState } from 'react';
import { useBizDataWithLocal } from '@/hooks/useBizDataWithLocal';
import { findPayeeBySelectValue } from '@/utils/payeeStore';
import DictSelect from '@/components/DictSelect';
import BizLinkDataModal from '@/components/BizLinkDataModal';
import { getStoredUser } from '@/config/apps';
import { useDepartmentOptions } from '@/config/departments';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Dropdown,
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
  FilterOutlined,
  ColumnWidthOutlined,
  FullscreenOutlined,
  MoreOutlined,
  EditOutlined,
  DatabaseOutlined,
  DownOutlined,
  UploadOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

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
  payeeName2: string;
  payeeAccount2: string;
  bankName2: string;
  bankAccount2: string;
  attachment: string;
  paymentReason: string;
  paymentReceipt: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
  processStatus: string;
  currentNode: string;
  currentHandler: string;
}

const mockDetailItems: PaymentDetailItem[] = [
  {
    key: 1,
    serialNo: 1,
    vehicleVin: '6G0436',
    overweightDate: '2026-07-28',
    plateNo: '晋MKS296',
    vehicleType: '3厢小轿车',
    vehicleModel: '大众朗逸',
    supplier: '张三',
    salesman: '李四',
    returnLocation: '太原',
    tonnage: '1.5',
    iron: '0.8',
    aluminum: '0.2',
    ternary: '0.1',
    battery: '0.05',
    kgDiff: '0.02',
    deductNetWeight: '0.1',
    deductBattery: '0.05',
    goodCondition: '0.2',
    deductTwoBox: '0.1',
    deductBreadBox: '0.05',
    deductIronRing: '0.02',
    deductDiesel: '0.03',
    selfDelivery: '0',
    deductSmallParts: '0.01',
    unitPrice: '3500',
    totalPrice: '5250',
    remark: '正常',
  },
  {
    key: 2,
    serialNo: 2,
    vehicleVin: '6G0435',
    overweightDate: '2026-07-28',
    plateNo: '晋LFX299',
    vehicleType: '面包车',
    vehicleModel: '五菱宏光',
    supplier: '王五',
    salesman: '赵六',
    returnLocation: '临汾',
    tonnage: '1.2',
    iron: '0.6',
    aluminum: '0.15',
    ternary: '0.08',
    battery: '0.04',
    kgDiff: '0.01',
    deductNetWeight: '0.08',
    deductBattery: '0.04',
    goodCondition: '0.15',
    deductTwoBox: '0.08',
    deductBreadBox: '0.04',
    deductIronRing: '0.01',
    deductDiesel: '0.02',
    selfDelivery: '0.05',
    deductSmallParts: '0.01',
    unitPrice: '3200',
    totalPrice: '3840',
    remark: '自送',
  },
];


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

const columns: ColumnsType<PaymentApplicationItem> = [
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
    render: (val: string) => (val === 'big' ? '大账户' : '小账户'),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>付款方式</span>,
    dataIndex: 'paymentMethod',
    width: 100,
    render: (val: string) => {
      const map: Record<string, string> = { cash: '现金', bank: '电汇', transfer: '承兑' };
      return map[val] || val;
    },
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>收款单位1</span>, dataIndex: 'payeeName1', width: 140 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>收款账号1</span>, dataIndex: 'payeeAccount1', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>开户行1</span>, dataIndex: 'bankName1', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>银行账号1</span>, dataIndex: 'bankAccount1', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>图片</span>, dataIndex: 'image', width: 80, render: () => '-' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>收款单位2</span>, dataIndex: 'payeeName2', width: 140 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>收款账号2</span>, dataIndex: 'payeeAccount2', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>开户行2</span>, dataIndex: 'bankName2', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>银行账号2</span>, dataIndex: 'bankAccount2', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>附件</span>, dataIndex: 'attachment', width: 80, render: () => '-' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>付款事由</span>, dataIndex: 'paymentReason', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>付款回执单</span>, dataIndex: 'paymentReceipt', width: 110, render: () => '-' },
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
  const departmentOptions = useDepartmentOptions();
  const {
    dataSource,
    total,
    pageNo,
    pageSize,
    loading,
    searchValue,
    setSearchValue,
    setPageNo,
    setPageSize,
    onSearch,
    appendLocal,
    removeLocal,
  } = useBizDataWithLocal<PaymentApplicationItem>('payment-application');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailLinkModalOpen, setDetailLinkModalOpen] = useState(false);
  const [settlementPickerRowKey, setSettlementPickerRowKey] = useState<number | null>(null);
  const [addForm] = Form.useForm();

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


  const handleAdd = () => {
    const user = getStoredUser();
    addForm.resetFields();
    addForm.setFieldsValue({
      date: new Date().toISOString().slice(0, 10),
      applicant: user.nickname || user.username || '',
      department: user.department || user.deptIds || undefined,
    });
    setDetailItems([
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
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      appendLocal({
        date: values.date || new Date().toISOString().slice(0, 10),
        applicant: values.applicant || '',
        department: values.department || '',
        details: detailItems,
        totalAmount: values.totalAmount || '',
        totalAmountCapital: values.totalAmountCapital || '',
        vehicleCount: values.vehicleCount || detailItems.length,
        totalTonnage: values.totalTonnage || '',
        paymentAccount: values.paymentAccount || 'big',
        paymentMethod: values.paymentMethod || 'cash',
        payeeName1: payeeUnitOnly(values.payeeName1),
        payeeAccount1: values.payeeAccount1 || '',
        bankName1: values.bankName1 || '',
        bankAccount1: values.bankAccount1 || '',
        payeeName2: payeeUnitOnly(values.payeeName2),
        payeeAccount2: values.payeeAccount2 || '',
        bankName2: values.bankName2 || '',
        bankAccount2: values.bankAccount2 || '',
        paymentReason: values.paymentReason || '',
        processStatus: 'processing',
        currentNode: '提交',
        currentHandler: '',
        image: '',
        attachment: '',
        paymentReceipt: '',
      } as Omit<PaymentApplicationItem, 'id'>);
      message.success('提交成功！');
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
    removeLocal(selectedRowKeys.map(Number));
    setSelectedRowKeys([]);
    message.success('删除成功');
  };

  const payeeUnitOnly = (selected?: string) => {
    const raw = (selected || '').trim();
    const i = raw.indexOf('|');
    return i > 0 ? raw.slice(0, i) : raw;
  };

  const fillPayeeBank = (selected: string, prefix: '1' | '2') => {
    const payee = findPayeeBySelectValue(selected);
    if (!payee) return;
    // payeeName 表单值保持下拉唯一键（单位|账号），提交时再截成单位名
    addForm.setFieldsValue({
      [`payeeAccount${prefix}`]: payee.payeeAccount,
      [`bankName${prefix}`]: payee.openingBank,
      [`bankAccount${prefix}`]: payee.payeeAccount,
    });
  };

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

  const permissionMenuItems = [
    { key: 'all', label: '全部流程' },
    { key: 'my', label: '我的流程' },
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
        {/* 顶部工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fff',
            gap: 8,
          }}
        >
          <Dropdown
            menu={{ items: permissionMenuItems, defaultSelectedKeys: ['all'] }}
          >
            <Button>
              查看全部流程 <DownOutlined />
            </Button>
          </Dropdown>
          <Button type="link" icon={<PlusOutlined />}>
            新建视图
          </Button>
          <Button type="link" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button type="link" icon={<DatabaseOutlined />}>
            数据管理
          </Button>
          <Button type="link" icon={<MoreOutlined />}>
            流程分析
          </Button>
        </div>

        {/* 操作工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
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
          <Space>
            <Input.Search
              placeholder="搜索数据"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={onSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Button
              icon={<FilterOutlined />}
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                color: '#fff',
              }}
            >
              筛选
            </Button>
            <ExportOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
            <ColumnWidthOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
            <FullscreenOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
            <MoreOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
          </Space>
        </div>

        {/* 数据表格 */}
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            scroll={{ x: 3800 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
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
            }}
          />
        </div>
      </Card>

      {/* 添加付款申请弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
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
              发起流程
            </span>
            <Space>
              <FullscreenOutlined
                style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
              />
              <span
                onClick={() => setAddModalOpen(false)}
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
                  <Input placeholder="暂无内容" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="合计金额(大写)" name="totalAmountCapital">
                  <Input placeholder="暂无内容" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="车辆数量" name="vehicleCount">
                  <Input placeholder="暂无内容" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="总吨位" name="totalTonnage">
                  <Input placeholder="暂无内容" />
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
                    onChange={(v) => fillPayeeBank(String(v || ''), '1')}
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
              <Col span={16}>
                <Form.Item label="图片" name="image">
                  <Upload
                    action="/upload"
                    listType="picture-card"
                    accept="image/*"
                    showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                    maxCount={1}
                  >
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>选择 拖拽或单击后粘贴图片，单张20MB以内</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Form.Item label="收款单位2" name="payeeName2">
                  <DictSelect
                    dict="payee"
                    placeholder="请选择收款单位（基础资料）"
                    onChange={(v) => fillPayeeBank(String(v || ''), '2')}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="开户行2" name="bankName2">
                  <Input placeholder="自动带出开户行" readOnly />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="银行账号2" name="bankAccount2">
                  <Input placeholder="请输入银行账号" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Form.Item label="收款账号2" name="payeeAccount2" hidden>
                  <Input placeholder="请输入收款账号" />
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
              <Col span={12}>
                <Form.Item label="付款回执单" name="paymentReceipt">
                  <Upload
                    action="/upload"
                    listType="picture-card"
                    accept="image/*"
                    showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                  >
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>点击上传</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>

            {/* 底部按钮 */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleAddSubmit}
                style={{
                  flex: 1,
                  background: '#00a884',
                  borderColor: '#00a884',
                  height: 44,
                }}
              >
                提交申请
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
        sources={['settlement', 'price-change']}
        title="选择结账 / 划价（扣杂）数据"
        onSelect={(row) => {
          if (settlementPickerRowKey != null) {
            applySettlementToDetail(row as Record<string, unknown>, settlementPickerRowKey);
          }
          setDetailLinkModalOpen(false);
        }}
      />
    </div>
  );
}
