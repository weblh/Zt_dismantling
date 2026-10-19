import React from 'react';
import { Table, Button, Space, ConfigProvider } from 'antd';
import { EditOutlined, ExportOutlined, FullscreenOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';
import MobileStatSummary from '@/components/MobileStatSummary';

interface ProductStockItem {
  key: string;
  warehouse: string;
  productType: string;
  detail: string;
  stockTonnage: number | string;
}

interface SanyuanStockItem {
  key: string;
  warehouse: string;
  productName: string;
  remainingStock: number;
}

const productStockData: ProductStockItem[] = [
  { key: '1', warehouse: '成品库', productType: '小件', detail: '镀铬塑料', stockTonnage: 0 },
  { key: '2', warehouse: '成品库', productType: '小件', detail: '刹车盘', stockTonnage: 3.5 },
  { key: '3', warehouse: '成品库', productType: '底盘料', detail: '大巴前后桥', stockTonnage: -3.59 },
  { key: '4', warehouse: '成品库', productType: '撕碎料', detail: '方向盘', stockTonnage: 0.494 },
  { key: '5', warehouse: '成品库', productType: '橡胶', detail: '胶条', stockTonnage: 7 },
  { key: '6', warehouse: '成品库', productType: '小件', detail: '鼓风机电机', stockTonnage: 0.44 },
  { key: '7', warehouse: '成品库', productType: '小件', detail: '雨刮器', stockTonnage: 0 },
  { key: '8', warehouse: '成品库', productType: '废钢', detail: '变速箱', stockTonnage: 0 },
  { key: '9', warehouse: '成品库', productType: '废钢', detail: '后桥', stockTonnage: 0 },
  { key: '10', warehouse: '成品库', productType: '废钢', detail: '前桥', stockTonnage: 0 },
  { key: '11', warehouse: '成品库', productType: '废钢', detail: '发动机', stockTonnage: 0 },
  { key: '12', warehouse: '成品库', productType: '废钢', detail: '车壳', stockTonnage: 0 },
  { key: '13', warehouse: '成品库', productType: '有色金属', detail: '废电瓶', stockTonnage: 0 },
  { key: '14', warehouse: '成品库', productType: '有色金属', detail: '废电机', stockTonnage: 0 },
  { key: '15', warehouse: '成品库', productType: '有色金属', detail: '废水泵', stockTonnage: 0 },
  { key: '16', warehouse: '成品库', productType: '有色金属', detail: '废压缩机', stockTonnage: 0 },
  { key: '17', warehouse: '成品库', productType: '小件', detail: '废玻璃', stockTonnage: 0 },
  { key: '18', warehouse: '成品库', productType: '小件', detail: '废灯泡', stockTonnage: 0 },
  { key: '19', warehouse: '成品库', productType: '小件', detail: '废开关', stockTonnage: 0 },
  { key: '20', warehouse: '成品库', productType: '小件', detail: '废线束', stockTonnage: 0 },
];

const sanyuanStockData: SanyuanStockItem[] = [
  { key: '1', warehouse: '三元库', productName: 'X12009', remainingStock: 1 },
  { key: '2', warehouse: '三元库', productName: 'W11461', remainingStock: 1 },
  { key: '3', warehouse: '三元库', productName: 'W11638', remainingStock: 1 },
  { key: '4', warehouse: '三元库', productName: 'W11172', remainingStock: 1 },
  { key: '5', warehouse: '三元库', productName: 'W11264', remainingStock: 1 },
  { key: '6', warehouse: '三元库', productName: 'X12218', remainingStock: 1 },
  { key: '7', warehouse: '三元库', productName: 'X12031', remainingStock: 1 },
  { key: '8', warehouse: '三元库', productName: 'X12330', remainingStock: 1 },
  { key: '9', warehouse: '三元库', productName: 'X12088', remainingStock: 1 },
  { key: '10', warehouse: '三元库', productName: 'W11706', remainingStock: 1 },
  { key: '11', warehouse: '三元库', productName: 'W11366', remainingStock: 1 },
  { key: '12', warehouse: '三元库', productName: 'X12128', remainingStock: 1 },
  { key: '13', warehouse: '三元库', productName: 'W11215', remainingStock: 1 },
  { key: '14', warehouse: '三元库', productName: 'X12008', remainingStock: 1 },
  { key: '15', warehouse: '三元库', productName: 'W11505', remainingStock: 1 },
  { key: '16', warehouse: '三元库', productName: 'W11527', remainingStock: 1 },
  { key: '17', warehouse: '三元库', productName: 'X12432', remainingStock: 1 },
  { key: '18', warehouse: '三元库', productName: 'W11264', remainingStock: 1 },
  { key: '19', warehouse: '三元库', productName: 'X12115', remainingStock: 1 },
  { key: '20', warehouse: '三元库', productName: 'W11845', remainingStock: 1 },
];

export default function InventoryStatistics() {
  const isMobile = useIsMobile();
  const productStockColumns: ColumnsType<ProductStockItem> = [
    {
      title: '仓库',
      dataIndex: 'warehouse',
      width: 100,
      sorter: (a, b) => a.warehouse.localeCompare(b.warehouse),
    },
    {
      title: '产品类型',
      dataIndex: 'productType',
      width: 120,
      sorter: (a, b) => a.productType.localeCompare(b.productType),
    },
    {
      title: '明细',
      dataIndex: 'detail',
      width: 150,
      sorter: (a, b) => a.detail.localeCompare(b.detail),
    },
    {
      title: '库存吨位',
      dataIndex: 'stockTonnage',
      width: 120,
      align: 'right',
      sorter: (a, b) => Number(a.stockTonnage) - Number(b.stockTonnage),
      render: (text: number | string) => (
        <span style={{ color: typeof text === 'number' && text < 0 ? '#ff4d4f' : '#333' }}>
          {text}
        </span>
      ),
    },
  ];

  const sanyuanStockColumns: ColumnsType<SanyuanStockItem> = [
    {
      title: '仓库',
      dataIndex: 'warehouse',
      width: 100,
      sorter: (a, b) => a.warehouse.localeCompare(b.warehouse),
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      width: 150,
      sorter: (a, b) => a.productName.localeCompare(b.productName),
    },
    {
      title: '剩余库存',
      dataIndex: 'remainingStock',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.remainingStock - b.remainingStock,
    },
  ];

  const headerCellStyle: React.CSSProperties = {
    background: '#1890ff',
    color: '#fff',
    fontWeight: 500,
    textAlign: 'left',
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: '#1890ff',
            headerColor: '#fff',
            headerSortActiveBg: '#1890ff',
            headerSortHoverBg: '#1890ff',
          },
        },
      }}
    >
      <div className="page-container">
        {/* 顶部工具栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <Space wrap>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>库存统计</span>
            {!isMobile && <Button type="text" icon={<EditOutlined />}>编辑</Button>}
          </Space>
          {!isMobile && (
            <Space>
              <Button type="text" icon={<ExportOutlined />} />
              <Button type="text" icon={<FullscreenOutlined />} />
            </Space>
          )}
        </div>

        {/* 产成品库存统计表 */}
        <div style={{ padding: 16 }}>
          {isMobile && (
            <MobileStatSummary
              title="库存概览"
              hint="明细表可左右滑动查看。"
              items={[
                { label: '产成品条目', value: productStockData.length, unit: '条' },
                {
                  label: '产成品吨位',
                  value: productStockData
                    .reduce((sum, row) => sum + (Number(row.stockTonnage) || 0), 0)
                    .toFixed(2),
                  unit: '吨',
                },
                { label: '三元条目', value: sanyuanStockData.length, unit: '条' },
                {
                  label: '三元剩余',
                  value: sanyuanStockData.reduce((sum, row) => sum + row.remainingStock, 0),
                  unit: '件',
                },
              ]}
            />
          )}
          <div style={{
            background: '#fff',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              fontWeight: 600,
              fontSize: 14,
              color: '#333',
            }}>
              产成品库存统计
            </div>
            <Table
              columns={productStockColumns}
              dataSource={productStockData}
              pagination={withMobilePagination(isMobile, {
                pageSize: 20,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total) => `共 ${total} 条`,
              })}
              size={isMobile ? 'small' : 'middle'}
              rowKey="key"
              scroll={{ x: 520 }}
            />
          </div>

          {/* 三元库存统计表 */}
          <div style={{
            background: '#fff',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              fontWeight: 600,
              fontSize: 14,
              color: '#333',
            }}>
              三元库存统计
            </div>
            <Table
              columns={sanyuanStockColumns}
              dataSource={sanyuanStockData}
              pagination={withMobilePagination(isMobile, {
                pageSize: 20,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total) => `共 ${total} 条`,
              })}
              size={isMobile ? 'small' : 'middle'}
              rowKey="key"
              scroll={{ x: 400 }}
            />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
