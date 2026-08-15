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
  Radio,
  Select,
  DatePicker,
  InputNumber,
  Divider,
  Upload,
  Steps,
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
  CloudUploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface SettlementItem {
  id: number;
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

const mockData: SettlementItem[] = [
  {
    id: 1, settlementStatus: 'unsettled', code: '6G0438', returnDate: '2026-07-29', weighDate: '2026-07-29',
    plateNumber: '晋MJ8122', vehicleType: '3厢50', vehicleModel: '长城', supplier: '山西回收有限公司',
    salesperson: '张经理', returnLocation: '太原', tonnage: 2.35, iron: 1.8, aluminum: 0.35,
    ternary: 0.12, battery: 0.08, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.05, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8500, totalPrice: 19975, remark: '车况良好',
    submitter: '齐志江', submitTime: '2026-07-29 14:30:00', updateTime: '2026-07-29 14:30:00',
  },
  {
    id: 2, settlementStatus: 'unsettled', code: '6G0437', returnDate: '2026-07-29', weighDate: '2026-07-29',
    plateNumber: '晋AV20G2', vehicleType: '三厢BBA85', vehicleModel: '奥迪', supplier: '河北废品回收公司',
    salesperson: '李经理', returnLocation: '石家庄', tonnage: 2.85, iron: 2.2, aluminum: 0.45,
    ternary: 0.15, battery: 0.1, kgDiff: 0.04, deductNetWeight: 0.06, deductBattery: 0.03,
    goodCondition: 0.08, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.03, deductDiesel: 0.02,
    selfDelivery: 0, deductSmallParts: 0.02, unitPrice: 9200, totalPrice: 26220, remark: '正常',
    submitter: '齐志江', submitTime: '2026-07-29 11:20:00', updateTime: '2026-07-29 11:20:00',
  },
  {
    id: 3, settlementStatus: 'unsettled', code: '6G0435', returnDate: '2026-07-28', weighDate: '2026-07-28',
    plateNumber: '晋LFX299', vehicleType: '面包30', vehicleModel: '五菱', supplier: '太原回收厂',
    salesperson: '王经理', returnLocation: '太原', tonnage: 1.95, iron: 1.5, aluminum: 0.28,
    ternary: 0.08, battery: 0.06, kgDiff: 0.02, deductNetWeight: 0.04, deductBattery: 0.01,
    goodCondition: 0.03, deductTwoBox: 0, deductBreadBox: 0.02, deductIronRing: 0.01, deductDiesel: 0.01,
    selfDelivery: 0.05, deductSmallParts: 0.01, unitPrice: 7800, totalPrice: 15210, remark: '自送',
    submitter: '齐志江', submitTime: '2026-07-28 16:45:00', updateTime: '2026-07-28 16:45:00',
  },
  {
    id: 4, settlementStatus: 'unsettled', code: '6G0436', returnDate: '2026-07-28', weighDate: '2026-07-28',
    plateNumber: '晋MKS296', vehicleType: '3厢50', vehicleModel: '大众', supplier: '晋南物资回收',
    salesperson: '赵经理', returnLocation: '临汾', tonnage: 2.55, iron: 1.95, aluminum: 0.38,
    ternary: 0.14, battery: 0.09, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.06, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8800, totalPrice: 22440, remark: '',
    submitter: '齐志江', submitTime: '2026-07-28 10:15:00', updateTime: '2026-07-28 10:15:00',
  },
  {
    id: 5, settlementStatus: 'settled', code: '6G0434', returnDate: '2026-07-26', weighDate: '2026-07-26',
    plateNumber: '晋LDJ311', vehicleType: '2厢40', vehicleModel: '吉利', supplier: '长治回收公司',
    salesperson: '陈经理', returnLocation: '长治', tonnage: 2.05, iron: 1.6, aluminum: 0.3,
    ternary: 0.1, battery: 0.07, kgDiff: 0.02, deductNetWeight: 0.04, deductBattery: 0.02,
    goodCondition: 0.04, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.01, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8200, totalPrice: 16810, remark: '已结算',
    submitter: '齐志江', submitTime: '2026-07-26 15:30:00', updateTime: '2026-07-27 09:00:00',
  },
  {
    id: 6, settlementStatus: 'settled', code: '6G0433', returnDate: '2026-07-26', weighDate: '2026-07-26',
    plateNumber: '晋LPR081', vehicleType: '3厢50', vehicleModel: '长城', supplier: '大同再生资源',
    salesperson: '孙经理', returnLocation: '大同', tonnage: 2.45, iron: 1.85, aluminum: 0.36,
    ternary: 0.13, battery: 0.08, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.05, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8600, totalPrice: 21070, remark: '已结算',
    submitter: '齐志江', submitTime: '2026-07-26 11:45:00', updateTime: '2026-07-27 09:05:00',
  },
  {
    id: 7, settlementStatus: 'settled', code: '6G0432', returnDate: '2026-07-25', weighDate: '2026-07-25',
    plateNumber: '晋LX330Y', vehicleType: '3厢50', vehicleModel: '大众', supplier: '晋中回收中心',
    salesperson: '周经理', returnLocation: '晋中', tonnage: 2.6, iron: 2.0, aluminum: 0.4,
    ternary: 0.15, battery: 0.09, kgDiff: 0.03, deductNetWeight: 0.06, deductBattery: 0.02,
    goodCondition: 0.06, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8900, totalPrice: 23140, remark: '已结算',
    submitter: '齐志江', submitTime: '2026-07-25 14:20:00', updateTime: '2026-07-26 08:30:00',
  },
  {
    id: 8, settlementStatus: 'settled', code: '6G0431', returnDate: '2026-07-19', weighDate: '2026-07-22',
    plateNumber: '晋LD01988', vehicleType: '2厢40', vehicleModel: '众泰', supplier: '运城回收有限公司',
    salesperson: '吴经理', returnLocation: '运城', tonnage: 1.85, iron: 1.45, aluminum: 0.26,
    ternary: 0.09, battery: 0.06, kgDiff: 0.02, deductNetWeight: 0.04, deductBattery: 0.01,
    goodCondition: 0.03, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.01, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 7600, totalPrice: 14060, remark: '延迟过磅',
    submitter: '齐志江', submitTime: '2026-07-19 16:00:00', updateTime: '2026-07-22 10:00:00',
  },
  {
    id: 9, settlementStatus: 'settled', code: '6G0430', returnDate: '2026-07-18', weighDate: '2026-07-22',
    plateNumber: '晋LX511E', vehicleType: '3厢50', vehicleModel: '福特', supplier: '忻州废品回收',
    salesperson: '郑经理', returnLocation: '忻州', tonnage: 2.75, iron: 2.1, aluminum: 0.42,
    ternary: 0.16, battery: 0.1, kgDiff: 0.04, deductNetWeight: 0.06, deductBattery: 0.03,
    goodCondition: 0.07, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.02,
    selfDelivery: 0, deductSmallParts: 0.02, unitPrice: 9100, totalPrice: 25025, remark: '已结算',
    submitter: '齐志江', submitTime: '2026-07-18 13:45:00', updateTime: '2026-07-22 11:30:00',
  },
  {
    id: 10, settlementStatus: 'settled', code: '6G0429', returnDate: '2026-07-18', weighDate: '2026-07-22',
    plateNumber: '晋L3693U', vehicleType: '3厢50', vehicleModel: '雪铁龙', supplier: '吕梁回收公司',
    salesperson: '冯经理', returnLocation: '吕梁', tonnage: 2.3, iron: 1.75, aluminum: 0.34,
    ternary: 0.12, battery: 0.08, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.05, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8400, totalPrice: 19320, remark: '已结算',
    submitter: '齐志江', submitTime: '2026-07-18 10:20:00', updateTime: '2026-07-22 09:15:00',
  },
  {
    id: 11, settlementStatus: 'settled', code: '6G0428', returnDate: '2026-07-21', weighDate: '2026-07-22',
    plateNumber: '晋L38R16', vehicleType: '3厢50', vehicleModel: '丰田', supplier: '阳泉再生资源',
    salesperson: '许经理', returnLocation: '阳泉', tonnage: 2.8, iron: 2.15, aluminum: 0.43,
    ternary: 0.15, battery: 0.1, kgDiff: 0.04, deductNetWeight: 0.06, deductBattery: 0.03,
    goodCondition: 0.07, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.02,
    selfDelivery: 0, deductSmallParts: 0.02, unitPrice: 9300, totalPrice: 26040, remark: '已结算',
    submitter: '齐志江', submitTime: '2026-07-21 15:10:00', updateTime: '2026-07-22 14:00:00',
  },
  {
    id: 12, settlementStatus: 'settled', code: '6G0427', returnDate: '2026-07-20', weighDate: '2026-07-21',
    plateNumber: '晋AT50H8', vehicleType: '3厢50', vehicleModel: '大众', supplier: '朔州回收有限公司',
    salesperson: '韩经理', returnLocation: '朔州', tonnage: 2.5, iron: 1.9, aluminum: 0.38,
    ternary: 0.14, battery: 0.09, kgDiff: 0.03, deductNetWeight: 0.05, deductBattery: 0.02,
    goodCondition: 0.06, deductTwoBox: 0, deductBreadBox: 0, deductIronRing: 0.02, deductDiesel: 0.01,
    selfDelivery: 0, deductSmallParts: 0.01, unitPrice: 8700, totalPrice: 21750, remark: '已结算',
    submitter: '齐志江', submitTime: '2026-07-20 11:30:00', updateTime: '2026-07-21 10:00:00',
  },
];

const columns: ColumnsType<SettlementItem> = [
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
  { title: '总价', dataIndex: 'totalPrice', width: 110, align: 'right', render: (val: number) => val?.toLocaleString() },
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
  const [dataSource, setDataSource] = useState<SettlementItem[]>(mockData);
  const [total, setTotal] = useState(120);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [importMode, setImportMode] = useState('only_add');
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageNo(1);
    if (!value) {
      setDataSource(mockData);
      setTotal(120);
    } else {
      const filtered = mockData.filter(
        (item) =>
          item.code.includes(value) ||
          item.plateNumber.includes(value) ||
          item.supplier.includes(value) ||
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
      const values = await addForm.validateFields();
      console.log('提交数据:', values);
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
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
    setSelectedRowKeys([]);
  };

  const permissionMenuItems = [
    { key: 'all', label: '查看所有数据' },
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
              查看所有数据 <DownOutlined />
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

      {/* 添加业务结账弹窗 */}
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
            initialValues={{
              settlementStatus: 'unsettled',
            }}
          >
            {/* 结账情况分组 */}
            <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
              结账情况
            </Divider>

            <Form.Item name="settlementStatus" label="结账情况">
              <Radio.Group>
                <Radio value="settled">已结账</Radio>
                <Radio value="unsettled">未结账</Radio>
              </Radio.Group>
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
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

              <Form.Item
                name="vehicleType"
                label="车辆类型"
                rules={[{ required: true, message: '请输入车辆类型' }]}
              >
                <Input placeholder="请输入车辆类型" />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="vehicleModel" label="车辆型号">
                <Select placeholder="请选择">
                  <Select.Option value="长城">长城</Select.Option>
                  <Select.Option value="奥迪">奥迪</Select.Option>
                  <Select.Option value="五菱">五菱</Select.Option>
                  <Select.Option value="大众">大众</Select.Option>
                  <Select.Option value="吉利">吉利</Select.Option>
                  <Select.Option value="福特">福特</Select.Option>
                  <Select.Option value="丰田">丰田</Select.Option>
                </Select>
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

            {/* 吨位分解分组 */}
            <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
              吨位分解
            </Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '0 16px' }}>
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

            {/* 车辆情况分组 */}
            <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
              车辆情况
            </Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="kgDiff" label="公斤差">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="deductNetWeight" label="扣净重">
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="selfDelivery" label="自送">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="deductSmallParts" label="扣小件">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item
                name="unitPrice"
                label="单价"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={1} />
              </Form.Item>

              <Form.Item name="totalPrice" label="总价">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="暂无内容"
                  disabled
                  min={0}
                  step={1}
                />
              </Form.Item>
            </div>

            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={3} placeholder="请输入备注内容" />
            </Form.Item>

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
                提交
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

      {/* 导入Excel数据弹窗 */}
      <Modal
        title={null}
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        width={600}
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
              <FullscreenOutlined
                style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
              />
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
    </div>
  );
}
