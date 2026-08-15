import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface LecItem {
  key: string;
  lecNo: string;
  product: string;
  project: string;
  evaluateDate: string;
  evaluator: string;
  score: number;
  result: string;
}

const data: LecItem[] = [
  { key: '1', lecNo: 'LEC-202608001', product: '发动机总成-A', project: '外观检测', evaluateDate: '2026-08-01', evaluator: '樊志强', score: 95, result: '合格' },
  { key: '2', lecNo: 'LEC-202608002', product: '变速箱总成-B', project: '尺寸测量', evaluateDate: '2026-08-02', evaluator: '张智慧', score: 88, result: '合格' },
  { key: '3', lecNo: 'LEC-202608003', product: '底盘组件-C', project: '功能测试', evaluateDate: '2026-08-03', evaluator: '董红斌', score: 72, result: '待改进' },
  { key: '4', lecNo: 'LEC-202608004', product: '车身覆盖件-D', project: '材质检测', evaluateDate: '2026-08-04', evaluator: '李帅', score: 90, result: '合格' },
  { key: '5', lecNo: 'LEC-202608005', product: '电器组件-E', project: '可靠性测试', evaluateDate: '2026-08-05', evaluator: '张瑞安', score: 65, result: '不合格' },
];

const columns: ColumnsType<LecItem> = [
  { title: 'LEC编号', dataIndex: 'lecNo', key: 'lecNo' },
  { title: '产品名称', dataIndex: 'product', key: 'product' },
  { title: '评估项目', dataIndex: 'project', key: 'project' },
  { title: '评估日期', dataIndex: 'evaluateDate', key: 'evaluateDate' },
  { title: '评估人', dataIndex: 'evaluator', key: 'evaluator' },
  { title: '评分', dataIndex: 'score', key: 'score' },
  { title: '评估结果', dataIndex: 'result', key: 'result' },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space>
        <a>查看报告</a>
        <a>编辑</a>
      </Space>
    ),
  },
];

export default function LecPage() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="LEC评估"
        extra={
          <Space>
            <Input placeholder="请输入LEC编号或产品名称" prefix={<SearchOutlined />} style={{ width: 240 }} />
            <Button type="primary" icon={<PlusOutlined />}>新增评估</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}