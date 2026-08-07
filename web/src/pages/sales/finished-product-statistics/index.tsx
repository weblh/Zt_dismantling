import { Card, Table, Input, Button, Space, message } from 'antd';
import { ImportOutlined, ExportOutlined, FilterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

interface StatItem {
  id: number;
  month: string;
  totalSales: number;
  totalAmount: number;
  totalCost: number;
  profit: number;
  operator: string;
}

const mockData: StatItem[] = [
  { id: 1, month: '2026年7月', totalSales: 156, totalAmount: 1258000, totalCost: 980000, profit: 278000, operator: '王经理' },
  { id: 2, month: '2026年6月', totalSales: 142, totalAmount: 1120000, totalCost: 875000, profit: 245000, operator: '王经理' },
  { id: 3, month: '2026年5月', totalSales: 138, totalAmount: 1090000, totalCost: 850000, profit: 240000, operator: '李经理' },
  { id: 4, month: '2026年4月', totalSales: 125, totalAmount: 980000, totalCost: 760000, profit: 220000, operator: '李经理' },
  { id: 5, month: '2026年3月', totalSales: 118, totalAmount: 920000, totalCost: 710000, profit: 210000, operator: '张经理' },
];

const columns: ColumnsType<StatItem> = [
  { title: '月份', dataIndex: 'month', width: 120 },
  { title: '销售数量', dataIndex: 'totalSales', width: 120, align: 'right' },
  { title: '销售金额(元)', dataIndex: 'totalAmount', width: 150, align: 'right', render: (v) => v.toLocaleString() },
  { title: '成本(元)', dataIndex: 'totalCost', width: 150, align: 'right', render: (v) => v.toLocaleString() },
  { title: '利润(元)', dataIndex: 'profit', width: 150, align: 'right', render: (v) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{v.toLocaleString()}</span> },
  { title: '业务员', dataIndex: 'operator', width: 100 },
];

export default function FinishedProductStatistics() {
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item => item.month.includes(searchValue) || item.operator.includes(searchValue)));
    }
  };

  return (
    <div style={{ padding: 0, background: '#f5f5f5', minHeight: '100%' }}>
      <Card style={{ margin: 0, borderRadius: 0 }} bodyStyle={{ padding: 0 }} title={null}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={() => message.success('导出成功')}>导出</Button>
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
