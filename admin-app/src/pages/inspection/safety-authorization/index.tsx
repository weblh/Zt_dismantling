import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface SafetyAuthItem {
  key: string;
  authCode: string;
  authName: string;
  department: string;
  level: string;
  authorizedBy: string;
  effectiveDate: string;
  status: string;
}

const data: SafetyAuthItem[] = [
  { key: '1', authCode: 'SAFETY-001', authName: '动火作业审批授权', department: '安全部', level: '一级', authorizedBy: '总经理', effectiveDate: '2026-01-01', status: '有效' },
  { key: '2', authCode: 'SAFETY-002', authName: '受限空间作业授权', department: '生产部', level: '二级', authorizedBy: '安全总监', effectiveDate: '2026-02-15', status: '有效' },
  { key: '3', authCode: 'SAFETY-003', authName: '高处作业审批授权', department: '工程部', level: '二级', authorizedBy: '安全总监', effectiveDate: '2026-03-10', status: '有效' },
  { key: '4', authCode: 'SAFETY-004', authName: '临时用电审批授权', department: '设备部', level: '三级', authorizedBy: '部门经理', effectiveDate: '2026-04-05', status: '有效' },
  { key: '5', authCode: 'SAFETY-005', authName: '危险作业整体授权', department: '安全部', level: '一级', authorizedBy: '总经理', effectiveDate: '2025-12-20', status: '即将到期' },
];

const columns: ColumnsType<SafetyAuthItem> = [
  { title: '授权编号', dataIndex: 'authCode', key: 'authCode' },
  { title: '授权名称', dataIndex: 'authName', key: 'authName' },
  { title: '所属部门', dataIndex: 'department', key: 'department' },
  { title: '授权级别', dataIndex: 'level', key: 'level' },
  { title: '授权人', dataIndex: 'authorizedBy', key: 'authorizedBy' },
  { title: '生效日期', dataIndex: 'effectiveDate', key: 'effectiveDate' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

export default function InspectionSafetyAuthorization() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="安环授权"
        extra={
          <Space>
            <Input placeholder="搜索授权信息" prefix={<SearchOutlined />} allowClear />
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