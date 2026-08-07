import { Card, Table, Input, Button, Space, InputNumber, Select, DatePicker, Modal, Form, message } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

interface PriceChangeItem {
  id: number;
  code: string;
  productName: string;
  specification: string;
  originalPrice: number;
  newPrice: number;
  effectiveDate: string;
  operator: string;
  updateTime: string;
}

const mockData: PriceChangeItem[] = [
  { id: 1, code: 'XS20260801001', productName: '解放J6驾驶室总成', specification: '白色/国五', originalPrice: 12000, newPrice: 12500, effectiveDate: '2026-08-01', operator: '王经理', updateTime: '2026-08-01 09:00:00' },
  { id: 2, code: 'XS20260715002', productName: '东风天龙车架', specification: '轻量化', originalPrice: 8000, newPrice: 8500, effectiveDate: '2026-07-15', operator: '李经理', updateTime: '2026-07-15 10:30:00' },
  { id: 3, code: 'XS20260701003', productName: '重汽豪沃发动机', specification: '340马力', originalPrice: 17500, newPrice: 18000, effectiveDate: '2026-07-01', operator: '张经理', updateTime: '2026-07-01 14:00:00' },
];

const columns: ColumnsType<PriceChangeItem> = [
  { title: '单号', dataIndex: 'code', width: 160 },
  { title: '成品/配件名称', dataIndex: 'productName', width: 180 },
  { title: '规格', dataIndex: 'specification', width: 120 },
  { title: '原价(元)', dataIndex: 'originalPrice', width: 110, align: 'right', render: (v) => v.toLocaleString() },
  { title: '新价(元)', dataIndex: 'newPrice', width: 110, align: 'right', render: (v) => <span style={{ color: '#f5222d', fontWeight: 500 }}>{v.toLocaleString()}</span> },
  { title: '生效日期', dataIndex: 'effectiveDate', width: 120 },
  { title: '操作人', dataIndex: 'operator', width: 100 },
  { title: '更新时间', dataIndex: 'updateTime', width: 170 },
];

export default function ModifyShippingPrice() {
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item => item.code.includes(searchValue) || item.productName.includes(searchValue)));
    }
  };

  const handleAddSubmit = () => {
    form.validateFields().then(() => {
      message.success('修改成功');
      setAddModalOpen(false);
    });
  };

  return (
    <div style={{ padding: 0, background: '#f5f5f5', minHeight: '100%' }}>
      <Card style={{ margin: 0, borderRadius: 0 }} bodyStyle={{ padding: 0 }} title={null}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>添加</Button>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={() => message.success('导出成功')}>导出</Button>
            <Button icon={<DeleteOutlined />}>删除</Button>
          </Space>
          <Space>
            <Input.Search placeholder="搜索数据" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onSearch={handleSearch} style={{ width: 200 }} allowClear />
            <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
          </Space>
        </div>
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table rowKey="id" columns={columns} dataSource={dataSource} pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
        </div>
      </Card>

      <Modal open={addModalOpen} onCancel={() => setAddModalOpen(false)} footer={null} width={600} title="修改出货价格">
        <Form form={form} layout="vertical" initialValues={{ type: 'finished' }}>
          <Form.Item label="类型" name="type" rules={[{ required: true }]}>
            <Select options={[
              { value: 'finished', label: '成品' },
              { value: 'part', label: '配件' },
            ]} />
          </Form.Item>
          <Form.Item label="名称" name="productName" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item label="规格" name="specification">
            <Input placeholder="请输入规格" />
          </Form.Item>
          <Form.Item label="原价(元)" name="originalPrice" rules={[{ required: true, message: '请输入原价' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
          <Form.Item label="新价(元)" name="newPrice" rules={[{ required: true, message: '请输入新价' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
          <Form.Item label="生效日期" name="effectiveDate" rules={[{ required: true, message: '请选择生效日期' }]}>
            <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleAddSubmit} style={{ width: '100%' }}>提交</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
