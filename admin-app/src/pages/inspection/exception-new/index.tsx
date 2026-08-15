import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface ExceptionItem {
  key: string;
  exceptionNo: string;
  title: string;
  level: string;
  type: string;
  handler: string;
  status: string;
  occurTime: string;
}

const data: ExceptionItem[] = [
  { key: '1', exceptionNo: 'EX-202608001', title: 'A区首检异常-尺寸超差', level: '严重', type: '尺寸异常', handler: '樊志强', status: '待处理', occurTime: '2026-08-01 09:30' },
  { key: '2', exceptionNo: 'EX-202608002', title: 'B区巡检异常-外观划伤', level: '一般', type: '外观异常', handler: '张智慧', status: '处理中', occurTime: '2026-08-02 11:15' },
  { key: '3', exceptionNo: 'EX-202608003', title: 'C区抽检异常-功能失效', level: '严重', type: '功能异常', handler: '董红斌', status: '已关闭', occurTime: '2026-08-03 14:50' },
  { key: '4', exceptionNo: 'EX-202608004', title: 'D区全检异常-装配错误', level: '一般', type: '装配异常', handler: '李帅', status: '已处理', occurTime: '2026-08-04 10:20' },
  { key: '5', exceptionNo: 'EX-202608005', title: 'E区复检异常-材质不符', level: '严重', type: '材质异常', handler: '张瑞安', status: '处理中', occurTime: '2026-08-05 15:40' },
];

const columns: ColumnsType<ExceptionItem> = [
  { title: '异常编号', dataIndex: 'exceptionNo', key: 'exceptionNo' },
  { title: '异常标题', dataIndex: 'title', key: 'title' },
  { title: '异常等级', dataIndex: 'level', key: 'level' },
  { title: '异常类型', dataIndex: 'type', key: 'type' },
  { title: '处理人', dataIndex: 'handler', key: 'handler' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '发生时间', dataIndex: 'occurTime', key: 'occurTime' },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space>
        <a>查看</a>
        <a>处理</a>
        <a>关闭</a>
      </Space>
    ),
  },
];

export default function ExceptionNewPage() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="异常处理（新）"
        extra={
          <Space>
            <Input placeholder="请输入异常编号或标题" prefix={<SearchOutlined />} style={{ width: 240 }} />
            <Button type="primary" icon={<PlusOutlined />}>新增异常</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}