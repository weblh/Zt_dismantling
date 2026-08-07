import { useState, useCallback } from 'react';
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
  Select,
  DatePicker,
  Radio,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  HistoryOutlined,
  FilterOutlined,
  ColumnWidthOutlined,
  FullscreenOutlined,
  MoreOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  EditOutlined,
  DatabaseOutlined,
  DownOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface ReceiptItem {
  id: number;
  supplierName: string;
  returnLocation: string;
  contactPhone: string;
  datetime: string;
  bigTruck: string;
  plateNo: string;
  isNegotiated: boolean;
  ownerIdInfo: string;
  drivingLicense: boolean;
  registrationCert: boolean;
  remark: string;
  isChecked: boolean;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

interface AddFormData {
  supplierName: string;
  returnLocation: string;
  contactPhone: string;
  datetime: string;
  bigTruck: string;
  plateNo: string;
  negotiateType: 'pass' | 'fail' | 'other';
  ownerIdType: 'pass' | 'fail' | 'other';
  drivingLicenseType: 'pass' | 'fail' | 'other';
  registrationCertType: 'pass' | 'fail' | 'other';
  remark: string;
}

const supplierOptions = [
  { value: '铜陵市福顺再生资源回收有限公司', label: '铜陵市福顺再生资源回收有限公司' },
  { value: '界首市强胜废旧物资回收有限公司', label: '界首市强胜废旧物资回收有限公司' },
  { value: '颍上县建华废旧物资回收', label: '颍上县建华废旧物资回收' },
  { value: '阜南县鑫源再生资源回收', label: '阜南县鑫源再生资源回收' },
  { value: '山西凯世台再生资源', label: '山西凯世台再生资源' },
  { value: '利辛县强胜废旧物资回收', label: '利辛县强胜废旧物资回收' },
];

const mockData: ReceiptItem[] = [
  { id: 1, supplierName: '铜陵市福顺再生资源回收有限公司', returnLocation: '铜陵', contactPhone: '13800000001', datetime: '2026-07-29 15:40:34', bigTruck: '鲁H23877', plateNo: '鲁H23877', isNegotiated: true, ownerIdInfo: '340123198501011234', drivingLicense: true, registrationCert: false, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-29 15:41:24', updateTime: '2026-07-29 15:53:57' },
  { id: 2, supplierName: '铜陵市福顺再生资源回收有限公司', returnLocation: '铜陵', contactPhone: '13800000002', datetime: '2026-07-29 15:38:23', bigTruck: '鲁A68232', plateNo: '鲁A68232', isNegotiated: true, ownerIdInfo: '340123198501011235', drivingLicense: true, registrationCert: false, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-29 15:41:05', updateTime: '2026-07-29 16:02:18' },
  { id: 3, supplierName: '铜陵市福顺再生资源回收有限公司', returnLocation: '铜陵', contactPhone: '13800000003', datetime: '2026-07-28 18:26:04', bigTruck: '鲁P65591', plateNo: '鲁P65591', isNegotiated: true, ownerIdInfo: '340123198501011236', drivingLicense: true, registrationCert: true, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-28 18:29:02', updateTime: '2026-07-29 09:53:13' },
  { id: 4, supplierName: '铜陵市福顺再生资源回收有限公司', returnLocation: '铜陵', contactPhone: '13800000004', datetime: '2026-07-28 18:24:25', bigTruck: '鲁P65591', plateNo: '鲁P65591', isNegotiated: true, ownerIdInfo: '340123198501011237', drivingLicense: true, registrationCert: true, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-28 18:28:35', updateTime: '2026-07-29 09:52:27' },
  { id: 5, supplierName: '铜陵市福顺再生资源回收有限公司', returnLocation: '铜陵', contactPhone: '13800000005', datetime: '2026-07-26 10:22:02', bigTruck: '鲁P11530', plateNo: '鲁P11530', isNegotiated: true, ownerIdInfo: '340123198501011238', drivingLicense: true, registrationCert: true, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-26 10:24:33', updateTime: '2026-07-26 18:02:24' },
  { id: 6, supplierName: '铜陵市福顺再生资源回收有限公司', returnLocation: '铜陵', contactPhone: '13800000006', datetime: '2026-07-26 10:22:35', bigTruck: '鲁P11530', plateNo: '鲁P11530', isNegotiated: true, ownerIdInfo: '340123198501011239', drivingLicense: true, registrationCert: true, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-26 10:24:14', updateTime: '2026-07-26 17:55:18' },
  { id: 7, supplierName: '界首市强胜废旧物资回收有限公司', returnLocation: '界首', contactPhone: '13800000007', datetime: '2026-07-25 08:50:07', bigTruck: '皖D34748', plateNo: '皖D34748', isNegotiated: true, ownerIdInfo: '340123198501011240', drivingLicense: true, registrationCert: false, remark: '', isChecked: true, submitter: '王盼盼', submitTime: '2026-07-25 08:52:39', updateTime: '2026-07-25 15:17:54' },
  { id: 8, supplierName: '界首市强胜废旧物资回收有限公司', returnLocation: '界首', contactPhone: '13800000008', datetime: '2026-07-22 13:57:45', bigTruck: '皖K58668', plateNo: '皖K58668', isNegotiated: false, ownerIdInfo: '340123198501011241', drivingLicense: false, registrationCert: false, remark: '', isChecked: true, submitter: '王盼盼', submitTime: '2026-07-22 14:02:09', updateTime: '2026-07-22 14:08:27' },
  { id: 9, supplierName: '界首市强胜废旧物资回收有限公司', returnLocation: '界首', contactPhone: '13800000009', datetime: '2026-07-22 13:57:45', bigTruck: '皖K58668', plateNo: '皖K58668', isNegotiated: true, ownerIdInfo: '340123198501011242', drivingLicense: true, registrationCert: false, remark: '', isChecked: true, submitter: '王盼盼', submitTime: '2026-07-22 14:00:54', updateTime: '2026-07-22 14:09:12' },
  { id: 10, supplierName: '界首市强胜废旧物资回收有限公司', returnLocation: '界首', contactPhone: '13800000010', datetime: '2026-07-22 13:53:09', bigTruck: '皖K62155', plateNo: '皖K62155', isNegotiated: false, ownerIdInfo: '340123198501011243', drivingLicense: false, registrationCert: true, remark: '', isChecked: true, submitter: '王盼盼', submitTime: '2026-07-22 13:59:30', updateTime: '2026-07-22 14:09:46' },
  { id: 11, supplierName: '界首市强胜废旧物资回收有限公司', returnLocation: '界首', contactPhone: '13800000011', datetime: '2026-07-22 08:33:58', bigTruck: '皖K62155', plateNo: '皖K62155', isNegotiated: false, ownerIdInfo: '340123198501011244', drivingLicense: false, registrationCert: false, remark: '', isChecked: true, submitter: '王盼盼', submitTime: '2026-07-22 08:33:58', updateTime: '2026-07-22 09:31:35' },
  { id: 12, supplierName: '颍上县建华废旧物资回收', returnLocation: '颍上', contactPhone: '13800000012', datetime: '2026-07-21 08:34:38', bigTruck: '皖K62155', plateNo: '皖K62155', isNegotiated: true, ownerIdInfo: '340123198501011245', drivingLicense: true, registrationCert: true, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-21 09:20:08', updateTime: '2026-07-21 10:14:15' },
  { id: 13, supplierName: '颍上县建华废旧物资回收', returnLocation: '颍上', contactPhone: '13800000013', datetime: '2026-07-21 08:34:38', bigTruck: '鲁H89500', plateNo: '鲁H89500', isNegotiated: true, ownerIdInfo: '340123198501011246', drivingLicense: true, registrationCert: false, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-21 08:42:46', updateTime: '2026-07-21 10:14:19' },
  { id: 14, supplierName: '颍上县建华废旧物资回收', returnLocation: '颍上', contactPhone: '13800000014', datetime: '2026-07-20 10:28:58', bigTruck: '皖K62155', plateNo: '皖K62155', isNegotiated: true, ownerIdInfo: '340123198501011247', drivingLicense: false, registrationCert: false, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-20 11:55:55', updateTime: '2026-07-20 12:05:05' },
  { id: 15, supplierName: '颍上县建华废旧物资回收', returnLocation: '颍上', contactPhone: '13800000015', datetime: '2026-07-18 12:31:25', bigTruck: '鲁H89500', plateNo: '鲁H89500', isNegotiated: true, ownerIdInfo: '340123198501011248', drivingLicense: true, registrationCert: false, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-18 12:31:25', updateTime: '2026-07-18 12:35:56' },
  { id: 16, supplierName: '阜南县鑫源再生资源回收', returnLocation: '阜南', contactPhone: '13800000016', datetime: '2026-07-15 08:23:04', bigTruck: '鲁H89500', plateNo: '鲁H89500', isNegotiated: true, ownerIdInfo: '340123198501011249', drivingLicense: true, registrationCert: false, remark: '', isChecked: true, submitter: '王盼盼', submitTime: '2026-07-15 08:23:04', updateTime: '2026-07-15 08:26:56' },
  { id: 17, supplierName: '阜南县鑫源再生资源回收', returnLocation: '阜南', contactPhone: '13800000017', datetime: '2026-07-15 08:23:04', bigTruck: '鲁H89500', plateNo: '鲁H89500', isNegotiated: true, ownerIdInfo: '340123198501011250', drivingLicense: true, registrationCert: false, remark: '', isChecked: true, submitter: '王盼盼', submitTime: '2026-07-15 08:23:04', updateTime: '2026-07-15 08:26:56' },
  { id: 18, supplierName: '阜南县鑫源再生资源回收', returnLocation: '阜南', contactPhone: '13800000018', datetime: '2026-07-11 08:23:04', bigTruck: '鲁H89500', plateNo: '鲁H89500', isNegotiated: true, ownerIdInfo: '340123198501011251', drivingLicense: true, registrationCert: false, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-11 08:23:04', updateTime: '2026-07-11 08:26:56' },
  { id: 19, supplierName: '山西凯世台再生资源', returnLocation: '山西', contactPhone: '13800000019', datetime: '2026-07-10 10:23:04', bigTruck: '鲁P65591', plateNo: '鲁P65591', isNegotiated: true, ownerIdInfo: '340123198501011252', drivingLicense: true, registrationCert: true, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-10 10:23:04', updateTime: '2026-07-10 10:26:56' },
  { id: 20, supplierName: '利辛县强胜废旧物资回收', returnLocation: '利辛', contactPhone: '13800000020', datetime: '2026-07-09 15:40:34', bigTruck: '皖K62155', plateNo: '皖K62155', isNegotiated: true, ownerIdInfo: '340123198501011253', drivingLicense: true, registrationCert: true, remark: '', isChecked: true, submitter: '冯瑶瑶', submitTime: '2026-07-09 15:40:34', updateTime: '2026-07-09 15:53:57' },
];

const CheckIcon = () => (
  <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
);
const CrossIcon = () => (
  <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
);

const columns: ColumnsType<ReceiptItem> = [
  { title: '供应商名称', dataIndex: 'supplierName', width: 220, fixed: 'left', ellipsis: true },
  { title: '回车地', dataIndex: 'returnLocation', width: 80 },
  { title: '联系电话', dataIndex: 'contactPhone', width: 130 },
  { title: '日期时间', dataIndex: 'datetime', width: 170 },
  { title: '大板车', dataIndex: 'bigTruck', width: 120 },
  { title: '车牌号', dataIndex: 'plateNo', width: 120 },
  {
    title: '销户/议价',
    dataIndex: 'isNegotiated',
    width: 100,
    render: (val: boolean) => (val ? <CheckIcon /> : <CrossIcon />),
  },
  { title: '车主身份信息', dataIndex: 'ownerIdInfo', width: 180, ellipsis: true },
  {
    title: '行车本',
    dataIndex: 'drivingLicense',
    width: 80,
    render: (val: boolean) => (val ? <CheckIcon /> : <CrossIcon />),
  },
  {
    title: '登记证书',
    dataIndex: 'registrationCert',
    width: 80,
    render: (val: boolean) => (val ? <CheckIcon /> : <CrossIcon />),
  },
  { title: '需说明事项', dataIndex: 'remark', width: 150, render: (val: string) => val || '-' },
  {
    title: '是否查验',
    dataIndex: 'isChecked',
    width: 90,
    render: (val: boolean) => (val ? '是' : '否'),
  },
  {
    title: '提交人',
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>,
  },
  { title: '提交时间', dataIndex: 'submitTime', width: 170 },
  { title: '更新时间', dataIndex: 'updateTime', width: 170 },
];

const iconRadioStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

function IconRadioGroup({
  value,
  onChange,
}: {
  value: 'pass' | 'fail' | 'other';
  onChange: (val: 'pass' | 'fail' | 'other') => void;
}) {
  return (
    <Radio.Group
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ display: 'flex', gap: 24 }}
    >
      <Radio value="pass" style={iconRadioStyle}>
        <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
      </Radio>
      <Radio value="fail" style={iconRadioStyle}>
        <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
      </Radio>
      <Radio value="other" style={iconRadioStyle}>
        其他
      </Radio>
    </Radio.Group>
  );
}

export default function ReceiptPage() {
  const [dataSource, setDataSource] = useState<ReceiptItem[]>(mockData);
  const [total, setTotal] = useState(33673);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm<AddFormData>();

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      setPageNo(1);
      if (!value) {
        setDataSource(mockData);
        setTotal(33673);
      } else {
        const filtered = mockData.filter((item) =>
          item.supplierName.includes(value) || item.plateNo.includes(value),
        );
        setDataSource(filtered);
        setTotal(filtered.length);
      }
    },
    [],
  );

  const handleAdd = () => {
    addForm.resetFields();
    addForm.setFieldsValue({
      negotiateType: 'pass',
      ownerIdType: 'pass',
      drivingLicenseType: 'pass',
      registrationCertType: 'pass',
    });
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
    const values = addForm.getFieldsValue();
    console.log('保存草稿:', values);
    message.success('草稿保存成功！');
    setAddModalOpen(false);
  };

  const handleImport = () => {
    message.info('导入功能');
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

  const handleHistory = () => {
    message.info('查看操作记录');
  };

  const permissionMenuItems = [
    { key: 'all', label: '全部权限' },
    { key: 'dept', label: '本部门' },
    { key: 'self', label: '仅自己' },
  ];

  return (
    <div className="page-container" style={{ padding: 0, background: '#f5f5f5', minHeight: '100%' }}>
      <Card
        style={{ margin: 0, borderRadius: 0 }}
        bodyStyle={{ padding: 0 }}
        title={null}
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
          <Dropdown menu={{ items: permissionMenuItems, defaultSelectedKeys: ['all'] }}>
            <Button>
              全部权限 <DownOutlined />
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
            <Button icon={<HistoryOutlined />} onClick={handleHistory}>
              操作记录
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
            <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
            <ColumnWidthOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <MoreOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
          </Space>
        </div>

        {/* 数据表格 */}
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            scroll={{ x: 2200 }}
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

      {/* 添加弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={720}
        closable={false}
        styles={{ body: { padding: 0 } }}
        footer={
          <div style={{ display: 'flex', gap: 16 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleAddSubmit}
              style={{ flex: 1 }}
            >
              提交
            </Button>
            <Button
              size="large"
              onClick={handleSaveDraft}
              style={{ flex: 1 }}
            >
              保存草稿
            </Button>
          </div>
        }
      >
        <div style={{ position: 'relative', padding: '16px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>1.业务收货</span>
            <Space>
              <ExpandOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
              <span
                onClick={() => setAddModalOpen(false)}
                style={{ fontSize: 18, cursor: 'pointer', color: '#999', lineHeight: '20px' }}
              >
                ×
              </span>
            </Space>
          </div>

          <Form
            form={addForm}
            layout="vertical"
            initialValues={{
              supplierName: undefined,
              returnLocation: '',
              contactPhone: '',
              bigTruck: '',
              plateNo: '',
              negotiateType: 'pass',
              ownerIdType: 'pass',
              drivingLicenseType: 'pass',
              registrationCertType: 'pass',
              remark: '',
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span><span style={{ color: '#ff4d4f' }}>*</span>供应商名称</span>}
                  name="supplierName"
                  rules={[{ required: true, message: '请选择供应商' }]}
                >
                  <Select
                    placeholder="请选择"
                    options={supplierOptions}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="回车地" name="returnLocation">
                  <Input placeholder="请输入" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="联系电话" name="contactPhone">
                  <Input placeholder="请输入" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span><span style={{ color: '#ff4d4f' }}>*</span>日期时间</span>}
                  name="datetime"
                  rules={[{ required: true, message: '请选择日期' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="大板车" name="bigTruck">
                  <Input placeholder="请输入" />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ borderTop: '1px dashed #e8e8e8', margin: '16px 0' }} />

            <div style={{ color: '#1890ff', fontWeight: 500, marginBottom: 16 }}>车辆清单</div>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label={<span><span style={{ color: '#ff4d4f' }}>*</span>车牌号</span>}
                  name="plateNo"
                  rules={[{ required: true, message: '请输入车牌号' }]}
                >
                  <Input placeholder="请输入" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span>销户/议价</span>}>
                  <Form.Item name="negotiateType" noStyle>
                    <IconRadioGroup />
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="车主身份信息">
                  <Form.Item name="ownerIdType" noStyle>
                    <IconRadioGroup />
                  </Form.Item>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="行车本">
                  <Form.Item name="drivingLicenseType" noStyle>
                    <IconRadioGroup />
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="登记证书">
                  <Form.Item name="registrationCertType" noStyle>
                    <IconRadioGroup />
                  </Form.Item>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="需说明事项" name="remark">
              <Input.TextArea
                placeholder="请输入"
                rows={3}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
