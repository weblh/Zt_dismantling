import { Card, Table, Input, Button, Space, message, Modal, Form, InputNumber } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined, ColumnHeightOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface InboundItem {
  id: number;
  machineryNo: string;
  source: string;
  type: string;
  weight: number;
  unitPrice: number;
  amount: number;
  warehouse: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: InboundItem[] = [];

const columns: ColumnsType<InboundItem> = [
  { title: '农机编号', dataIndex: 'machineryNo', width: 140 },
  { title: '来源', dataIndex: 'source', width: 120 },
  { title: '类型', dataIndex: 'type', width: 100 },
  { title: '吨位(净重)', dataIndex: 'weight', width: 110, align: 'right' },
  { title: '单价', dataIndex: 'unitPrice', width: 100, align: 'right', render: (v: number) => <span style={{ color: '#f5222d' }}>¥{v.toFixed(2)}</span> },
  { title: '金额', dataIndex: 'amount', width: 120, align: 'right', render: (v: number) => <span style={{ color: '#f5222d' }}>¥{v.toLocaleString()}</span> },
  { title: '仓库', dataIndex: 'warehouse', width: 100 },
  { title: '提交人', dataIndex: 'submitter', width: 90, render: (v: string) => <span style={{ color: '#1890ff' }}>{v}</span> },
  { title: '提交时间', dataIndex: 'submitTime', width: 140 },
  { title: '更新时间', dataIndex: 'updateTime', width: 140 },
];

export default function MachineryInbound() {
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item =>
        item.machineryNo.includes(searchValue) ||
        item.source.includes(searchValue) ||
        item.type.includes(searchValue)
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
        {/* Top view tabs */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', gap: 16 }}>
          <Space wrap>
            <Button size="small" type="primary" ghost>全部权限</Button>
          </Space>
          <div style={{ flex: 1 }} />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} style={{ background: '#13c2c2', borderColor: '#13c2c2' }} onClick={() => setAddOpen(true)}>添加</Button>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={() => message.success('导出成功')}>导出</Button>
            <Button icon={<DeleteOutlined />}>删除</Button>
            <Button>操作记录</Button>
          </Space>
          <Space wrap>
            <Input.Search placeholder="搜索数据" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onSearch={handleSearch} style={{ width: isMobile ? '100%' : 200 }} allowClear />
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
            scroll={{ x: 1200 }}
            pagination={withMobilePagination(isMobile, {
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              pageSize: 20,
            })}
          />
        </div>
      </Card>

      {/* Add Modal */}
      <Modal
        title="原材料-农机入库"
        open={addOpen}
        onCancel={() => { setAddOpen(false); form.resetFields(); }}
        footer={null}
        width={560}
        centered
        closeIcon={<CloseOutlined />}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 农机编号</span>} name="machineryNo" rules={[{ required: true, message: '请输入农机编号' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 来源</span>} name="source" rules={[{ required: true, message: '请输入来源' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 类型</span>} name="type" rules={[{ required: true, message: '请输入类型' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 吨位(净重)</span>} name="weight" rules={[{ required: true, message: '请填写数值' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 单价</span>} name="unitPrice" rules={[{ required: true, message: '请填写数值' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 金额</span>} name="amount" rules={[{ required: true, message: '请填写数值' }]}>
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
