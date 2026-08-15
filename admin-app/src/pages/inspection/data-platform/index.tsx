import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface DataPlatformItem {
  key: string;
  name: string;
  type: string;
  source: string;
  updateTime: string;
  status: string;
}

const data: DataPlatformItem[] = [
  { key: '1', name: '生产数据采集', type: '实时数据', source: 'DCS系统', updateTime: '2026-08-07 09:30', status: '正常' },
  { key: '2', name: '设备运行状态', type: '状态数据', source: 'OPC Server', updateTime: '2026-08-07 09:28', status: '正常' },
  { key: '3', name: '质量检验数据', type: '离线数据', source: 'LIMS系统', updateTime: '2026-08-07 08:50', status: '正常' },
  { key: '4', name: '能耗统计数据', type: '汇总数据', source: '能源管理', updateTime: '2026-08-07 08:00', status: '延迟' },
  { key: '5', name: '安全监测数据', type: '实时数据', source: 'SIS系统', updateTime: '2026-08-07 09:32', status: '正常' },
];

const columns: ColumnsType<DataPlatformItem> = [
  { title: '数据名称', dataIndex: 'name', key: 'name' },
  { title: '数据类型', dataIndex: 'type', key: 'type' },
  { title: '数据来源', dataIndex: 'source', key: 'source' },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

export default function InspectionDataPlatform() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="数据中台"
        extra={
          <Space>
            <Input placeholder="搜索数据" prefix={<SearchOutlined />} allowClear />
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