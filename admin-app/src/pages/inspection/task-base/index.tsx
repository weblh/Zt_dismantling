import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface TaskBaseItem {
  key: string;
  taskCode: string;
  taskName: string;
  taskType: string;
  cycle: string;
  responsible: string;
  status: string;
}

const data: TaskBaseItem[] = [
  { key: '1', taskCode: 'INS-001', taskName: '日常巡检任务', taskType: '巡检', cycle: '每日', responsible: '张工', status: '启用' },
  { key: '2', taskCode: 'INS-002', taskName: '设备定期检查', taskType: '定期检查', cycle: '每周', responsible: '李工', status: '启用' },
  { key: '3', taskCode: 'INS-003', taskName: '安全阀校验', taskType: '校验', cycle: '每季度', responsible: '王工', status: '启用' },
  { key: '4', taskCode: 'INS-004', taskName: '消防设施检查', taskType: '专项检查', cycle: '每月', responsible: '赵工', status: '启用' },
  { key: '5', taskCode: 'INS-005', taskName: '应急预案演练', taskType: '演练', cycle: '每年', responsible: '孙工', status: '停用' },
];

const columns: ColumnsType<TaskBaseItem> = [
  { title: '任务编号', dataIndex: 'taskCode', key: 'taskCode' },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
  { title: '任务类型', dataIndex: 'taskType', key: 'taskType' },
  { title: '执行周期', dataIndex: 'cycle', key: 'cycle' },
  { title: '负责人', dataIndex: 'responsible', key: 'responsible' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

export default function InspectionTaskBase() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="任务基础"
        extra={
          <Space>
            <Input placeholder="搜索任务" prefix={<SearchOutlined />} allowClear />
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