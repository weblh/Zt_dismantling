import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface QualityInterceptItem {
  key: string;
  interceptNo: string;
  product: string;
  batch: string;
  interceptReason: string;
  interceptType: string;
  handler: string;
  status: string;
  interceptTime: string;
}

const data: QualityInterceptItem[] = [
  { key: '1', interceptNo: 'QI-202608001', product: '发动机总成-A', batch: 'B20260801', interceptReason: '尺寸超差', interceptType: '进货拦截', handler: '孙文奇', status: '已放行', interceptTime: '2026-08-01 10:00' },
  { key: '2', interceptNo: 'QI-202608002', product: '变速箱总成-B', batch: 'B20260802', interceptReason: '外观划伤', interceptType: '过程拦截', handler: '段石峰', status: '处理中', interceptTime: '2026-08-02 11:30' },
  { key: '3', interceptNo: 'QI-202608003', product: '底盘组件-C', batch: 'B20260803', interceptReason: '功能失效', interceptType: '出货拦截', handler: '周月胜', status: '已报废', interceptTime: '2026-08-03 14:50' },
  { key: '4', interceptNo: 'QI-202608004', product: '车身覆盖件-D', batch: 'B20260804', interceptReason: '材质不符', interceptType: '进货拦截', handler: '边飞旋', status: '已放行', interceptTime: '2026-08-04 09:15' },
  { key: '5', interceptNo: 'QI-202608005', product: '电器组件-E', batch: 'B20260805', interceptReason: '装配错误', interceptType: '过程拦截', handler: '许敬红', status: '处理中', interceptTime: '2026-08-05 16:40' },
];

const columns: ColumnsType<QualityInterceptItem> = [
  { title: '拦截编号', dataIndex: 'interceptNo', key: 'interceptNo' },
  { title: '产品名称', dataIndex: 'product', key: 'product' },
  { title: '批次号', dataIndex: 'batch', key: 'batch' },
  { title: '拦截原因', dataIndex: 'interceptReason', key: 'interceptReason' },
  { title: '拦截类型', dataIndex: 'interceptType', key: 'interceptType' },
  { title: '处理人', dataIndex: 'handler', key: 'handler' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '拦截时间', dataIndex: 'interceptTime', key: 'interceptTime' },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space>
        <a>查看</a>
        <a>处理</a>
        <a>关闭</a>
      </Space>
    ),
  },
];

export default function QualityInterceptPage() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="品质拦截V2"
        extra={
          <Space>
            <Input placeholder="请输入拦截编号或产品名称" prefix={<SearchOutlined />} style={{ width: 240 }} />
            <Button type="primary" icon={<PlusOutlined />}>新增拦截</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}