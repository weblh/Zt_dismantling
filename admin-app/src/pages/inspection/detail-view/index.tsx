import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface DetailItem {
  key: string;
  detailNo: string;
  taskNo: string;
  itemName: string;
  standard: string;
  actual: string;
  result: string;
  inspector: string;
  inspectTime: string;
}

const data: DetailItem[] = [
  { key: '1', detailNo: 'DTL-0001', taskNo: 'TASK-202608001', itemName: '外径尺寸', standard: '50.00±0.05mm', actual: '50.03mm', result: '合格', inspector: '孙文奇', inspectTime: '2026-08-01 09:15' },
  { key: '2', detailNo: 'DTL-0002', taskNo: 'TASK-202608001', itemName: '表面粗糙度', standard: 'Ra≤1.6μm', actual: 'Ra1.2μm', result: '合格', inspector: '孙文奇', inspectTime: '2026-08-01 09:20' },
  { key: '3', detailNo: 'DTL-0003', taskNo: 'TASK-202608002', itemName: '轴向跳动', standard: '≤0.02mm', actual: '0.025mm', result: '不合格', inspector: '段石峰', inspectTime: '2026-08-02 10:30' },
  { key: '4', detailNo: 'DTL-0004', taskNo: 'TASK-202608003', itemName: '硬度测试', standard: 'HRC55-60', actual: 'HRC58', result: '合格', inspector: '周月胜', inspectTime: '2026-08-03 14:45' },
  { key: '5', detailNo: 'DTL-0005', taskNo: 'TASK-202608004', itemName: '平面度', standard: '≤0.01mm', actual: '0.008mm', result: '合格', inspector: '边飞旋', inspectTime: '2026-08-04 11:00' },
];

const columns: ColumnsType<DetailItem> = [
  { title: '明细编号', dataIndex: 'detailNo', key: 'detailNo' },
  { title: '关联任务', dataIndex: 'taskNo', key: 'taskNo' },
  { title: '检验项目', dataIndex: 'itemName', key: 'itemName' },
  { title: '标准值', dataIndex: 'standard', key: 'standard' },
  { title: '实测值', dataIndex: 'actual', key: 'actual' },
  { title: '判定结果', dataIndex: 'result', key: 'result' },
  { title: '检验员', dataIndex: 'inspector', key: 'inspector' },
  { title: '检验时间', dataIndex: 'inspectTime', key: 'inspectTime' },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space>
        <a>查看</a>
        <a>编辑</a>
        <a>删除</a>
      </Space>
    ),
  },
];

export default function DetailViewPage() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="明细查看"
        extra={
          <Space>
            <Input placeholder="请输入明细编号或任务编号" prefix={<SearchOutlined />} style={{ width: 240 }} />
            <Button type="primary" icon={<PlusOutlined />}>新增明细</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}