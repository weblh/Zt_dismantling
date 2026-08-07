import { Card, Table, Input, Button, Space, Tag, message, Modal, Form, DatePicker } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, FilterOutlined, CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

interface VoidItem {
  id: number;
  certificateNo: string;
  vehicleModel: string;
  vehicleNo: string;
  ownerName: string;
  recycleDate: string;
  voidReason: string;
  voidDate: string;
  operator: string;
}

const mockData: VoidItem[] = [
  { id: 1, certificateNo: 'HS20260728001', vehicleModel: '解放J6', vehicleNo: '晋A12345', ownerName: '太原市运输公司', recycleDate: '2026-07-28', voidReason: '信息错误', voidDate: '2026-07-29', operator: '王经理' },
  { id: 2, certificateNo: 'HS20260725002', vehicleModel: '东风天龙', vehicleNo: '晋B67890', ownerName: '大同市物流有限公司', recycleDate: '2026-07-25', voidReason: '重复录入', voidDate: '2026-07-26', operator: '李经理' },
  { id: 3, certificateNo: 'HS20260720003', vehicleModel: '重汽豪沃', vehicleNo: '晋C11111', ownerName: '临汾市货运公司', recycleDate: '2026-07-20', voidReason: '车牌错误', voidDate: '2026-07-21', operator: '张经理' },
];

const columns: ColumnsType<VoidItem> = [
  { title: '证明编号', dataIndex: 'certificateNo', width: 160 },
  { title: '车辆型号', dataIndex: 'vehicleModel', width: 120 },
  { title: '车牌号', dataIndex: 'vehicleNo', width: 120 },
  { title: '车主', dataIndex: 'ownerName', width: 180 },
  { title: '回收日期', dataIndex: 'recycleDate', width: 120 },
  { title: '作废原因', dataIndex: 'voidReason', width: 120, render: (v: string) => <Tag color="red">{v}</Tag> },
  { title: '作废日期', dataIndex: 'voidDate', width: 120 },
  { title: '操作人', dataIndex: 'operator', width: 100 },
];

export default function RecycleCertificateVoid() {
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item => item.certificateNo.includes(searchValue) || item.vehicleModel.includes(searchValue)));
    }
  };

  const handleSubmit = () => {
    form.validateFields().then(() => {
      message.success('提交成功');
      setAddOpen(false);
      form.resetFields();
    });
  };

  const handleSaveDraft = () => {
    message.success('保存草稿成功');
    setAddOpen(false);
    form.resetFields();
  };

  return (
    <div style={{ padding: 0, background: '#f5f5f5', minHeight: '100%' }}>
      <Card style={{ margin: 0, borderRadius: 0 }} bodyStyle={{ padding: 0 }} title={null}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} style={{ background: '#13c2c2', borderColor: '#13c2c2' }} onClick={() => setAddOpen(true)}>添加</Button>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={() => message.success('导出成功')}>导出</Button>
          </Space>
          <Space>
            <Input.Search placeholder="搜索数据" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onSearch={handleSearch} style={{ width: 200 }} allowClear />
            <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
          </Space>
        </div>
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          />
        </div>
      </Card>

      {/* Add Modal */}
      <Modal
        title="回收证明作废台账"
        open={addOpen}
        onCancel={() => { setAddOpen(false); form.resetFields(); }}
        footer={null}
        width={560}
        centered
        closeIcon={<CloseOutlined />}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="编号" name="no" rules={[{ required: true, message: '请输入编号' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label="车牌号" name="plateNo" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label="车辆所有人" name="owner" rules={[{ required: true, message: '请输入车辆所有人' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label="回收证明编号" name="certificateNo" rules={[{ required: true, message: '请输入回收证明编号' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label="开具日期" name="issueDate" rules={[{ required: true, message: '请选择开具日期' }]}>
            <DatePicker style={{ width: '100%' }} suffixIcon={<CalendarOutlined />} />
          </Form.Item>
          <Form.Item label="作废原因" name="voidReason" rules={[{ required: true, message: '请输入作废原因' }]}>
            <TextArea rows={4} placeholder="请输入" />
          </Form.Item>
          <Form.Item label="作废日期" name="voidDate" rules={[{ required: true, message: '请选择作废日期' }]}>
            <DatePicker style={{ width: '100%' }} suffixIcon={<CalendarOutlined />} />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 16, marginTop: 16 }}>
            <Button type="primary" onClick={handleSubmit} style={{ background: '#13c2c2', borderColor: '#13c2c2', paddingLeft: 32, paddingRight: 32 }}>提交</Button>
            <Button onClick={handleSaveDraft} style={{ paddingLeft: 32, paddingRight: 32 }}>保存草稿</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
