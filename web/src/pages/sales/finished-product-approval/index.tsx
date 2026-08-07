import { Card, Table, Input, Button, Space, Tag, message } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

interface SaleApprovalItem {
  id: number;
  code: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  applicant: string;
  applyDate: string;
  status: string;
}

const mockData: SaleApprovalItem[] = [
  { id: 1, code: 'XS20260803001', productName: '解放J6驾驶室总成', quantity: 2, unitPrice: 12500, totalAmount: 25000, applicant: '王经理', applyDate: '2026-08-03 09:30:00', status: '待审批' },
  { id: 2, code: 'XS20260803002', productName: '东风天龙车架', quantity: 1, unitPrice: 8500, totalAmount: 8500, applicant: '李经理', applyDate: '2026-08-03 10:15:00', status: '已通过' },
  { id: 3, code: 'XS20260802003', productName: '重汽豪沃发动机', quantity: 3, unitPrice: 18000, totalAmount: 54000, applicant: '张经理', applyDate: '2026-08-02 14:20:00', status: '待审批' },
];

const columns: ColumnsType<SaleApprovalItem> = [
  { title: '审批单号', dataIndex: 'code', width: 160 },
  { title: '成品名称', dataIndex: 'productName', width: 180 },
  { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
  { title: '单价(元)', dataIndex: 'unitPrice', width: 110, align: 'right', render: (v) => v.toLocaleString() },
  { title: '金额(元)', dataIndex: 'totalAmount', width: 120, align: 'right', render: (v) => <span style={{ color: '#f5222d' }}>{v.toLocaleString()}</span> },
  { title: '申请人', dataIndex: 'applicant', width: 100 },
  { title: '申请时间', dataIndex: 'applyDate', width: 170 },
  { title: '状态', dataIndex: 'status', width: 100, render: (v: string) => (
    <Tag color={v === '已通过' ? 'green' : v === '待审批' ? 'orange' : 'default'}>{v}</Tag>
  )},
];

export default function FinishedProductApproval() {
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item => item.code.includes(searchValue) || item.productName.includes(searchValue)));
    }
  };

  return (
    <div style={{ padding: 0, background: '#f5f5f5', minHeight: '100%' }}>
      <Card style={{ margin: 0, borderRadius: 0 }} bodyStyle={{ padding: 0 }} title={null}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>添加</Button>
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
    </div>
  );
}
