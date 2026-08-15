import { Tabs, Input, Button, Select, Space } from 'antd';
import { SearchOutlined, FilterOutlined, SortDescendingOutlined, ExportOutlined } from '@ant-design/icons';

const tabs = [
  { key: 'all', label: '全部', count: 0 },
  { key: 'overdue', label: '已超时', count: 0 },
  { key: 'urge', label: '催办', count: 0 },
  { key: 'return', label: '回退', count: 0 },
  { key: 'temp', label: '暂存', count: 0 },
];

export default function InspectionTodo() {
  return (
    <div style={{ padding: 0, background: '#fff', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Tabs
          defaultActiveKey="all"
          items={tabs.map(t => ({
            key: t.key,
            label: (
              <span style={{ fontSize: 14 }}>
                {t.label}
                <span style={{ marginLeft: 4, color: t.key === 'all' ? '#1677ff' : '#999' }}>({t.count})</span>
              </span>
            ),
          }))}
          style={{ flex: 1 }}
        />
        <Space>
          <Input placeholder="搜索流程信息" prefix={<SearchOutlined />} style={{ width: 220 }} allowClear />
          <Button icon={<FilterOutlined />}>筛选</Button>
          <Button icon={<SortDescendingOutlined />}>排序</Button>
          <Button icon={<ExportOutlined />} type="primary" ghost>批量提交</Button>
        </Space>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#999' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔔</div>
        <div style={{ fontSize: 16 }}>暂无待办任务</div>
      </div>
    </div>
  );
}