import { useState, useCallback } from 'react';
import { useBizDataWithLocal } from '@/hooks/useBizDataWithLocal';
import DataScopeDropdown from '@/components/DataScopeDropdown';
import BizLinkDataModal, { mapLinkedRowToFormValues, PRODUCTION_LINK_SOURCES } from '@/components/BizLinkDataModal';
import DictSelect from '@/components/DictSelect';
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
  const {
    dataSource,
    total,
    pageNo,
    pageSize,
    loading,
    searchValue,
    setSearchValue,
    setPageNo,
    setPageSize,
    onSearch,
    appendLocal,
    removeLocal,
    setDataScope,
  } = useBizDataWithLocal<ScrappedVehicleItem>('scrapped-vehicle');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [linkModalOpen, setLinkModalOpen] = useState(false);


  const handleAdd = () => {
    setAddModalOpen(true);
    form.resetFields();
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      appendLocal({
        ...values,
        entryCode: values.entryCode || `RK${Date.now()}`,
      } as Omit<ScrappedVehicleItem, 'id'>);
      message.success('入库完成，已写入列表');
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
    removeLocal(selectedRowKeys.map(Number));
    setSelectedRowKeys([]);
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
  };

  const moreMenuItems = [
    { key: 'batchUpdate', label: '批量更新' },
    { key: 'batchDelete', label: '批量删除' },
    { key: 'exportAll', label: '导出全部' },
  ];

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            gap: 8,
          }}
        >
          <DataScopeDropdown onChange={setDataScope} />
          <Button type="link" onClick={() => setLinkModalOpen(true)}>联动结账/划价/扣杂</Button>
        </div>
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
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={onSearch}
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
            loading={loading}
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
              rules={[{ required: true, message: '请选择供应商' }]}
            >
              <DictSelect dict="supplier" placeholder="请选择供应商（基础资料）" />
            </Form.Item>

            <Form.Item
              label="车辆类型"
              name="vehicleType"
              rules={[{ required: true, message: '请输入车辆类型' }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>

            <Form.Item label="车辆型号" name="vehicleModel">
              <DictSelect dict="vehicleModel" placeholder="请选择车辆型号（基础资料）" />
            </Form.Item>

            <Form.Item
              label="司磅员"
              name="weighmaster"
              rules={[{ required: true, message: '请选择司磅员' }]}
            >
              <DictSelect dict="staff" placeholder="请选择司磅员（基础资料-生产人员）" />
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

      <BizLinkDataModal
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        sources={PRODUCTION_LINK_SOURCES}
        onSelect={(row) => {
          form.setFieldsValue({
            entryCode: row.code,
            ...mapLinkedRowToFormValues(row),
          });
          setLinkModalOpen(false);
          setAddModalOpen(true);
        }}
      />
    </div>
  );
}
