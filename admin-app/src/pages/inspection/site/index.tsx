import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface SiteItem {
  key: string;
  siteCode: string;
  siteName: string;
  siteType: string;
  location: string;
  manager: string;
  phone: string;
  status: string;
  createTime: string;
}

const siteData: SiteItem[] = [
  { key: '1', siteCode: 'ZD001', siteName: '拆解一号车间', siteType: '生产车间', location: 'A区1号', manager: '张经理', phone: '13800000001', status: '正常', createTime: '2026-01-10 09:00:00' },
  { key: '2', siteCode: 'ZD002', siteName: '拆解二号车间', siteType: '生产车间', location: 'A区2号', manager: '李经理', phone: '13800000002', status: '正常', createTime: '2026-01-15 10:30:00' },
  { key: '3', siteCode: 'ZD003', siteName: '成品仓库', siteType: '仓库', location: 'B区1号', manager: '王主任', phone: '13800000003', status: '正常', createTime: '2026-02-01 14:20:00' },
  { key: '4', siteCode: 'ZD004', siteName: '原料堆场', siteType: '堆场', location: 'C区', manager: '赵主任', phone: '13800000004', status: '维护中', createTime: '2026-02-10 11:00:00' },
  { key: '5', siteCode: 'ZD005', siteName: '办公楼', siteType: '办公区', location: 'D区', manager: '孙主管', phone: '13800000005', status: '正常', createTime: '2026-03-01 16:45:00' },
];

export default function SiteMaintenance() {
  const columns: ColumnsType<SiteItem> = [
    { title: '站点编号', dataIndex: 'siteCode', width: 120 },
    { title: '站点名称', dataIndex: 'siteName', width: 150 },
    { title: '站点类型', dataIndex: 'siteType', width: 120 },
    { title: '位置', dataIndex: 'location', width: 120 },
    { title: '负责人', dataIndex: 'manager', width: 100 },
    { title: '联系电话', dataIndex: 'phone', width: 130 },
    { title: '状态', dataIndex: 'status', width: 80 },
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
      <Card title="站点维护" extra={
        <Space>
          <Input placeholder="搜索站点名称" prefix={<SearchOutlined />} style={{ width: 200 }} />
          <Button type="primary" icon={<PlusOutlined />}>添加站点</Button>
        </Space>
      }>
        <Table columns={columns} dataSource={siteData} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
