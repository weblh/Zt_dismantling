import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface BusinessItem {
  key: string;
  businessNo: string;
  productName: string;
  spec: string;
  batch: string;
  quantity: number;
  inspector: string;
  inspectDate: string;
}

const data: BusinessItem[] = [
  { key: '1', businessNo: 'BIZ-202608001', productName: '发动机总成-A', spec: '规格A-标准', batch: 'B20260801', quantity: 120, inspector: '孙文奇', inspectDate: '2026-08-01' },
  { key: '2', businessNo: 'BIZ-202608002', productName: '变速箱总成-B', spec: '规格B-加长', batch: 'B20260802', quantity: 85, inspector: '段石峰', inspectDate: '2026-08-02' },
  { key: '3', businessNo: 'BIZ-202608003', productName: '底盘组件-C', spec: '规格C-轻型', batch: 'B20260803', quantity: 200, inspector: '周月胜', inspectDate: '2026-08-03' },
  { key: '4', businessNo: 'BIZ-202608004', productName: '车身覆盖件-D', spec: '规格D-标准', batch: 'B20260804', quantity: 150, inspector: '边飞旋', inspectDate: '2026-08-04' },
  { key: '5', businessNo: 'BIZ-202608005', productName: '电器组件-E', spec: '规格E-增强', batch: 'B20260805', quantity: 300, inspector: '许敬红', inspectDate: '2026-08-05' },
];

const columns: ColumnsType<BusinessItem> = [
  { title: '业务编号', dataIndex: 'businessNo', key: 'businessNo' },
  { title: '产品名称', dataIndex: 'productName', key: 'productName' },
  { title: '规格', dataIndex: 'spec', key: 'spec' },
  { title: '批次号', dataIndex: 'batch', key: 'batch' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '检验员', dataIndex: 'inspector', key: 'inspector' },
  { title: '检验日期', dataIndex: 'inspectDate', key: 'inspectDate' },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space>
        <a>查看</a>
        <a>编辑</a>
        <a>删除</a>
      </Space>
    ),
  },
];

export default function BusinessNewPage() {
  return (
    <div style={{ padding: 16 }}>
      <Card
        title="业务管理（新）"
        extra={
          <Space>
            <Input placeholder="请输入业务编号或产品名称" prefix={<SearchOutlined />} style={{ width: 240 }} />
            <Button type="primary" icon={<PlusOutlined />}>新增业务</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}