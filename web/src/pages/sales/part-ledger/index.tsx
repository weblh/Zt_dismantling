import { Card, Table, Input, Button, Space, message } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

interface PartLedgerItem {
  id: number;
  code: string;
  partName: string;
  specification: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  customer: string;
  operator: string;
}

const mockData: PartLedgerItem[] = [
  { id: 1, code: 'PJ20260801001', partName: '机油滤清器', specification: 'JX0818', quantity: 50, unitPrice: 25, totalAmount: 1250, saleDate: '2026-08-01', customer: '长春一汽修理厂', operator: '王经理' },
  { id: 2, code: 'PJ20260801002', partName: '刹车片', specification: '前片', quantity: 20, unitPrice: 85, totalAmount: 1700, saleDate: '2026-08-01', customer: '武汉东风服务站', operator: '李经理' },
  { id: 3, code: 'PJ20260731003', partName: '轮胎', specification: '11R22.5', quantity: 10, unitPrice: 1200, totalAmount: 12000, saleDate: '2026-07-31', customer: '济南重汽4S店', operator: '张经理' },
];

const columns: ColumnsType<PartLedgerItem> = [
  { title: '销售单号', dataIndex: 'code', width: 160 },
  { title: '配件名称', dataIndex: 'partName', width: 160 },
  { title: '规格型号', dataIndex: 'specification', width: 120 },
  { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
  { title: '单价(元)', dataIndex: 'unitPrice', width: 110, align: 'right', render: (v) => v.toLocaleString() },
  { title: '金额(元)', dataIndex: 'totalAmount', width: 120, align: 'right', render: (v) => <span style={{ color: '#f5222d' }}>{v.toLocaleString()}</span> },
  { title: '销售日期', dataIndex: 'saleDate', width: 120 },
  { title: '客户', dataIndex: 'customer', width: 160 },
  { title: '业务员', dataIndex: 'operator', width: 100 },
];

export default function PartLedger() {
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item => item.code.includes(searchValue) || item.partName.includes(searchValue) || item.customer.includes(searchValue)));
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
