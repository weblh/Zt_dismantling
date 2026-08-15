import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface ExemptionItem {
  key: string;
  exemptionDate: string;
  reason: string;
  scope: string;
  applicant: string;
  approver: string;
  status: string;
}

const data: ExemptionItem[] = [
  { key: '1', exemptionDate: '2026-08-01', reason: '设备停机检修', scope: '全部任务', applicant: '张工', approver: '王总', status: '已批准' },
  { key: '2', exemptionDate: '2026-08-15', reason: '法定节假日', scope: '巡检任务', applicant: '李工', approver: '王总', status: '已批准' },
  { key: '3', exemptionDate: '2026-09-10', reason: '系统升级', scope: '数据采集', applicant: '赵工', approver: '王总', status: '待审批' },
  { key: '4', exemptionDate: '2026-10-01', reason: '国庆假期', scope: '全部任务', applicant: '孙工', approver: '王总', status: '已批准' },
  { key: '5', exemptionDate: '2026-10-20', reason: '外部施工影响', scope: '现场检查', applicant: '周工', approver: '王总', status: '已驳回' },
];

const columns: ColumnsType<ExemptionItem> = [
  { title: '免考核日期', dataIndex: 'exemptionDate', key: 'exemptionDate' },
  { title: '原因', dataIndex: 'reason', key: 'reason' },
  { title: '适用范围', dataIndex: 'scope', key: 'scope' },
  { title: '申请人', dataIndex: 'applicant', key: 'applicant' },
  { title: '审批人', dataIndex: 'approver', key: 'approver' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

export default function InspectionExemption() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="免考核日期索引"
        extra={
          <Space>
            <Input placeholder="搜索日期或原因" prefix={<SearchOutlined />} allowClear />
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