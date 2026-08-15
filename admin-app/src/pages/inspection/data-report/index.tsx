import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface DataReportItem {
  key: string;
  reportNo: string;
  reportName: string;
  type: string;
  period: string;
  creator: string;
  createTime: string;
}

const data: DataReportItem[] = [
  { key: '1', reportNo: 'RPT-202608001', reportName: '8月第一周巡检数据报表', type: '周报', period: '2026-W32', creator: '孙文奇', createTime: '2026-08-08 17:00' },
  { key: '2', reportNo: 'RPT-202608002', reportName: '7月全月巡检数据报表', type: '月报', period: '2026-07', creator: '段石峰', createTime: '2026-08-01 10:30' },
  { key: '3', reportNo: 'RPT-202608003', reportName: '异常统计分析报表', type: '专项', period: '2026-08', creator: '周月胜', createTime: '2026-08-05 15:20' },
  { key: '4', reportNo: 'RPT-202608004', reportName: '各产品线质量对比报表', type: '对比', period: '2026-08', creator: '边飞旋', createTime: '2026-08-06 14:10' },
  { key: '5', reportNo: 'RPT-202608005', reportName: 'LEC评估汇总报表', type: '汇总', period: '2026-07', creator: '许敬红', createTime: '2026-08-03 11:45' },
];

const columns: ColumnsType<DataReportItem> = [
  { title: '报表编号', dataIndex: 'reportNo', key: 'reportNo' },
  { title: '报表名称', dataIndex: 'reportName', key: 'reportName' },
  { title: '报表类型', dataIndex: 'type', key: 'type' },
  { title: '统计周期', dataIndex: 'period', key: 'period' },
  { title: '创建人', dataIndex: 'creator', key: 'creator' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space>
        <a>查看</a>
        <a>导出</a>
        <a>删除</a>
      </Space>
    ),
  },
];

export default function DataReportPage() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="巡检数据中台"
        extra={
          <Space>
            <Input placeholder="请输入报表编号或名称" prefix={<SearchOutlined />} style={{ width: 240 }} />
            <Button type="primary" icon={<PlusOutlined />}>新建报表</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}