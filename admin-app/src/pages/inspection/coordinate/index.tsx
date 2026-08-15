import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface CoordinateItem {
  key: string;
  name: string;
  code: string;
  type: string;
  remark: string;
  createTime: string;
}

const data: CoordinateItem[] = [
  { key: '1', name: 'A区-001', code: 'COO-A001', type: '点检坐标', remark: '生产线A首检位', createTime: '2026-08-01 09:12' },
  { key: '2', name: 'A区-002', code: 'COO-A002', type: '巡检坐标', remark: '生产线A末检位', createTime: '2026-08-02 10:05' },
  { key: '3', name: 'B区-001', code: 'COO-B001', type: '点检坐标', remark: '生产线B首检位', createTime: '2026-08-03 14:30' },
  { key: '4', name: 'B区-002', code: 'COO-B002', type: '抽检坐标', remark: '生产线B抽检位', createTime: '2026-08-04 08:45' },
  { key: '5', name: 'C区-001', code: 'COO-C001', type: '巡检坐标', remark: '生产线C全检位', createTime: '2026-08-05 16:20' },
];

const columns: ColumnsType<CoordinateItem> = [
  { title: '坐标名称', dataIndex: 'name', key: 'name' },
  { title: '坐标编码', dataIndex: 'code', key: 'code' },
  { title: '坐标类型', dataIndex: 'type', key: 'type' },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space>
        <a>编辑</a>
        <a>删除</a>
      </Space>
    ),
  },
];

export default function CoordinatePage() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="坐标管理"
        extra={
          <Space>
            <Input placeholder="请输入坐标名称或编码" prefix={<SearchOutlined />} style={{ width: 240 }} />
            <Button type="primary" icon={<PlusOutlined />}>新增坐标</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}