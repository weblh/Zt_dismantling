import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface AuthorizationItem {
  key: string;
  authCode: string;
  authName: string;
  authType: string;
  holder: string;
  issueDate: string;
  expireDate: string;
  status: string;
}

const data: AuthorizationItem[] = [
  { key: '1', authCode: 'AUTH-001', authName: '特种设备操作证', authType: '操作许可', holder: '张工', issueDate: '2024-06-15', expireDate: '2027-06-15', status: '有效' },
  { key: '2', authCode: 'AUTH-002', authName: '电气作业证', authType: '作业许可', holder: '李工', issueDate: '2025-03-20', expireDate: '2028-03-20', status: '有效' },
  { key: '3', authCode: 'AUTH-003', authName: '动火作业审批', authType: '审批权限', holder: '王经理', issueDate: '2026-01-10', expireDate: '2027-01-10', status: '有效' },
  { key: '4', authCode: 'AUTH-004', authName: '危险化学品经营许可证', authType: '经营许可', holder: '公司', issueDate: '2023-12-01', expireDate: '2026-12-01', status: '即将到期' },
  { key: '5', authCode: 'AUTH-005', authName: '安全生产考核合格证', authType: '资质证书', holder: '赵工', issueDate: '2024-09-08', expireDate: '2027-09-08', status: '有效' },
];

const columns: ColumnsType<AuthorizationItem> = [
  { title: '授权编号', dataIndex: 'authCode', key: 'authCode' },
  { title: '授权名称', dataIndex: 'authName', key: 'authName' },
  { title: '授权类型', dataIndex: 'authType', key: 'authType' },
  { title: '持有人', dataIndex: 'holder', key: 'holder' },
  { title: '发证日期', dataIndex: 'issueDate', key: 'issueDate' },
  { title: '到期日期', dataIndex: 'expireDate', key: 'expireDate' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

export default function InspectionAuthorization() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="授权基础"
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