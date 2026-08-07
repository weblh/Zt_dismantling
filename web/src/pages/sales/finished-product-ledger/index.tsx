import { Card, Table, Input, Button, Space, message } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

interface LedgerItem {
  id: number;
  code: string;
  productName: string;
  specification: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  customer: string;
  operator: string;
}

const mockData: LedgerItem[] = [
  { id: 1, code: 'XS20260801001', productName: '解放J6驾驶室总成', specification: '白色/国五', quantity: 2, unitPrice: 12500, totalAmount: 25000, saleDate: '2026-08-01', customer: '长春一汽修理厂', operator: '王经理' },
  { id: 2, code: 'XS20260801002', productName: '东风天龙车架', specification: '轻量化', quantity: 1, unitPrice: 8500, totalAmount: 8500, saleDate: '2026-08-01', customer: '武汉东风服务站', operator: '李经理' },
  { id: 3, code: 'XS20260731003', productName: '重汽豪沃发动机', specification: '340马力', quantity: 3, unitPrice: 18000, totalAmount: 54000, saleDate: '2026-07-31', customer: '济南重汽4S店', operator: '张经理' },
];

const columns: ColumnsType<LedgerItem> = [
  { title: '销售单号', dataIndex: 'code', width: 160 },
  { title: '成品名称', dataIndex: 'productName', width: 180 },
  { title: '规格', dataIndex: 'specification', width: 120 },
  { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
  { title: '单价(元)', dataIndex: 'unitPrice', width: 110, align: 'right', render: (v) => v.toLocaleString() },
  { title: '金额(元)', dataIndex: 'totalAmount', width: 120, align: 'right', render: (v) => <span style={{ color: '#f5222d' }}>{v.toLocaleString()}</span> },
  { title: '销售日期', dataIndex: 'saleDate', width: 120 },
  { title: '客户', dataIndex: 'customer', width: 160 },
  { title: '业务员', dataIndex: 'operator', width: 100 },
];

export default function FinishedProductLedger() {
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item => item.code.includes(searchValue) || item.productName.includes(searchValue) || item.customer.includes(searchValue)));
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
