import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface GroupItem {
  key: string;
  groupCode: string;
  groupName: string;
  groupType: string;
  leader: string;
  memberCount: number;
  department: string;
  status: string;
  createTime: string;
}

const groupData: GroupItem[] = [
  { key: '1', groupCode: 'BZ001', groupName: '第一巡检组', groupType: '巡检组', leader: '刘组长', memberCount: 5, department: '安环部', status: '正常', createTime: '2026-01-10 09:00:00' },
  { key: '2', groupCode: 'BZ002', groupName: '第二巡检组', groupType: '巡检组', leader: '陈组长', memberCount: 4, department: '安环部', status: '正常', createTime: '2026-01-15 10:30:00' },
  { key: '3', groupCode: 'BZ003', groupName: '应急救援组', groupType: '应急组', leader: '周队长', memberCount: 8, department: '安全部', status: '正常', createTime: '2026-02-01 14:20:00' },
  { key: '4', groupCode: 'BZ004', groupName: '环境监测组', groupType: '监测组', leader: '吴组长', memberCount: 3, department: '环保部', status: '正常', createTime: '2026-02-10 11:00:00' },
  { key: '5', groupCode: 'BZ005', groupName: '专项检查组', groupType: '检查组', leader: '郑组长', memberCount: 6, department: '生产部', status: '暂停', createTime: '2026-03-01 16:45:00' },
];

export default function GroupMaintenance() {
  const columns: ColumnsType<GroupItem> = [
    { title: '组编号', dataIndex: 'groupCode', width: 120 },
    { title: '组名称', dataIndex: 'groupName', width: 150 },
    { title: '组类型', dataIndex: 'groupType', width: 100 },
    { title: '组长', dataIndex: 'leader', width: 100 },
    { title: '成员数量', dataIndex: 'memberCount', width: 100, align: 'right' },
    { title: '所属部门', dataIndex: 'department', width: 120 },
    { title: '状态', dataIndex: 'status', width: 80 },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: () => (
        <Space>
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small" danger>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title="组维护" extra={
        <Space>
          <Input placeholder="搜索组名称" prefix={<SearchOutlined />} style={{ width: 200 }} />
          <Button type="primary" icon={<PlusOutlined />}>添加组</Button>
        </Space>
      }>
        <Table columns={columns} dataSource={groupData} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
