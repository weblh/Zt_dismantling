import { Card, Table, Input, Button, Space, message, Modal, Form, InputNumber, Select } from 'antd';
import { PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined, ColumnHeightOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface OutboundItem {
  id: number;
  machineryNo: string;
  source: string;
  type: string;
  weight: number;
  unitPrice: number;
  amount: number;
  dismantler: string;
  warehouse: string;
  submitter: string;
}

const mockData: OutboundItem[] = [];

const columns: ColumnsType<OutboundItem> = [
  { title: '农机编号', dataIndex: 'machineryNo', width: 140 },
  { title: '来源', dataIndex: 'source', width: 120 },
  { title: '类型', dataIndex: 'type', width: 100 },
  { title: '吨位(净重)', dataIndex: 'weight', width: 110, align: 'right' },
  { title: '单价', dataIndex: 'unitPrice', width: 100, align: 'right', render: (v: number) => <span style={{ color: '#f5222d' }}>¥{v.toFixed(2)}</span> },
  { title: '金额', dataIndex: 'amount', width: 120, align: 'right', render: (v: number) => <span style={{ color: '#f5222d' }}>¥{v.toLocaleString()}</span> },
  { title: '拆解人', dataIndex: 'dismantler', width: 100 },
  { title: '仓库', dataIndex: 'warehouse', width: 100 },
  { title: '提交人', dataIndex: 'submitter', width: 90, render: (v: string) => <span style={{ color: '#1890ff' }}>{v}</span> },
];

export default function MachineryOutbound() {
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item =>
        item.machineryNo.includes(searchValue) ||
        item.source.includes(searchValue)
      ));
    }
  };

  const handleSubmit = () => {
    form.validateFields().then(() => {
      message.success('提交成功');
      setAddOpen(false);
      form.resetFields();
      setSelectedMember(null);
    });
  };

  const handleSaveDraft = () => {
    message.success('保存草稿成功');
    setAddOpen(false);
    form.resetFields();
    setSelectedMember(null);
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} style={{ background: '#13c2c2', borderColor: '#13c2c2' }} onClick={() => setAddOpen(true)}>添加</Button>
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
            scroll={{ x: 1100 }}
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
        title="原材料-农机出库"
        open={addOpen}
        onCancel={() => { setAddOpen(false); form.resetFields(); setSelectedMember(null); }}
        footer={null}
        width={720}
        centered
        closeIcon={<CloseOutlined />}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {/* Row 1: 3 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            <Form.Item label="农机编号" name="machineryNo" rules={[{ required: true, message: '请选择农机编号' }]}>
              <Select placeholder="请选择" />
            </Form.Item>
            <Form.Item label="来源" name="source" rules={[{ required: true, message: '请输入来源' }]}>
              <Input placeholder="暂无内容" />
            </Form.Item>
            <Form.Item label="类型" name="type" rules={[{ required: true, message: '请输入类型' }]}>
              <Input placeholder="暂无内容" />
            </Form.Item>
          </div>

          {/* Row 2: 3 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            <Form.Item label="吨位(净重)" name="weight" rules={[{ required: true, message: '请填写数值' }]}>
              <InputNumber style={{ width: '100%' }} placeholder="暂无内容" />
            </Form.Item>
            <Form.Item label="单价" name="unitPrice" rules={[{ required: true, message: '请填写数值' }]}>
              <InputNumber style={{ width: '100%' }} placeholder="暂无内容" />
            </Form.Item>
            <Form.Item label="金额" name="amount" rules={[{ required: true, message: '请填写数值' }]}>
              <InputNumber style={{ width: '100%' }} placeholder="暂无内容" />
            </Form.Item>
          </div>

          {/* Row 3: 拆解人 */}
          <Form.Item label="拆解人" name="dismantler">
            {selectedMember ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  background: '#fafafa',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#1890ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                  }}
                >
                  {selectedMember.charAt(0)}
                </div>
                <span style={{ fontSize: 14 }}>{selectedMember}</span>
                <CloseOutlined
                  style={{ fontSize: 10, color: '#999', cursor: 'pointer' }}
                  onClick={() => setSelectedMember(null)}
                />
              </div>
            ) : (
              <div
                onClick={() => setSelectedMember('张三')}
                style={{
                  border: '1px dashed #d9d9d9',
                  borderRadius: 4,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  color: '#1890ff',
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <UserOutlined /> + 选择成员
              </div>
            )}
          </Form.Item>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 16, marginTop: 16 }}>
            <Button type="primary" onClick={handleSubmit} style={{ background: '#13c2c2', borderColor: '#13c2c2', paddingLeft: 32, paddingRight: 32 }}>提交</Button>
            <Button onClick={handleSaveDraft} style={{ paddingLeft: 32, paddingRight: 32 }}>保存草稿</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
