import { Card, Table, Input, Button, Space, Tag, message } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface PartStockItem {
  id: number;
  partCode: string;
  partName: string;
  specification: string;
  category: string;
  stock: number;
  unit: string;
  unitPrice: number;
  location: string;
  updateTime: string;
}

const mockData: PartStockItem[] = [
  { id: 1, partCode: 'PJ001', partName: '机油滤清器', specification: 'JX0818', category: '滤清器', stock: 150, unit: '个', unitPrice: 25, location: 'A区-01', updateTime: '2026-08-03 09:30' },
  { id: 2, partCode: 'PJ002', partName: '刹车片', specification: '前片', category: '制动', stock: 80, unit: '副', unitPrice: 85, location: 'A区-02', updateTime: '2026-08-03 10:15' },
  { id: 3, partCode: 'PJ003', partName: '轮胎', specification: '11R22.5', category: '轮胎', stock: 35, unit: '条', unitPrice: 1200, location: 'B区-01', updateTime: '2026-08-02 14:20' },
  { id: 4, partCode: 'PJ004', partName: '蓄电池', specification: '12V 100Ah', category: '电器', stock: 45, unit: '个', unitPrice: 450, location: 'B区-02', updateTime: '2026-08-02 11:05' },
  { id: 5, partCode: 'PJ005', partName: '雨刮片', specification: '22寸', category: '电器', stock: 200, unit: '片', unitPrice: 35, location: 'A区-03', updateTime: '2026-08-01 16:30' },
];

const columns: ColumnsType<PartStockItem> = [
  { title: '配件编码', dataIndex: 'partCode', width: 120 },
  { title: '配件名称', dataIndex: 'partName', width: 140 },
  { title: '规格型号', dataIndex: 'specification', width: 120 },
  { title: '分类', dataIndex: 'category', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
  { title: '库存数量', dataIndex: 'stock', width: 100, align: 'right' },
  { title: '单位', dataIndex: 'unit', width: 80, align: 'center' },
  { title: '单价(元)', dataIndex: 'unitPrice', width: 110, align: 'right', render: (v) => v.toLocaleString() },
  { title: '库位', dataIndex: 'location', width: 100 },
  { title: '更新时间', dataIndex: 'updateTime', width: 140 },
];

export default function PartStock() {
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item => item.partCode.includes(searchValue) || item.partName.includes(searchValue) || item.category.includes(searchValue)));
    }
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />}>添加</Button>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={() => message.success('导出成功')}>导出</Button>
            <Button icon={<DeleteOutlined />}>删除</Button>
          </Space>
          <Space wrap>
            <Input.Search placeholder="搜索数据" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onSearch={handleSearch} style={{ width: isMobile ? '100%' : 200 }} allowClear />
            <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
          </Space>
        </div>
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table rowKey="id" columns={columns} dataSource={dataSource} pagination={withMobilePagination(isMobile, { showSizeChanger: true, showTotal: (t) => `共 ${t} 条` })} />
        </div>
      </Card>
    </div>
  );
}
