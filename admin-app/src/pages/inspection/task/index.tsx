import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface TaskItem {
  key: string;
  taskNo: string;
  taskName: string;
  type: string;
  owner: string;
  status: string;
  deadline: string;
}

const data: TaskItem[] = [
  { key: '1', taskNo: 'TASK-202608001', taskName: 'A区首检任务', type: '点检', owner: '孙文奇', status: '进行中', deadline: '2026-08-10' },
  { key: '2', taskNo: 'TASK-202608002', taskName: 'B区巡检任务', type: '巡检', owner: '段石峰', status: '已完成', deadline: '2026-08-05' },
  { key: '3', taskNo: 'TASK-202608003', taskName: 'C区抽检任务', type: '抽检', owner: '周月胜', status: '待执行', deadline: '2026-08-12' },
  { key: '4', taskNo: 'TASK-202608004', taskName: 'D区全检任务', type: '全检', owner: '边飞旋', status: '已完成', deadline: '2026-08-06' },
  { key: '5', taskNo: 'TASK-202608005', taskName: 'E区复检任务', type: '复检', owner: '许敬红', status: '进行中', deadline: '2026-08-15' },
];

const columns: ColumnsType<TaskItem> = [
  { title: '任务编号', dataIndex: 'taskNo', key: 'taskNo' },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
  { title: '任务类型', dataIndex: 'type', key: 'type' },
  { title: '负责人', dataIndex: 'owner', key: 'owner' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '截止日期', dataIndex: 'deadline', key: 'deadline' },
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

export default function TaskPage() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="任务管理"
        extra={
          <Space>
            <Input placeholder="请输入任务编号或名称" prefix={<SearchOutlined />} style={{ width: 240 }} />
            <Button type="primary" icon={<PlusOutlined />}>新增任务</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}