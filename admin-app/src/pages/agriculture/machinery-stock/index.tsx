import { Card, Table, Button, Space, message } from 'antd';
import { ExportOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface StockItem {
  id: number;
  warehouse: string;
  remainingQty: number;
  remainingWeight: number;
  remainingAmount: number;
}

const mockData: StockItem[] = [];

const columns: ColumnsType<StockItem> = [
  { title: '仓库', dataIndex: 'warehouse', width: 160 },
  { title: '剩余数量', dataIndex: 'remainingQty', width: 140, align: 'right' },
  { title: '剩余吨位', dataIndex: 'remainingWeight', width: 140, align: 'right', render: (v: number) => v > 0 ? v.toFixed(2) : '' },
  { title: '剩余金额', dataIndex: 'remainingAmount', width: 160, align: 'right', render: (v: number) => v > 0 ? <span style={{ color: '#f5222d' }}>¥{v.toLocaleString()}</span> : '' },
];

export default function MachineryStock() {
  const isMobile = useIsMobile();
  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', gap: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>原材料-农机剩余库存</span>
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
            extra={null}
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
