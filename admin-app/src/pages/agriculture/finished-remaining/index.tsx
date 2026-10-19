import { Card, Table, Button, Space, message } from 'antd';
import { ExportOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface RemainingItem {
  id: number;
  warehouse: string;
  productName: string;
  remainingWeight: number;
  costPrice: number;
}

const mockData: RemainingItem[] = [];

const columns: ColumnsType<RemainingItem> = [
  { title: '仓库', dataIndex: 'warehouse', width: 160 },
  { title: '品名', dataIndex: 'productName', width: 140 },
  { title: '剩余吨重', dataIndex: 'remainingWeight', width: 140, align: 'right', render: (v: number) => v > 0 ? v.toFixed(2) : '' },
  { title: '成本价', dataIndex: 'costPrice', width: 140, align: 'right', render: (v: number) => v > 0 ? <span style={{ color: '#f5222d' }}>¥{v.toFixed(2)}</span> : '' },
];

export default function FinishedRemaining() {
  const isMobile = useIsMobile();
  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', gap: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>成品剩余</span>
          <Space wrap style={{ marginLeft: 'auto' }}>
            <Button size="small" icon={<ExportOutlined />} onClick={() => message.success('导出成功')} />
          </Space>
        </div>

        {/* Stats card */}
        <div style={{ padding: 16 }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>农机成品统计</span>
                <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
              </div>
            }
            style={{ borderRadius: 8 }}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ padding: '0 16px' }}>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={mockData}
                pagination={withMobilePagination(isMobile, {
                  showSizeChanger: true,
                  showTotal: (t) => `共 ${t} 条`,
                  pageSize: 20,
                })}
                size="middle"
              />
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}
