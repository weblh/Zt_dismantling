import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface SafetyBusinessItem {
  key: string;
  businessCode: string;
  businessName: string;
  category: string;
  location: string;
  manager: string;
  lastInspection: string;
  status: string;
}

const data: SafetyBusinessItem[] = [
  { key: '1', businessCode: 'BIZ-001', businessName: '化工原料存储业务', category: '存储', location: 'A区仓库', manager: '刘主管', lastInspection: '2026-07-20', status: '正常' },
  { key: '2', businessCode: 'BIZ-002', businessName: '危险化学品运输', category: '运输', location: '厂区道路', manager: '陈主管', lastInspection: '2026-07-25', status: '正常' },
  { key: '3', businessCode: 'BIZ-003', businessName: '特种设备运行', category: '运行', location: '生产车间', manager: '周主管', lastInspection: '2026-08-01', status: '正常' },
  { key: '4', businessCode: 'BIZ-004', businessName: '消防设施维护', category: '维护', location: '全厂区', manager: '吴主管', lastInspection: '2026-07-15', status: '待整改' },
  { key: '5', businessCode: 'BIZ-005', businessName: '电气设备检修', category: '检修', location: '动力中心', manager: '郑主管', lastInspection: '2026-08-05', status: '正常' },
];

const columns: ColumnsType<SafetyBusinessItem> = [
  { title: '业务编号', dataIndex: 'businessCode', key: 'businessCode' },
  { title: '业务名称', dataIndex: 'businessName', key: 'businessName' },
  { title: '业务类别', dataIndex: 'category', key: 'category' },
  { title: '所在位置', dataIndex: 'location', key: 'location' },
  { title: '负责人', dataIndex: 'manager', key: 'manager' },
  { title: '最近检查', dataIndex: 'lastInspection', key: 'lastInspection' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

export default function InspectionSafetyBusiness() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="业务(安环)"
        extra={
          <Space>
            <Input placeholder="搜索业务信息" prefix={<SearchOutlined />} allowClear />
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