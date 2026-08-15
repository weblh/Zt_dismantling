import { useState, useCallback } from 'react';
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
  DatePicker,
  InputNumber,
  Divider,
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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface PriceChangeItem {
  id: number;
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
  processStatus: string;
  currentNode: string;
  currentHandler: string;
}

const mockData: PriceChangeItem[] = [
  {
    id: 1, code: '6D0330', returnDate: '2026-04-11', weighDate: '2026-04-11',
    plateNumber: '晋J4H565', vehicleType: '越野55', vehicleModel: '', supplier: '',
    salesperson: '刘娟', returnLocation: '交口', tonnage: 2.35, iron: 1.8, aluminum: 0.35,
    ternary: 0.12, battery: 0.08, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.05, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8500, totalPrice: 5001, remark: '',
    submitter: '于超', submitTime: '2026-04-12 16:53:04', updateTime: '2026-04-12 17:23:57',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 2, code: '6D0187', returnDate: '2026-04-07', weighDate: '2026-04-07',
    plateNumber: '晋J8A193', vehicleType: '3厢50', vehicleModel: '', supplier: '',
    salesperson: '郭海宾', returnLocation: '汾阳', tonnage: 2.85, iron: 2.2, aluminum: 0.45,
    ternary: 0.15, battery: 0.1, kgDiff: 0.04, deductNetWeight: 0.06, deductBattery: 0.03,
    goodCondition: 0.08, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.03, deductDiesel: 0.02,
    selfDelivery: 0, deductSmallParts: 0.02, unitPrice: 9200, totalPrice: 3300, remark: '',
    submitter: '于超', submitTime: '2026-04-12 15:01:18', updateTime: '2026-04-12 15:07:47',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 3, code: '6D0205', returnDate: '2026-04-07', weighDate: '2026-04-07',
    plateNumber: '晋KSC887', vehicleType: '2厢40', vehicleModel: '', supplier: '',
    salesperson: '张计云', returnLocation: '交口', tonnage: 1.95, iron: 1.5, aluminum: 0.28,
    ternary: 0.08, battery: 0.06, kgDiff: 0.02, deductNetWeight: 0.04, deductBattery: 0.01,
    goodCondition: 0.03, deductTwoBox: 0, deductBreadBox: 0.02, deductIronRing: 0.01, deductDiesel: 0.01,
    selfDelivery: 0.05, deductSmallParts: 0.01, unitPrice: 7800, totalPrice: 3870, remark: '',
    submitter: '于超', submitTime: '2026-04-08 15:54:00', updateTime: '2026-04-08 15:54:42',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 4, code: '6D0118', returnDate: '2026-04-04', weighDate: '2026-04-04',
    plateNumber: '晋K810AH', vehicleType: '2厢40', vehicleModel: '', supplier: '',
    salesperson: '梁小龙', returnLocation: '介休', tonnage: 2.55, iron: 1.95, aluminum: 0.38,
    ternary: 0.14, battery: 0.09, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.06, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8800, totalPrice: 2696, remark: '',
    submitter: '于超', submitTime: '2026-04-06 09:48:55', updateTime: '2026-04-06 10:36:40',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 5, code: '6D0092', returnDate: '2026-04-03', weighDate: '2026-04-03',
    plateNumber: '晋JP0373', vehicleType: '面包30', vehicleModel: '', supplier: '',
    salesperson: '白鼠平', returnLocation: '吕梁', tonnage: 2.05, iron: 1.6, aluminum: 0.3,
    ternary: 0.1, battery: 0.07, kgDiff: 0.02, deductNetWeight: 0.04, deductBattery: 0.02,
    goodCondition: 0.04, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.01, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8200, totalPrice: 2041, remark: '',
    submitter: '于超', submitTime: '2026-04-04 10:42:42', updateTime: '2026-04-04 11:00:51',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 6, code: '6D0036', returnDate: '2026-04-01', weighDate: '2026-04-01',
    plateNumber: '晋L15054', vehicleType: '五轮农用车30', vehicleModel: '', supplier: '',
    salesperson: '乔建华', returnLocation: '临汾', tonnage: 2.45, iron: 1.85, aluminum: 0.36,
    ternary: 0.13, battery: 0.08, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.05, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8600, totalPrice: 2256, remark: '柴油',
    submitter: '于超', submitTime: '2026-04-04 10:41:47', updateTime: '2026-04-04 11:00:54',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 7, code: '6C1005', returnDate: '2026-03-30', weighDate: '2026-03-30',
    plateNumber: '晋KSD280', vehicleType: '2厢40', vehicleModel: '', supplier: '',
    salesperson: '梁小龙', returnLocation: '介休', tonnage: 2.6, iron: 2.0, aluminum: 0.4,
    ternary: 0.15, battery: 0.09, kgDiff: 0.03, deductNetWeight: 0.06, deductBattery: 0.02,
    goodCondition: 0.06, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8900, totalPrice: 2483, remark: '',
    submitter: '于超', submitTime: '2026-03-31 16:44:15', updateTime: '2026-03-31 18:21:22',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 8, code: '6C0998', returnDate: '2026-03-30', weighDate: '2026-03-30',
    plateNumber: '晋K36629', vehicleType: '3厢50', vehicleModel: '', supplier: '',
    salesperson: '贺高强', returnLocation: '平遥', tonnage: 2.75, iron: 2.1, aluminum: 0.42,
    ternary: 0.16, battery: 0.1, kgDiff: 0.04, deductNetWeight: 0.06, deductBattery: 0.03,
    goodCondition: 0.07, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.02,
    selfDelivery: 0, deductSmallParts: 0.02, unitPrice: 9100, totalPrice: 4680, remark: '',
    submitter: '于超', submitTime: '2026-03-31 16:43:41', updateTime: '2026-03-31 18:21:26',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 9, code: '6C0937', returnDate: '2026-03-28', weighDate: '2026-03-28',
    plateNumber: '晋JR5179', vehicleType: '3厢50', vehicleModel: '', supplier: '',
    salesperson: '张计云', returnLocation: '交口', tonnage: 2.3, iron: 1.75, aluminum: 0.34,
    ternary: 0.12, battery: 0.08, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.05, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8400, totalPrice: 3130, remark: '',
    submitter: '于超', submitTime: '2026-03-31 09:45:47', updateTime: '2026-03-31 09:48:08',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 10, code: '6C0895', returnDate: '2026-03-25', weighDate: '2026-03-25',
    plateNumber: '晋LV260E', vehicleType: '3厢50', vehicleModel: '', supplier: '',
    salesperson: '薛冬冬', returnLocation: '临汾', tonnage: 2.8, iron: 2.15, aluminum: 0.43,
    ternary: 0.15, battery: 0.1, kgDiff: 0.04, deductNetWeight: 0.06, deductBattery: 0.03,
    goodCondition: 0.07, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.02,
    selfDelivery: 0, deductSmallParts: 0.02, unitPrice: 9300, totalPrice: 2680, remark: '',
    submitter: '于超', submitTime: '2026-03-29 14:41:24', updateTime: '2026-03-29 15:00:07',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 11, code: '6C0837', returnDate: '2026-03-26', weighDate: '2026-03-26',
    plateNumber: '晋JMV602', vehicleType: '3厢50', vehicleModel: '', supplier: '',
    salesperson: '郭海宾', returnLocation: '汾阳', tonnage: 2.5, iron: 1.9, aluminum: 0.38,
    ternary: 0.14, battery: 0.09, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.06, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8700, totalPrice: 4144, remark: '',
    submitter: '于超', submitTime: '2026-03-29 14:39:08', updateTime: '2026-03-29 15:00:10',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 12, code: '6C0761', returnDate: '2026-03-23', weighDate: '2026-03-23',
    plateNumber: '晋K1L022', vehicleType: '越野55', vehicleModel: '', supplier: '',
    salesperson: '梁小龙', returnLocation: '介休', tonnage: 2.6, iron: 2.0, aluminum: 0.4,
    ternary: 0.15, battery: 0.09, kgDiff: 0.03, deductNetWeight: 0.06, deductBattery: 0.02,
    goodCondition: 0.06, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8900, totalPrice: 5150, remark: '',
    submitter: '于超', submitTime: '2026-03-29 14:30:44', updateTime: '2026-03-29 15:00:14',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 13, code: '6C0701', returnDate: '2026-03-23', weighDate: '2026-03-23',
    plateNumber: '晋LN3793', vehicleType: '3厢50', vehicleModel: '', supplier: '',
    salesperson: '张计云', returnLocation: '交口', tonnage: 2.35, iron: 1.8, aluminum: 0.35,
    ternary: 0.12, battery: 0.08, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.05, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8500, totalPrice: 2770, remark: '',
    submitter: '于超', submitTime: '2026-03-29 14:29:29', updateTime: '2026-03-29 14:30:22',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 14, code: '6C0722', returnDate: '2026-03-23', weighDate: '2026-03-23',
    plateNumber: '晋J1C219', vehicleType: '3厢50', vehicleModel: '', supplier: '',
    salesperson: '郭海宾', returnLocation: '汾阳', tonnage: 2.45, iron: 1.85, aluminum: 0.36,
    ternary: 0.13, battery: 0.08, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.05, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8600, totalPrice: 2942, remark: '',
    submitter: '于超', submitTime: '2026-03-29 14:28:44', updateTime: '2026-03-29 14:30:26',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
  {
    id: 15, code: '6C0662', returnDate: '2026-03-21', weighDate: '2026-03-21',
    plateNumber: '晋A731EL', vehicleType: '面包30', vehicleModel: '', supplier: '',
    salesperson: '郭海宾', returnLocation: '汾阳', tonnage: 1.95, iron: 1.5, aluminum: 0.28,
    ternary: 0.08, battery: 0.06, kgDiff: 0.02, deductNetWeight: 0.04, deductBattery: 0.01,
    goodCondition: 0.03, deductTwoBox: 0, deductBreadBox: 0.02, deductIronRing: 0.01, deductDiesel: 0.01,
    selfDelivery: 0.05, deductSmallParts: 0.01, unitPrice: 7800, totalPrice: 2040, remark: '',
    submitter: '于超', submitTime: '2026-03-29 14:27:39', updateTime: '2026-03-29 14:28:28',
    processStatus: 'completed', currentNode: '流程结束', currentHandler: '',
  },
];

const columns: ColumnsType<PriceChangeItem> = [
  { title: '编号', dataIndex: 'code', width: 100, fixed: 'left' },
  { title: '回车日期', dataIndex: 'returnDate', width: 110 },
  { title: '过磅日期', dataIndex: 'weighDate', width: 110 },
  { title: '车牌号', dataIndex: 'plateNumber', width: 110 },
  { title: '车辆类型', dataIndex: 'vehicleType', width: 120 },
  { title: '车辆型号', dataIndex: 'vehicleModel', width: 90, render: () => '' },
  { title: '供应商', dataIndex: 'supplier', width: 120, render: () => '' },
  { title: '业务员', dataIndex: 'salesperson', width: 90 },
  { title: '回车地', dataIndex: 'returnLocation', width: 80 },
  { title: '吨位', dataIndex: 'tonnage', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '铁', dataIndex: 'iron', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '铝', dataIndex: 'aluminum', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '三元', dataIndex: 'ternary', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '电瓶', dataIndex: 'battery', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '公斤差', dataIndex: 'kgDiff', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣净重', dataIndex: 'deductNetWeight', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣电瓶', dataIndex: 'deductBattery', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '车况较好', dataIndex: 'goodCondition', width: 90, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣两厢', dataIndex: 'deductTwoBox', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣面包斗斗', dataIndex: 'deductBreadBox', width: 100, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣铁圈', dataIndex: 'deductIronRing', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣柴油', dataIndex: 'deductDiesel', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '自送', dataIndex: 'selfDelivery', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣小件', dataIndex: 'deductSmallParts', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '单价', dataIndex: 'unitPrice', width: 90, align: 'right', render: (val: number) => val?.toLocaleString() },
  { title: '总价', dataIndex: 'totalPrice', width: 100, align: 'right', render: (val: number) => val?.toLocaleString() },
  { title: '备注', dataIndex: 'remark', width: 100, render: (val: string) => val || '' },
  {
    title: '提交人',
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>,
  },
  { title: '提交时间', dataIndex: 'submitTime', width: 170 },
  { title: '更新时间', dataIndex: 'updateTime', width: 170 },
  {
    title: '流程状态',
    dataIndex: 'processStatus',
    width: 100,
    render: (val: string) => (
      <Tag color={val === 'completed' ? 'green' : 'orange'} style={{ borderRadius: 10, padding: '2px 10px' }}>
        {val === 'completed' ? '流转完成' : '处理中'}
      </Tag>
    ),
  },
  { title: '当前节点', dataIndex: 'currentNode', width: 100, render: (val: string) => val || '' },
  { title: '当前负责人', dataIndex: 'currentHandler', width: 100, render: (val: string) => val || '' },
];

export default function PriceChangePage() {
  const [dataSource, setDataSource] = useState<PriceChangeItem[]>(mockData);
  const [total, setTotal] = useState(2502);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageNo(1);
    if (!value) {
      setDataSource(mockData);
      setTotal(2502);
    } else {
      const filtered = mockData.filter(
        (item) =>
          item.code.includes(value) ||
          item.plateNumber.includes(value) ||
          item.salesperson.includes(value),
      );
      setDataSource(filtered);
      setTotal(filtered.length);
    }
  }, []);

  const handleAdd = () => {
    addForm.resetFields();
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      await addForm.validateFields();
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
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
    setSelectedRowKeys([]);
  };

  const permissionMenuItems = [
    { key: 'all', label: '查看全部流程' },
    { key: 'dept', label: '本部门' },
    { key: 'self', label: '仅自己' },
  ];

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
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
          </Space>
          <Space>
            <Input.Search
              placeholder="搜索数据"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
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
            scroll={{ x: 2800 }}
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

      {/* 添加修改价格弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={720}
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
              业务结账
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

          <Form
            form={addForm}
            layout="vertical"
            initialValues={{}}
          >
            {/* 基本信息 */}
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              基本信息
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item
                name="code"
                label="编号"
                rules={[{ required: true, message: '请选择编号' }]}
              >
                <Select placeholder="请选择">
                  {mockData.map(item => (
                    <Select.Option key={item.id} value={item.code}>{item.code}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="returnDate"
                label="回车日期"
                rules={[{ required: true, message: '请选择回车日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
              </Form.Item>

              <Form.Item
                name="weighDate"
                label="过磅日期"
                rules={[{ required: true, message: '请选择过磅日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
              </Form.Item>

              <Form.Item
                name="plateNumber"
                label="车牌号"
                rules={[{ required: true, message: '请输入车牌号' }]}
              >
                <Input placeholder="请输入车牌号" />
              </Form.Item>
            </div>

            <Form.Item
              name="vehicleType"
              label="车辆类型"
              rules={[{ required: true, message: '请输入车辆类型' }]}
            >
              <Input placeholder="请输入车辆类型" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="vehicleModel" label="车辆型号">
                <Input placeholder="请输入车辆型号" />
              </Form.Item>

              <Form.Item name="supplier" label="供应商">
                <Input placeholder="请输入供应商" />
              </Form.Item>

              <Form.Item name="salesperson" label="业务员">
                <Input placeholder="请输入业务员" />
              </Form.Item>

              <Form.Item name="returnLocation" label="回车地">
                <Input placeholder="请输入回车地" />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item
                name="unitPrice"
                label="单价"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={1} />
              </Form.Item>

              <Form.Item
                name="tonnage"
                label="吨位"
                rules={[{ required: true, message: '请输入吨位' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="iron" label="铁">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="ternary" label="三元">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px', marginBottom: 16 }}>
              <Form.Item name="aluminum" label="铝">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="battery" label="电瓶">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            {/* 车辆情况 */}
            <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
              车辆情况
            </Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="deductNetWeight" label="扣净重">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="kgDiff" label="公斤差">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="deductBattery" label="扣电瓶">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="goodCondition" label="车况较好">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="deductTwoBox" label="扣两厢">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="deductBreadBox" label="扣面包斗斗">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="deductIronRing" label="扣铁圈">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="deductDiesel" label="扣柴油">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', marginBottom: 16 }}>
              <Form.Item name="totalPrice" label="总价">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="暂无内容"
                  disabled
                  min={0}
                  step={1}
                />
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <Input placeholder="请输入备注内容" />
              </Form.Item>
            </div>

            {/* 修改情况 */}
            <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
              修改情况
            </Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="newUnitPrice" label="单价">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={1} />
              </Form.Item>

              <Form.Item name="newDeductBattery" label="扣电瓶">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newGoodCondition" label="车况较好">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newDeductTwoBox" label="扣两厢">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="newDeductBreadBox" label="扣面包斗斗">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newDeductIronRing" label="扣铁圈">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newDeductDiesel" label="扣柴油">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newDeductNetWeight" label="扣净重">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '0 16px', marginBottom: 16 }}>
              <Form.Item name="newKgDiff" label="公斤差">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newTotalPrice" label="总价">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={1} />
              </Form.Item>

              <Form.Item name="modifyRemark" label="修改备注">
                <Input.TextArea rows={3} placeholder="请输入修改备注内容" />
              </Form.Item>
            </div>

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
                提交修改
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
    </div>
  );
}
