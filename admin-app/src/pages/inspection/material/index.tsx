import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface MaterialItem {
  key: string;
  code: string;
  name: string;
  specification: string;
  unit: string;
  stock: number;
  supplier: string;
  createTime: string;
}

const materialData: MaterialItem[] = [
  { key: '1', code: 'WL001', name: '安全帽', specification: '标准', unit: '顶', stock: 200, supplier: '安全用品有限公司', createTime: '2026-01-15 10:30:00' },
  { key: '2', code: 'WL002', name: '安全带', specification: '全身式', unit: '条', stock: 150, supplier: '安全用品有限公司', createTime: '2026-01-20 09:15:00' },
  { key: '3', code: 'WL003', name: '护目镜', specification: '防冲击', unit: '副', stock: 300, supplier: '劳保用品厂', createTime: '2026-02-01 14:20:00' },
  { key: '4', code: 'WL004', name: '防尘口罩', specification: 'KN95', unit: '个', stock: 500, supplier: '劳保用品厂', createTime: '2026-02-10 11:00:00' },
  { key: '5', code: 'WL005', name: '绝缘手套', specification: '10KV', unit: '双', stock: 80, supplier: '电力器材公司', createTime: '2026-03-01 16:45:00' },
];

export default function Material() {
  const columns: ColumnsType<MaterialItem> = [
    { title: '物料编号', dataIndex: 'code', width: 120 },
    { title: '物料名称', dataIndex: 'name', width: 120 },
    { title: '规格', dataIndex: 'specification', width: 120 },
    { title: '单位', dataIndex: 'unit', width: 80 },
    { title: '库存数量', dataIndex: 'stock', width: 100, align: 'right' },
    { title: '供应商', dataIndex: 'supplier', width: 180 },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: () => (
        <Space>
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small" danger>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title="物料管理" extra={
        <Space>
          <Input placeholder="搜索物料名称" prefix={<SearchOutlined />} style={{ width: 200 }} />
          <Button type="primary" icon={<PlusOutlined />}>添加物料</Button>
        </Space>
      }>
        <Table columns={columns} dataSource={materialData} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
