import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface TaskExecutionItem {
  key: string;
  executionCode: string;
  taskName: string;
  executor: string;
  planTime: string;
  actualTime: string;
  result: string;
}

const data: TaskExecutionItem[] = [
  { key: '1', executionCode: 'EXE-20260807-001', taskName: '日常巡检任务', executor: '张工', planTime: '2026-08-07 08:00', actualTime: '2026-08-07 08:15', result: '已完成' },
  { key: '2', executionCode: 'EXE-20260807-002', taskName: '设备定期检查', executor: '李工', planTime: '2026-08-07 09:00', actualTime: '2026-08-07 09:30', result: '已完成' },
  { key: '3', executionCode: 'EXE-20260807-003', taskName: '消防设施检查', executor: '赵工', planTime: '2026-08-07 10:00', actualTime: '-', result: '进行中' },
  { key: '4', executionCode: 'EXE-20260806-004', taskName: '安全阀校验', executor: '王工', planTime: '2026-08-06 14:00', actualTime: '2026-08-06 15:20', result: '已完成' },
  { key: '5', executionCode: 'EXE-20260806-005', taskName: '日常巡检任务', executor: '孙工', planTime: '2026-08-06 08:00', actualTime: '2026-08-06 08:45', result: '已完成' },
];

const columns: ColumnsType<TaskExecutionItem> = [
  { title: '执行编号', dataIndex: 'executionCode', key: 'executionCode' },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
  { title: '执行人', dataIndex: 'executor', key: 'executor' },
  { title: '计划时间', dataIndex: 'planTime', key: 'planTime' },
  { title: '实际时间', dataIndex: 'actualTime', key: 'actualTime' },
  { title: '执行结果', dataIndex: 'result', key: 'result' },
];

export default function InspectionTaskExecution() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="任务执行"
        extra={
          <Space>
            <Input placeholder="搜索执行记录" prefix={<SearchOutlined />} allowClear />
            <Button type="primary" icon={<PlusOutlined />}>
              新增
            </Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}