import { Card, Table, Input, Button, Space, Tag, message, Modal, Form, DatePicker, Select } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined, CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

interface OuhaiItem {
  id: number;
  dateTime: string;
  entryNo: string;
  ownerName: string;
  plateNo: string;
  usageType: string;
  vin: string;
  procedures: string;
  salesperson: string;
  isCompleted: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: OuhaiItem[] = [
  {
    id: 1, dateTime: '2026-08-03 10:30', entryNo: 'HS001', ownerName: '太原市运输公司', plateNo: '晋A12345',
    usageType: '营运', vin: 'LJ1ABC12345678901', procedures: '已齐全', salesperson: '王经理',
    isCompleted: '是', submitter: '张明', submitTime: '2026-08-03 10:30', updateTime: '2026-08-03 14:20',
  },
  {
    id: 2, dateTime: '2026-08-03 11:15', entryNo: 'HS002', ownerName: '大同市物流有限公司', plateNo: '晋B67890',
    usageType: '非营运', vin: 'LJ1XYZ98765432109', procedures: '部分缺失', salesperson: '李经理',
    isCompleted: '否', submitter: '张明', submitTime: '2026-08-03 11:15', updateTime: '2026-08-03 15:00',
  },
  {
    id: 3, dateTime: '2026-08-02 09:45', entryNo: 'HS003', ownerName: '临汾市货运公司', plateNo: '晋C11111',
    usageType: '营运', vin: 'LJ2ABC55555666667', procedures: '已齐全', salesperson: '张经理',
    isCompleted: '是', submitter: '张明', submitTime: '2026-08-02 09:45', updateTime: '2026-08-02 13:30',
  },
];

const columns: ColumnsType<OuhaiItem> = [
  { title: '日期时间', dataIndex: 'dateTime', width: 140, fixed: 'left' },
  { title: '入场编号', dataIndex: 'entryNo', width: 100 },
  { title: '车辆所有人', dataIndex: 'ownerName', width: 160 },
  { title: '车牌号', dataIndex: 'plateNo', width: 120 },
  { title: '使用性质', dataIndex: 'usageType', width: 90 },
  { title: '车架号', dataIndex: 'vin', width: 170 },
  { title: '手续', dataIndex: 'procedures', width: 100, render: (v: string) => <Tag color={v === '已齐全' ? 'green' : 'orange'}>{v}</Tag> },
  { title: '业务员', dataIndex: 'salesperson', width: 100 },
  { title: '是否完成', dataIndex: 'isCompleted', width: 90, render: (v: string) => <Tag color={v === '是' ? 'green' : 'red'}>{v}</Tag> },
  { title: '提交人', dataIndex: 'submitter', width: 90, render: (v: string) => <span style={{ color: '#1890ff' }}>{v}</span> },
  { title: '提交时间', dataIndex: 'submitTime', width: 140 },
  { title: '更新时间', dataIndex: 'updateTime', width: 140 },
];

const usageTypeOptions = ['营运', '非营运', '租赁', '公务', '其他'];
const proceduresOptions = ['已齐全', '部分缺失', '缺失'];
const yesNoOptions = ['是', '否'];

export default function OuhaiFormalities() {
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item =>
        item.entryNo.includes(searchValue) ||
        item.plateNo.includes(searchValue) ||
        item.ownerName.includes(searchValue)
      ));
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
            <Button icon={<DeleteOutlined />}>删除</Button>
            <Button>操作记录</Button>
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
            scroll={{ x: 1400 }}
            pagination={{ showSizeChanger: true, showTotal: (t) => `0条 / 共 ${t} 条`, pageSize: 20 }}
          />
        </div>
      </Card>

      {/* Add Modal */}
      <Modal
        title="欧海手续详情"
        open={addOpen}
        onCancel={() => { setAddOpen(false); form.resetFields(); }}
        footer={null}
        width={560}
        centered
        closeIcon={<CloseOutlined />}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 日期时间</span>} name="dateTime" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} suffixIcon={<CalendarOutlined />} placeholder="请选择日期" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 入场编号</span>} name="entryNo" rules={[{ required: true, message: '请输入入场编号' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 车辆所有人</span>} name="ownerName" rules={[{ required: true, message: '请输入车辆所有人' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 车牌号</span>} name="plateNo" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 使用性质</span>} name="usageType" rules={[{ required: true, message: '请选择使用性质' }]}>
            <Select placeholder="请选择" options={usageTypeOptions.map(o => ({ label: o, value: o }))} />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 车架号</span>} name="vin" rules={[{ required: true, message: '请输入车架号' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 手续</span>} name="procedures" rules={[{ required: true, message: '请选择手续状态' }]}>
            <Select placeholder="请选择" options={proceduresOptions.map(o => ({ label: o, value: o }))} />
          </Form.Item>
          <Form.Item label="业务员" name="salesperson">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 是否完成</span>} name="isCompleted" rules={[{ required: true, message: '请选择是否完成' }]}>
            <Select placeholder="请选择" options={yesNoOptions.map(o => ({ label: o, value: o }))} />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <TextArea rows={4} placeholder="请输入" style={{ resize: 'vertical' }} />
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
