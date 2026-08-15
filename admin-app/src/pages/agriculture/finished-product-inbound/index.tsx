import { Card, Table, Input, Button, Space, message, Modal, Form, InputNumber, Radio } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined, ColumnHeightOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

interface FinishedInboundItem {
  id: number;
  productName: string;
  netWeight: number;
  cost: number;
  warehouse: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: FinishedInboundItem[] = [];

const columns: ColumnsType<FinishedInboundItem> = [
  { title: '品名', dataIndex: 'productName', width: 120 },
  { title: '净重', dataIndex: 'netWeight', width: 100, align: 'right', render: (v: number) => v > 0 ? v.toFixed(2) : '' },
  { title: '成本', dataIndex: 'cost', width: 120, align: 'right', render: (v: number) => v > 0 ? <span style={{ color: '#f5222d' }}>¥{v.toLocaleString()}</span> : '' },
  { title: '仓库', dataIndex: 'warehouse', width: 100 },
  { title: '提交人', dataIndex: 'submitter', width: 90, render: (v: string) => <span style={{ color: '#1890ff' }}>{v}</span> },
  { title: '提交时间', dataIndex: 'submitTime', width: 140 },
  { title: '更新时间', dataIndex: 'updateTime', width: 140 },
];

const productNameOptions = [
  { label: '农机毛料', value: '农机毛料', style: { background: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
  { label: '其他', value: '其他', style: { borderRadius: 4, padding: '2px 12px' } },
];

export default function FinishedProductInbound() {
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item =>
        item.productName.includes(searchValue) ||
        item.warehouse.includes(searchValue)
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
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* Toolbar */}
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
            <Button icon={<ColumnHeightOutlined />}>排序</Button>
            <Button>更多</Button>
          </Space>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            scroll={{ x: 900 }}
            pagination={{
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              pageSize: 20,
            }}
          />
        </div>
      </Card>

      {/* Add Modal */}
      <Modal
        title="农机成品入库"
        open={addOpen}
        onCancel={() => { setAddOpen(false); form.resetFields(); }}
        footer={null}
        width={560}
        centered
        closeIcon={<CloseOutlined />}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="品名" name="productName" rules={[{ required: true, message: '请选择品名' }]} initialValue="农机毛料">
            <Radio.Group options={productNameOptions} />
          </Form.Item>
          <Form.Item label="净重" name="netWeight" rules={[{ required: true, message: '请填写净重' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="成本" name="cost" rules={[{ required: true, message: '请填写成本' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
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
