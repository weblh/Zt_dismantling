import { Card, Table, Input, Button, Space, Tag, message } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface PartInfoItem {
  id: number;
  partCode: string;
  partName: string;
  specification: string;
  brand: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  supplier: string;
  createTime: string;
}

const mockData: PartInfoItem[] = [
  { id: 1, partCode: 'PJ001', partName: '机油滤清器', specification: 'JX0818', brand: '曼牌', category: '滤清器', unit: '个', purchasePrice: 18, salePrice: 25, supplier: '郑州汽配城', createTime: '2026-01-15 10:30' },
  { id: 2, partCode: 'PJ002', partName: '刹车片', specification: '前片', brand: '博世', category: '制动', unit: '副', purchasePrice: 60, salePrice: 85, supplier: '济南汽配批发', createTime: '2026-02-20 14:20' },
  { id: 3, partCode: 'PJ003', partName: '轮胎', specification: '11R22.5', brand: '三角', category: '轮胎', unit: '条', purchasePrice: 980, salePrice: 1200, supplier: '青岛轮胎厂', createTime: '2026-03-10 09:15' },
  { id: 4, partCode: 'PJ004', partName: '蓄电池', specification: '12V 100Ah', brand: '风帆', category: '电器', unit: '个', purchasePrice: 380, salePrice: 450, supplier: '保定蓄电池厂', createTime: '2026-04-05 11:45' },
  { id: 5, partCode: 'PJ005', partName: '雨刮片', specification: '22寸', brand: '博士', category: '电器', unit: '片', purchasePrice: 25, salePrice: 35, supplier: '郑州汽配城', createTime: '2026-05-18 16:00' },
];

const columns: ColumnsType<PartInfoItem> = [
  { title: '配件编码', dataIndex: 'partCode', width: 120 },
  { title: '配件名称', dataIndex: 'partName', width: 140 },
  { title: '规格型号', dataIndex: 'specification', width: 120 },
  { title: '品牌', dataIndex: 'brand', width: 100 },
  { title: '分类', dataIndex: 'category', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
  { title: '单位', dataIndex: 'unit', width: 80, align: 'center' },
  { title: '进价(元)', dataIndex: 'purchasePrice', width: 110, align: 'right', render: (v) => v.toLocaleString() },
  { title: '售价(元)', dataIndex: 'salePrice', width: 110, align: 'right', render: (v) => <span style={{ color: '#f5222d' }}>{v.toLocaleString()}</span> },
  { title: '供应商', dataIndex: 'supplier', width: 140 },
  { title: '创建时间', dataIndex: 'createTime', width: 140 },
];

export default function PartInfoCustomer() {
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item => item.partCode.includes(searchValue) || item.partName.includes(searchValue) || item.brand.includes(searchValue)));
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
