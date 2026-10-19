import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  ConfigProvider,
} from 'antd';
import {
  EditOutlined,
  ExportOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ImportOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface ShippingPriceItem {
  key: string;
  code: string;
  outboundDate: string;
  weighingDate: string;
  carNumber: string;
  receiverUnit: string;
  productName: string;
  model: string;
  grossWeight: string;
  tareWeight: string;
  netWeight: string;
  contractNo: string;
  unitPrice: string;
  totalPrice: string;
  customer: string;
  address: string;
  contact: string;
  paymentStatus: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: ShippingPriceItem[] = [
  {
    key: '1',
    code: 'XS20260801001',
    outboundDate: '2026-08-01',
    weighingDate: '2026-08-01',
    carNumber: '晋A12345',
    receiverUnit: '太原废品回收公司',
    productName: '废钢',
    model: '重型',
    grossWeight: '25.5',
    tareWeight: '8.2',
    netWeight: '17.3',
    contractNo: 'HT20260801',
    unitPrice: '3200',
    totalPrice: '55360',
    customer: '张先生',
    address: '太原市杏花岭区',
    contact: '13800138000',
    paymentStatus: '已付款',
    submitter: '王经理',
    submitTime: '2026-08-01 09:00:00',
    updateTime: '2026-08-01 09:00:00',
  },
  {
    key: '2',
    code: 'XS20260715002',
    outboundDate: '2026-07-15',
    weighingDate: '2026-07-15',
    carNumber: '晋B67890',
    receiverUnit: '大同物资回收站',
    productName: '铝件',
    model: '轻型',
    grossWeight: '18.3',
    tareWeight: '6.1',
    netWeight: '12.2',
    contractNo: 'HT20260715',
    unitPrice: '15000',
    totalPrice: '183000',
    customer: '李女士',
    address: '大同市平城区',
    contact: '13900139000',
    paymentStatus: '未付款',
    submitter: '李经理',
    submitTime: '2026-07-15 10:30:00',
    updateTime: '2026-07-15 10:30:00',
  },
  {
    key: '3',
    code: 'XS20260701003',
    outboundDate: '2026-07-01',
    weighingDate: '2026-07-01',
    carNumber: '晋C11223',
    receiverUnit: '阳泉旧货市场',
    productName: '铜线',
    model: '通讯线',
    grossWeight: '12.8',
    tareWeight: '4.5',
    netWeight: '8.3',
    contractNo: 'HT20260701',
    unitPrice: '45000',
    totalPrice: '373500',
    customer: '赵老板',
    address: '阳泉市城区',
    contact: '13700137000',
    paymentStatus: '已付款',
    submitter: '张经理',
    submitTime: '2026-07-01 14:00:00',
    updateTime: '2026-07-01 14:00:00',
  },
  {
    key: '4',
    code: 'XS20260620004',
    outboundDate: '2026-06-20',
    weighingDate: '2026-06-20',
    carNumber: '晋D44556',
    receiverUnit: '长治废品收购站',
    productName: '塑料',
    model: 'PP',
    grossWeight: '20.1',
    tareWeight: '7.3',
    netWeight: '12.8',
    contractNo: 'HT20260620',
    unitPrice: '8500',
    totalPrice: '108800',
    customer: '陈先生',
    address: '长治市潞州区',
    contact: '13600136000',
    paymentStatus: '部分付款',
    submitter: '刘经理',
    submitTime: '2026-06-20 11:20:00',
    updateTime: '2026-06-20 11:20:00',
  },
  {
    key: '5',
    code: 'XS20260610005',
    outboundDate: '2026-06-10',
    weighingDate: '2026-06-10',
    carNumber: '晋E77889',
    receiverUnit: '晋城再生资源公司',
    productName: '橡胶',
    model: '轮胎',
    grossWeight: '30.2',
    tareWeight: '10.5',
    netWeight: '19.7',
    contractNo: 'HT20260610',
    unitPrice: '6200',
    totalPrice: '122140',
    customer: '孙经理',
    address: '晋城市城区',
    contact: '13500135000',
    paymentStatus: '已付款',
    submitter: '王经理',
    submitTime: '2026-06-10 15:45:00',
    updateTime: '2026-06-10 15:45:00',
  },
];

const productNameOptions = [
  { value: '废钢', label: '废钢' },
  { value: '铝件', label: '铝件' },
  { value: '铜线', label: '铜线' },
  { value: '塑料', label: '塑料' },
  { value: '橡胶', label: '橡胶' },
  { value: '小件', label: '小件' },
  { value: '底盘料', label: '底盘料' },
  { value: '撕碎料', label: '撕碎料' },
];

export default function ModifyShippingPrice() {
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(
        mockData.filter(
          (item) =>
            item.code.includes(searchValue) ||
            item.productName.includes(searchValue) ||
            item.receiverUnit.includes(searchValue)
        )
      );
    }
  };

  const handleAddSubmit = () => {
    form.validateFields().then(() => {
      message.success('提交成功');
      setAddModalOpen(false);
      form.resetFields();
    });
  };

  const handleSaveDraft = () => {
    form.validateFields().then(() => {
      message.success('草稿已保存');
      setAddModalOpen(false);
      form.resetFields();
    });
  };

  const columns: ColumnsType<ShippingPriceItem> = [
    { title: '编号', dataIndex: 'code', width: 140, fixed: 'left' },
    { title: '出货日期', dataIndex: 'outboundDate', width: 110 },
    { title: '过磅同步日期', dataIndex: 'weighingDate', width: 120 },
    { title: '车号', dataIndex: 'carNumber', width: 100 },
    { title: '收货单位', dataIndex: 'receiverUnit', width: 160 },
    { title: '品名', dataIndex: 'productName', width: 90 },
    { title: '型号', dataIndex: 'model', width: 90 },
    { title: '毛重', dataIndex: 'grossWeight', width: 80, align: 'right' },
    { title: '皮重', dataIndex: 'tareWeight', width: 80, align: 'right' },
    { title: '净重', dataIndex: 'netWeight', width: 80, align: 'right' },
    { title: '合同编号', dataIndex: 'contractNo', width: 120 },
    { title: '单价(RMB/吨不含税)', dataIndex: 'unitPrice', width: 130, align: 'right' },
    { title: '总价(不含税)', dataIndex: 'totalPrice', width: 120, align: 'right' },
    { title: '客户', dataIndex: 'customer', width: 90 },
    { title: '地址', dataIndex: 'address', width: 140 },
    { title: '联系方式', dataIndex: 'contact', width: 120 },
    { title: '回款情况', dataIndex: 'paymentStatus', width: 90 },
    { title: '提交人', dataIndex: 'submitter', width: 90, render: (text: string) => <a style={{ color: '#1890ff' }}>{text}</a> },
    { title: '提交时间', dataIndex: 'submitTime', width: 160 },
    { title: '更新时间', dataIndex: 'updateTime', width: 160 },
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: '#1890ff',
            headerColor: '#fff',
            headerSortActiveBg: '#1890ff',
            headerSortHoverBg: '#1890ff',
          },
        },
      }}
    >
      <div className="page-container">
        {/* 顶部工具栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space wrap>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>
              修改出货价格
            </span>
            <Button type="text" icon={<EditOutlined />} style={{ color: '#666' }}>
              编辑
            </Button>
            <Button type="text" icon={<ExportOutlined />} style={{ color: '#666' }} />
            <Button type="text" icon={<FullscreenOutlined />} style={{ color: '#666' }} />
          </Space>
        </div>

        {/* 操作栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalOpen(true)}
              style={{ background: '#13c2c2', borderColor: '#13c2c2' }}
            >
              添加
            </Button>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />}>导出</Button>
            <Button icon={<DeleteOutlined />}>删除</Button>
          </Space>
          <Space wrap>
            <Input.Search
              placeholder="搜索编号/品名/收货单位"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ width: isMobile ? '100%' : 240 }}
              allowClear
            />
            <Button
              icon={<FilterOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
            >
              筛选
            </Button>
          </Space>
        </div>

        {/* 表格 */}
        <div style={{ background: '#fff' }}>
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={withMobilePagination(isMobile, {
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              pageSize: 20,
            })}
            rowKey="key"
            size="middle"
            scroll={{ x: 'max-content' }}
            bordered
          />
        </div>
      </div>

      {/* 添加表单弹窗 */}
      <Modal
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={720}
        title="修改出货价格"
        style={{ top: 40 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Form form={form} layout="vertical" initialValues={{}}>
          {/* 第一行 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="编号" name="code">
              <Select placeholder="请选择编号" options={[]} allowClear />
            </Form.Item>
            <Form.Item label="出货日期" name="outboundDate">
              <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
            </Form.Item>
            <Form.Item label="过磅同步日期" name="weighingDate">
              <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
            </Form.Item>
            <Form.Item label="车号" name="carNumber">
              <Input placeholder="请输入车号" />
            </Form.Item>
          </div>

          {/* 第二行 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0 16px' }}>
            <Form.Item label="收货单位" name="receiverUnit">
              <Input placeholder="请输入收货单位" />
            </Form.Item>
            <Form.Item
              label="品名"
              name="productName"
              rules={[{ required: true, message: '请输入品名' }]}
            >
              <Input placeholder="请输入品名" />
            </Form.Item>
          </div>

          {/* 第三行 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="型号" name="model">
              <Input placeholder="请输入型号" />
            </Form.Item>
            <Form.Item label="毛重" name="grossWeight">
              <Input placeholder="请输入毛重" />
            </Form.Item>
            <Form.Item label="皮重" name="tareWeight">
              <Input placeholder="请输入皮重" />
            </Form.Item>
            <Form.Item label="净重" name="netWeight">
              <Input placeholder="请输入净重" />
            </Form.Item>
          </div>

          {/* 第四行 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="合同编号" name="contractNo">
              <Input placeholder="请输入合同编号" />
            </Form.Item>
            <Form.Item label="单价(RMB/吨不含税)" name="unitPrice">
              <Input placeholder="请输入单价" />
            </Form.Item>
            <Form.Item label="总价(不含税)" name="totalPrice">
              <Input placeholder="请输入总价" />
            </Form.Item>
            <Form.Item label="客户" name="customer">
              <Input placeholder="请输入客户" />
            </Form.Item>
          </div>

          {/* 第五行 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="地址" name="address">
              <Input placeholder="请输入地址" />
            </Form.Item>
            <Form.Item label="联系方式" name="contact">
              <Input placeholder="请输入联系方式" />
            </Form.Item>
            <Form.Item label="回款情况" name="paymentStatus">
              <Input placeholder="请输入回款情况" />
            </Form.Item>
          </div>

          {/* 第六行 */}
          <Form.Item label="情况说明" name="description">
            <Input.TextArea placeholder="请输入情况说明" rows={2} />
          </Form.Item>

          {/* 分割线 */}
          <div
            style={{
              borderTop: '1px dashed #e0e0e0',
              margin: '8px 0',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: -8,
                background: '#fff',
                paddingRight: 12,
                fontSize: 13,
                color: '#333',
                fontWeight: 500,
              }}
            >
              修改内容
            </span>
          </div>

          {/* 修改内容 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="修改单价" name="newUnitPrice">
              <Input placeholder="请输入修改单价" />
            </Form.Item>
            <Form.Item label="修改总价(不含税)" name="newTotalPrice">
              <Input placeholder="请输入修改总价" />
            </Form.Item>
          </div>

          {/* 备注 */}
          <Form.Item label="备注" name="remark">
            <Input.TextArea placeholder="请输入备注" rows={3} />
          </Form.Item>

          {/* 按钮 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
            <Button
              type="primary"
              onClick={handleAddSubmit}
              style={{ background: '#13c2c2', borderColor: '#13c2c2', minWidth: 120 }}
            >
              提交
            </Button>
            <Button onClick={handleSaveDraft} style={{ minWidth: 120 }}>
              保存草稿
            </Button>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
