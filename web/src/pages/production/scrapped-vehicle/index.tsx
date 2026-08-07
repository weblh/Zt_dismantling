import { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Dropdown,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  FilterOutlined,
  ColumnWidthOutlined,
  FullscreenOutlined,
  MoreOutlined,
  CheckOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface ScrappedVehicleItem {
  id: number;
  entryCode: string;
  negotiation: string;
  weighDate: string;
  netWeight: number;
  supplier: string;
  vehicleType: string;
  vehicleModel: string;
  weighmaster: string;
  flatten: string;
  operation: string;
  bLevel: string;
  iron: number;
  aluminum: number;
  ternary: number;
  battery: number;
  remark: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: ScrappedVehicleItem[] = [
  { id: 1, entryCode: '6G0439', negotiation: '议价', weighDate: '2026-07-30', netWeight: 1.17, supplier: '刘刚', vehicleType: '3厢50', vehicleModel: '现代', weighmaster: '张三', flatten: '否', operation: '否', bLevel: '否', iron: 0.8, aluminum: 0.2, ternary: 0.1, battery: 0.05, remark: '', submitter: '齐志江', submitTime: '2026-07-30 09:29:32', updateTime: '2026-07-30 09:29:32' },
  { id: 2, entryCode: '6G0438', negotiation: '议价', weighDate: '2026-07-29', netWeight: 1.12, supplier: '陶华萍', vehicleType: '3厢50', vehicleModel: '长城', weighmaster: '李四', flatten: '否', operation: '否', bLevel: '否', iron: 0.75, aluminum: 0.18, ternary: 0.12, battery: 0.03, remark: '', submitter: '齐志江', submitTime: '2026-07-29 16:02:50', updateTime: '2026-07-29 16:02:50' },
  { id: 3, entryCode: '6G0437', negotiation: '议价', weighDate: '2026-07-29', netWeight: 1.66, supplier: '陶华萍', vehicleType: '三厢BBA85', vehicleModel: '奥迪', weighmaster: '王五', flatten: '否', operation: '否', bLevel: '是', iron: 1.2, aluminum: 0.3, ternary: 0.15, battery: 0.08, remark: '', submitter: '齐志江', submitTime: '2026-07-29 15:59:23', updateTime: '2026-07-29 15:59:23' },
  { id: 4, entryCode: '6G0435', negotiation: '议价', weighDate: '2026-07-29', netWeight: 1.01, supplier: '韩雪刚', vehicleType: '面包30', vehicleModel: '五菱', weighmaster: '赵六', flatten: '否', operation: '否', bLevel: '否', iron: 0.6, aluminum: 0.15, ternary: 0.05, battery: 0.02, remark: '', submitter: '齐志江', submitTime: '2026-07-29 09:57:55', updateTime: '2026-07-29 09:57:55' },
  { id: 5, entryCode: '6G0436', negotiation: '议价', weighDate: '2026-07-29', netWeight: 1.04, supplier: '刘亚强', vehicleType: '3厢50', vehicleModel: '大众', weighmaster: '孙七', flatten: '否', operation: '否', bLevel: '否', iron: 0.7, aluminum: 0.2, ternary: 0.08, battery: 0.04, remark: '', submitter: '齐志江', submitTime: '2026-07-29 09:57:31', updateTime: '2026-07-29 09:57:31' },
  { id: 6, entryCode: '6G0434', negotiation: '议价', weighDate: '2026-07-26', netWeight: 0.96, supplier: '张茜', vehicleType: '2厢40', vehicleModel: '吉利', weighmaster: '周八', flatten: '否', operation: '否', bLevel: '否', iron: 0.65, aluminum: 0.12, ternary: 0.06, battery: 0.02, remark: '', submitter: '齐志江', submitTime: '2026-07-26 18:02:49', updateTime: '2026-07-26 18:02:49' },
  { id: 7, entryCode: '6G0433', negotiation: '议价', weighDate: '2026-07-26', netWeight: 1.14, supplier: '闫晓红', vehicleType: '3厢50', vehicleModel: '长城', weighmaster: '吴九', flatten: '否', operation: '否', bLevel: '否', iron: 0.8, aluminum: 0.22, ternary: 0.09, battery: 0.05, remark: '', submitter: '齐志江', submitTime: '2026-07-26 17:57:20', updateTime: '2026-07-26 17:57:20' },
  { id: 8, entryCode: '6G0432', negotiation: '议价', weighDate: '2026-07-25', netWeight: 1.26, supplier: '段白雪', vehicleType: '3厢50', vehicleModel: '大众', weighmaster: '郑十', flatten: '否', operation: '否', bLevel: '否', iron: 0.85, aluminum: 0.25, ternary: 0.1, battery: 0.06, remark: '', submitter: '齐志江', submitTime: '2026-07-25 15:19:26', updateTime: '2026-07-25 15:19:26' },
  { id: 9, entryCode: '6G0431', negotiation: '议价', weighDate: '2026-07-22', netWeight: 1.05, supplier: '李小红', vehicleType: '2厢40', vehicleModel: '众泰', weighmaster: '钱十一', flatten: '否', operation: '否', bLevel: '否', iron: 0.7, aluminum: 0.18, ternary: 0.07, battery: 0.03, remark: '', submitter: '齐志江', submitTime: '2026-07-22 14:13:15', updateTime: '2026-07-22 14:13:15' },
  { id: 10, entryCode: '6G0430', negotiation: '议价', weighDate: '2026-07-22', netWeight: 1.31, supplier: '王同山', vehicleType: '3厢50', vehicleModel: '福特', weighmaster: '冯十二', flatten: '否', operation: '否', bLevel: '否', iron: 0.9, aluminum: 0.28, ternary: 0.12, battery: 0.05, remark: '', submitter: '齐志江', submitTime: '2026-07-22 14:11:48', updateTime: '2026-07-22 14:11:48' },
  { id: 11, entryCode: '6G0429', negotiation: '议价', weighDate: '2026-07-22', netWeight: 1.08, supplier: '刘刚', vehicleType: '3厢50', vehicleModel: '现代', weighmaster: '张三', flatten: '否', operation: '否', bLevel: '否', iron: 0.72, aluminum: 0.2, ternary: 0.08, battery: 0.04, remark: '', submitter: '齐志江', submitTime: '2026-07-22 14:10:45', updateTime: '2026-07-22 14:10:45' },
  { id: 12, entryCode: '6G0428', negotiation: '议价', weighDate: '2026-07-21', netWeight: 1.19, supplier: '陶华萍', vehicleType: '三厢BBA85', vehicleModel: '宝马', weighmaster: '李四', flatten: '否', operation: '否', bLevel: '是', iron: 0.88, aluminum: 0.24, ternary: 0.14, battery: 0.07, remark: '', submitter: '齐志江', submitTime: '2026-07-21 10:30:22', updateTime: '2026-07-21 10:30:22' },
  { id: 13, entryCode: '6G0427', negotiation: '议价', weighDate: '2026-07-20', netWeight: 0.98, supplier: '韩雪刚', vehicleType: '面包30', vehicleModel: '五菱', weighmaster: '王五', flatten: '否', operation: '否', bLevel: '否', iron: 0.62, aluminum: 0.16, ternary: 0.04, battery: 0.02, remark: '', submitter: '齐志江', submitTime: '2026-07-20 16:45:11', updateTime: '2026-07-20 16:45:11' },
  { id: 14, entryCode: '6G0426', negotiation: '议价', weighDate: '2026-07-19', netWeight: 1.42, supplier: '刘亚强', vehicleType: '商务55', vehicleModel: '别克', weighmaster: '赵六', flatten: '否', operation: '否', bLevel: '否', iron: 0.95, aluminum: 0.3, ternary: 0.15, battery: 0.08, remark: '', submitter: '齐志江', submitTime: '2026-07-19 11:20:33', updateTime: '2026-07-19 11:20:33' },
  { id: 15, entryCode: '6G0425', negotiation: '议价', weighDate: '2026-07-18', netWeight: 1.22, supplier: '张茜', vehicleType: '3厢50', vehicleModel: '丰田', weighmaster: '孙七', flatten: '否', operation: '否', bLevel: '否', iron: 0.82, aluminum: 0.24, ternary: 0.1, battery: 0.05, remark: '', submitter: '齐志江', submitTime: '2026-07-18 09:15:44', updateTime: '2026-07-18 09:15:44' },
];

const columns: ColumnsType<ScrappedVehicleItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>, dataIndex: 'entryCode', width: 100, fixed: 'left' },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>销户/议价</span>,
    dataIndex: 'negotiation',
    width: 100,
    fixed: 'left',
    render: (val: string) => (
      <span style={{ color: val === '议价' ? '#52c41a' : '#fa8c16', fontWeight: 500 }}>
        <CheckOutlined />
      </span>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'weighDate', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>净重</span>,
    dataIndex: 'netWeight',
    width: 90,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>供应商</span>, dataIndex: 'supplier', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>司磅员</span>, dataIndex: 'weighmaster', width: 100 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>压扁</span>,
    dataIndex: 'flatten',
    width: 70,
    render: (val: string) => val === '是' ? '是' : '',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>营运</span>,
    dataIndex: 'operation',
    width: 70,
    render: (val: string) => val === '是' ? '是' : '',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>B级</span>,
    dataIndex: 'bLevel',
    width: 70,
    render: (val: string) => val === '是' ? '是' : '',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>,
    dataIndex: 'iron',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>,
    dataIndex: 'aluminum',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>,
    dataIndex: 'ternary',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>,
    dataIndex: 'battery',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>备注</span>, dataIndex: 'remark', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
];

const entryCodeOptions = [
  { value: '6G0439', label: '6G0439' },
  { value: '6G0438', label: '6G0438' },
  { value: '6G0437', label: '6G0437' },
  { value: '6G0436', label: '6G0436' },
  { value: '6G0435', label: '6G0435' },
  { value: '6G0434', label: '6G0434' },
  { value: '6G0433', label: '6G0433' },
  { value: '6G0432', label: '6G0432' },
  { value: '6G0431', label: '6G0431' },
  { value: '6G0430', label: '6G0430' },
];

export default function ScrappedVehicle() {
  const [dataSource, setDataSource] = useState<ScrappedVehicleItem[]>(mockData);
  const [total, setTotal] = useState(33597);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageNo(1);
    if (!value) {
      setDataSource(mockData);
      setTotal(33597);
    } else {
      const filtered = mockData.filter(
        (item) =>
          item.entryCode.includes(value) ||
          item.supplier.includes(value) ||
          item.vehicleModel.includes(value),
      );
      setDataSource(filtered);
      setTotal(filtered.length);
    }
  }, []);

  const handleAdd = () => {
    setAddModalOpen(true);
    form.resetFields();
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.success('入库完成');
      setAddModalOpen(false);
      form.resetFields();
    } catch {
      message.error('请填写完整信息');
    }
  };

  const handleImport = () => {
    message.info('导入功能开发中');
  };

  const handleExport = () => {
    message.success('导出成功');
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
    setSelectedRowKeys([]);
  };

  const moreMenuItems = [
    { key: 'batchUpdate', label: '批量更新' },
    { key: 'batchDelete', label: '批量删除' },
    { key: 'exportAll', label: '导出全部' },
  ];

  return (
    <div className="page-container" style={{ padding: 0, background: '#f5f5f5', minHeight: '100%' }}>
      <Card style={{ margin: 0, borderRadius: 0 }} bodyStyle={{ padding: 0 }} title={null}>
        {/* 操作工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
            <Dropdown menu={{ items: moreMenuItems }}>
              <Button>
                <MoreOutlined />
              </Button>
            </Dropdown>
          </Space>
          <Space>
            <Input.Search
              placeholder="搜索数据"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Button
              icon={<FilterOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
            >
              筛选
            </Button>
            <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <ColumnWidthOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <MoreOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
          </Space>
        </div>

        {/* 数据表格 */}
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            scroll={{ x: 2800 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
              onShowSizeChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
            }}
          />
        </div>
      </Card>

      {/* 添加表单弹窗 */}
      <Modal
        title="4.报废车入库"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={720}
        footer={null}
        closable
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark
          style={{ marginTop: 8 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              label="入场编号"
              name="entryCode"
              rules={[{ required: true, message: '请选择入场编号' }]}
            >
              <Select
                placeholder="请选择"
                options={entryCodeOptions}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item label="销户/议价" name="negotiation">
              <Input placeholder="请输入" />
            </Form.Item>

            <Form.Item
              label="过磅日期"
              name="weighDate"
              rules={[{ required: true, message: '请选择过磅日期' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>

            <Form.Item
              label="净重"
              name="netWeight"
              rules={[{ required: true, message: '请输入净重' }]}
            >
              <InputNumber
                placeholder="请填写数值"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                step={0.01}
              />
            </Form.Item>

            <Form.Item
              label="供应商"
              name="supplier"
              rules={[{ required: true, message: '请输入供应商' }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>

            <Form.Item
              label="车辆类型"
              name="vehicleType"
              rules={[{ required: true, message: '请输入车辆类型' }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>

            <Form.Item label="车辆型号" name="vehicleModel">
              <Input placeholder="请输入" />
            </Form.Item>

            <Form.Item
              label="司磅员"
              name="weighmaster"
              rules={[{ required: true, message: '请选择司磅员' }]}
            >
              <div
                style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  padding: '4px 11px',
                  cursor: 'pointer',
                  background: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 32,
                }}
                onClick={() => message.info('选择成员')}
              >
                <UserOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                <span style={{ color: '#1890ff' }}>+ 选择成员</span>
              </div>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px', marginTop: 8 }}>
            <Form.Item label="压扁" name="flatten">
              <Radio.Group>
                <Radio value="是">是</Radio>
                <Radio value="否">否</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="营运" name="operation">
              <Radio.Group>
                <Radio value="是">是</Radio>
                <Radio value="否">否</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="B级" name="bLevel">
              <Radio.Group>
                <Radio value="是">是</Radio>
                <Radio value="否">否</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px', marginTop: 8 }}>
            <Form.Item label="铁" name="iron">
              <InputNumber placeholder="请填写数值" style={{ width: '100%' }} min={0} precision={2} step={0.01} />
            </Form.Item>

            <Form.Item label="铝" name="aluminum">
              <InputNumber placeholder="请填写数值" style={{ width: '100%' }} min={0} precision={2} step={0.01} />
            </Form.Item>

            <Form.Item label="三元" name="ternary">
              <InputNumber placeholder="请填写数值" style={{ width: '100%' }} min={0} precision={2} step={0.01} />
            </Form.Item>

            <Form.Item label="电瓶" name="battery">
              <InputNumber placeholder="请填写数值" style={{ width: '100%' }} min={0} precision={2} step={0.01} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '0 16px', marginTop: 8 }}>
            <Form.Item label="轮胎" name="tire">
              <InputNumber placeholder="请填写数值" style={{ width: '100%' }} min={0} precision={2} step={0.01} />
            </Form.Item>

            <Form.Item label="备注" name="remark">
              <Input.TextArea placeholder="请输入" rows={2} />
            </Form.Item>
          </div>

          <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleAddSubmit}
              style={{
                width: 160,
                background: '#52c41a',
                borderColor: '#52c41a',
                height: 48,
                fontSize: 16,
              }}
            >
              入库完成
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
