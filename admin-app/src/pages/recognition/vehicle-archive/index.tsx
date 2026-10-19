import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Upload, Tag, DatePicker, Select, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined,
  HistoryOutlined, UploadOutlined, QrcodeOutlined, InboxOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface ArchiveItem {
  key: string;
  businessCode: string;
  dateTime: string;
  businessStaff: string;
  drivingLicense: string;
  vehicleCertificate: string;
  plateNumber: string;
  vehicleType: string;
  owner: string;
  address: string;
  usage: string;
  brandModel: string;
  vin: string;
  engineNumber: string;
  registerDate: string;
  issueDate: string;
  vehicleModel: string;
  frameNumber: string;
  engineCode: string;
  bodyColor: string;
  usageNature: string;
  factoryDate: string;
  issueDate2: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  accessToken1: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: ArchiveItem[] = [];

const columns: ColumnsType<ArchiveItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>业务编号</span>, dataIndex: 'businessCode', width: 140, fixed: 'left' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>日期时间</span>, dataIndex: 'dateTime', width: 160, sorter: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>业务员</span>, dataIndex: 'businessStaff', width: 100 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>行驶证</span>,
    dataIndex: 'drivingLicense',
    width: 100,
    render: () => <span style={{ color: '#1890ff', cursor: 'pointer' }}>查看</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>车辆登记证书</span>,
    dataIndex: 'vehicleCertificate',
    width: 120,
    render: () => <span style={{ color: '#1890ff', cursor: 'pointer' }}>查看</span>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>号码号牌</span>, dataIndex: 'plateNumber', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>所有人</span>, dataIndex: 'owner', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>住址</span>, dataIndex: 'address', width: 180 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>使用性质</span>, dataIndex: 'usage', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>品牌型号</span>, dataIndex: 'brandModel', width: 150 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆识别代号</span>, dataIndex: 'vin', width: 180 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>发动机号码</span>, dataIndex: 'engineNumber', width: 150 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>注册日期</span>, dataIndex: 'registerDate', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>发证日期</span>, dataIndex: 'issueDate', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车架号</span>, dataIndex: 'frameNumber', width: 150 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>发动机号</span>, dataIndex: 'engineCode', width: 130 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车身颜色</span>, dataIndex: 'bodyColor', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>使用性质</span>, dataIndex: 'usageNature', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>出厂日期</span>, dataIndex: 'factoryDate', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>发证日期</span>, dataIndex: 'issueDate2', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>client_id</span>, dataIndex: 'clientId', width: 130 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>client_secret</span>, dataIndex: 'clientSecret', width: 130 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>access_token</span>, dataIndex: 'accessToken', width: 160 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>access_token1</span>, dataIndex: 'accessToken1', width: 160 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 160 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 160 },
];

const businessStaffOptions = [
  { value: '王瑞', label: '王瑞' },
  { value: '李明', label: '李明' },
  { value: '张伟', label: '张伟' },
  { value: '刘洋', label: '刘洋' },
];

export default function VehicleArchive() {
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [currentUploadField, setCurrentUploadField] = useState<string>('');
  const [form] = Form.useForm();
  const [drivingFileList, setDrivingFileList] = useState<UploadFile[]>([]);
  const [certFileList, setCertFileList] = useState<UploadFile[]>([]);

  const handleAdd = () => {
    form.resetFields();
    setDrivingFileList([]);
    setCertFileList([]);
    setModalOpen(true);
  };

  const handleStartRecognition = () => {
    if (drivingFileList.length === 0 && certFileList.length === 0) {
      message.error('请先上传行驶证或车辆登记证书');
      return;
    }
    message.loading({ content: '正在识别中...', key: 'recognition' });
    setTimeout(() => {
      message.success({ content: '识别完成', key: 'recognition' });
      form.setFieldsValue({
        plateNumber: '浙A·12345',
        vehicleType: '小型轿车',
        owner: '张三',
        address: '浙江省杭州市西湖区',
        usage: '非营运',
        brandModel: '大众帕萨特',
        vin: 'LSVUU69W3A2123456',
        engineNumber: '1234567890',
        registerDate: '2020-05-15',
        issueDate: '2020-05-15',
        vehicleModel: '帕萨特 2020款',
        frameNumber: 'LSVUU69W3A2123456',
        engineCode: '1234567890',
        bodyColor: '黑色',
        usageNature: '非营运',
        factoryDate: '2020-03-01',
        issueDate2: '2020-05-15',
      });
    }, 2000);
  };

  const handleModalOk = async (saveDraft: boolean) => {
    try {
      const values = await form.validateFields();
      console.log('表单值:', values, saveDraft);
      message.success(saveDraft ? '草稿保存成功' : '提交成功');
      setModalOpen(false);
    } catch {
      message.error('请填写必要信息');
    }
  };

  const openQrCode = (field: string) => {
    setCurrentUploadField(field);
    setQrCodeOpen(true);
  };

  const drivingUploadProps = {
    fileList: drivingFileList,
    beforeUpload: (file: UploadFile) => {
      const isLt20M = (file.size ?? 0) / 1024 / 1024 < 20;
      if (!isLt20M) message.error('文件大小不能超过 20MB!');
      return isLt20M || false;
    },
    onChange: ({ fileList: newList }: { fileList: UploadFile[] }) => {
      setDrivingFileList(newList.slice(-1));
    },
  };

  const certUploadProps = {
    fileList: certFileList,
    beforeUpload: (file: UploadFile) => {
      const isLt20M = (file.size ?? 0) / 1024 / 1024 < 20;
      if (!isLt20M) message.error('文件大小不能超过 20MB!');
      return isLt20M || false;
    },
    onChange: ({ fileList: newList }: { fileList: UploadFile[] }) => {
      setCertFileList(newList.slice(-1));
    },
  };

  const qrCodeSvg = (
    <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
      <rect width="180" height="180" fill="#fff" />
      <rect x="10" y="10" width="30" height="30" fill="#000" />
      <rect x="4" y="4" width="42" height="42" fill="none" stroke="#000" strokeWidth="3" />
      <rect x="16" y="16" width="18" height="18" fill="#fff" />
      <rect x="140" y="10" width="30" height="30" fill="#000" />
      <rect x="134" y="4" width="42" height="42" fill="none" stroke="#000" strokeWidth="3" />
      <rect x="146" y="16" width="18" height="18" fill="#fff" />
      <rect x="10" y="140" width="30" height="30" fill="#000" />
      <rect x="4" y="134" width="42" height="42" fill="none" stroke="#000" strokeWidth="3" />
      <rect x="16" y="146" width="18" height="18" fill="#fff" />
      {Array.from({ length: 15 }).map((_, row) =>
        Array.from({ length: 15 }).map((_, col) => {
          const seed = (row * 31 + col * 17 + 7) % 100;
          const isFinderArea = (row < 5 && col < 5) || (row < 5 && col > 9) || (row > 9 && col < 5);
          if (isFinderArea) return null;
          const size = 8;
          const x = col * size + 4;
          const y = row * size + 4;
          if (seed < 45) return <rect key={`${row}-${col}`} x={x} y={y} width={size} height={size} fill="#000" />;
          return null;
        })
      )}
    </svg>
  );

  return (
    <div className="page-container">
      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>删除</Button>
          <Button icon={<HistoryOutlined />}>操作记录</Button>
        </Space>
        <Space wrap>
          <Input
            placeholder="搜索数据"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: isMobile ? '100%' : 200 }}
            allowClear
          />
          <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={mockData}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={withMobilePagination(isMobile, { showSizeChanger: true, showTotal: (t) => `共 ${t} 条`, pageSize: 20 })}
          bordered
          size="middle"
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <div style={{ marginTop: 16, color: '#999' }}>暂无数据</div>
              </div>
            ),
          }}
          scroll={{ x: 3000 }}
        />
      </div>

      {/* 添加表单弹窗 */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={900}
        destroyOnClose
        bodyStyle={{ maxHeight: '80vh', overflowY: 'auto', padding: '0 24px' }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '16px 0 24px', color: '#333' }}>车辆档案识别</h2>
        <Form form={form} layout="vertical" initialValues={{ businessCode: '自动生成无需填写' }}>
          {/* 基本信息 */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Form.Item name="businessCode" label="业务编号" style={{ flex: 1 }}>
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="dateTime"
              label={<span><span style={{ color: '#ff4d4f' }}>*</span> 日期时间</span>}
              rules={[{ required: true, message: '请选择日期时间' }]}
              style={{ flex: 1 }}
            >
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>
            <Form.Item name="businessStaff" label="业务员" style={{ flex: 1 }}>
              <Select
                mode="tags"
                placeholder="请选择业务员"
                options={businessStaffOptions}
                tagRender={(props) => {
                  const { label, closable, onClose } = props;
                  return (
                    <Tag
                      color="blue"
                      closable={closable}
                      onClose={onClose}
                      style={{ marginRight: 4 }}
                    >
                      {label}
                    </Tag>
                  );
                }}
              />
            </Form.Item>
          </div>

          {/* 文件上传区 */}
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1890ff', borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 16 }}>
            文件上传区
          </h3>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <Form.Item label="行驶证" style={{ flex: 1, marginBottom: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Upload.Dragger
                  {...drivingUploadProps}
                  multiple={false}
                  style={{ padding: '8px 0', flex: 1 }}
                >
                  <p className="ant-upload-text" style={{ fontSize: 12 }}>选择 拖拽或单击后粘贴图片，单张20MB以内</p>
                </Upload.Dragger>
                <Button
                  icon={<QrcodeOutlined />}
                  onClick={() => openQrCode('driving')}
                  style={{ height: 40, width: 40 }}
                  title="扫码上传图片"
                />
              </div>
            </Form.Item>
            <Form.Item label="车辆登记证书" style={{ flex: 1, marginBottom: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Upload.Dragger
                  {...certUploadProps}
                  multiple={false}
                  style={{ padding: '8px 0', flex: 1 }}
                >
                  <p className="ant-upload-text" style={{ fontSize: 12 }}>选择 拖拽或单击后粘贴图片，单张20MB以内</p>
                </Upload.Dragger>
                <Button
                  icon={<QrcodeOutlined />}
                  onClick={() => openQrCode('cert')}
                  style={{ height: 40, width: 40 }}
                  title="扫码上传图片"
                />
              </div>
            </Form.Item>
          </div>

          {/* 行驶证识别内容 */}
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1890ff', borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 16 }}>
            行驶证识别内容
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <Form.Item name="plateNumber" label="号码号牌">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="vehicleType" label="车辆类型">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="owner" label="所有人">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="address" label="住址">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="usage" label="使用性质">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="brandModel" label="品牌型号">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="vin" label="车辆识别代号">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="engineNumber" label="发动机号码">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="registerDate" label="注册日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>
            <Form.Item name="issueDate" label="发证日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>
          </div>

          {/* 车辆登记证书识别内容 */}
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1890ff', borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 16 }}>
            车辆登记证书识别内容
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <Form.Item name="vehicleModel" label="车辆型号">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="vehicleType2" label="车辆类型">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="frameNumber" label="车架号">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="engineCode" label="发动机号">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="bodyColor" label="车身颜色">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="usageNature" label="使用性质">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="factoryDate" label="出厂日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>
            <Form.Item name="issueDate2" label="发证日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Button type="primary" size="large" onClick={() => handleModalOk(false)} style={{ minWidth: 120 }}>提交</Button>
            <Button size="large" onClick={() => handleModalOk(true)} style={{ minWidth: 120 }}>保存草稿</Button>
          </div>
        </Form>
      </Modal>

      {/* 二维码弹窗 */}
      <Modal
        open={qrCodeOpen}
        onCancel={() => setQrCodeOpen(false)}
        footer={null}
        width={320}
        centered
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div
            style={{
              width: 200,
              height: 200,
              margin: '0 auto',
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {qrCodeSvg}
          </div>
          <p style={{ marginTop: 16, fontSize: 14, color: '#333', fontWeight: 500 }}>扫描二维码，在手机上</p>
          <p style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>选择图片上传</p>
        </div>
      </Modal>
    </div>
  );
}
