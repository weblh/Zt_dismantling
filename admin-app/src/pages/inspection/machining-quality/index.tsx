import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface MachiningQualityItem {
  key: string;
  recordNo: string;
  workshop: string;
  process: string;
  product: string;
  operator: string;
  quantity: number;
  defectRate: string;
  recordTime: string;
}

const data: MachiningQualityItem[] = [
  { key: '1', recordNo: 'MQ-202608001', workshop: '机加工一车间', process: '车削', product: '主轴A型', operator: '武汉马', quantity: 500, defectRate: '0.8%', recordTime: '2026-08-01 08:30' },
  { key: '2', recordNo: 'MQ-202608002', workshop: '机加工一车间', process: '铣削', product: '壳体B型', operator: '张复磊', quantity: 300, defectRate: '1.2%', recordTime: '2026-08-02 09:15' },
  { key: '3', recordNo: 'MQ-202608003', workshop: '机加工二车间', process: '钻孔', product: '支架C型', operator: '樊志强', quantity: 800, defectRate: '0.5%', recordTime: '2026-08-03 10:45' },
  { key: '4', recordNo: 'MQ-202608004', workshop: '机加工二车间', process: '磨削', product: '轴承座D型', operator: '董红斌', quantity: 200, defectRate: '2.1%', recordTime: '2026-08-04 13:20' },
  { key: '5', recordNo: 'MQ-202608005', workshop: '机加工三车间', process: '热处理', product: '齿轮E型', operator: '李帅', quantity: 150, defectRate: '1.5%', recordTime: '2026-08-05 15:30' },
];

const columns: ColumnsType<MachiningQualityItem> = [
  { title: '记录编号', dataIndex: 'recordNo', key: 'recordNo' },
  { title: '车间', dataIndex: 'workshop', key: 'workshop' },
  { title: '加工工序', dataIndex: 'process', key: 'process' },
  { title: '产品名称', dataIndex: 'product', key: 'product' },
  { title: '操作员', dataIndex: 'operator', key: 'operator' },
  { title: '加工数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '不良率', dataIndex: 'defectRate', key: 'defectRate' },
  { title: '记录时间', dataIndex: 'recordTime', key: 'recordTime' },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space>
        <a>查看详情</a>
        <a>编辑</a>
        <a>删除</a>
      </Space>
    ),
  },
];

export default function MachiningQualityPage() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="机加工品质"
        extra={
          <Space>
            <Input placeholder="请输入记录编号或产品名称" prefix={<SearchOutlined />} style={{ width: 240 }} />
            <Button type="primary" icon={<PlusOutlined />}>新增记录</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}