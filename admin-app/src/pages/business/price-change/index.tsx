import { useState, useCallback } from 'react';
import { useBizDataWithLocal } from '@/hooks/useBizDataWithLocal';
import DictSelect from '@/components/DictSelect';
import BizLinkDataModal, { mapLinkedRowToFormValues } from '@/components/BizLinkDataModal';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Dropdown,
  Tag,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Divider,
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
  EditOutlined,
  DatabaseOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface PriceChangeItem {
  id: number;
  code: string;
  returnDate: string;
  weighDate: string;
  plateNumber: string;
  vehicleType: string;
  vehicleModel: string;
  supplier: string;
  salesperson: string;
  returnLocation: string;
  tonnage: number;
  iron: number;
  aluminum: number;
  ternary: number;
  battery: number;
  kgDiff: number;
  deductNetWeight: number;
  deductBattery: number;
  goodCondition: number;
  deductTwoBox: number;
  deductBreadBox: number;
  deductIronRing: number;
  deductDiesel: number;
  selfDelivery: number;
  deductSmallParts: number;
  unitPrice: number;
  totalPrice: number;
  remark: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
  processStatus: string;
  currentNode: string;
  currentHandler: string;
}


const columns: ColumnsType<PriceChangeItem> = [
  { title: '编号', dataIndex: 'code', width: 100, fixed: 'left' },
  { title: '回车日期', dataIndex: 'returnDate', width: 110 },
  { title: '过磅日期', dataIndex: 'weighDate', width: 110 },
  { title: '车牌号', dataIndex: 'plateNumber', width: 110 },
  { title: '车辆类型', dataIndex: 'vehicleType', width: 120 },
  { title: '车辆型号', dataIndex: 'vehicleModel', width: 90, render: () => '' },
  { title: '供应商', dataIndex: 'supplier', width: 120, render: () => '' },
  { title: '业务员', dataIndex: 'salesperson', width: 90 },
  { title: '回车地', dataIndex: 'returnLocation', width: 80 },
  { title: '吨位', dataIndex: 'tonnage', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '铁', dataIndex: 'iron', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '铝', dataIndex: 'aluminum', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '三元', dataIndex: 'ternary', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '电瓶', dataIndex: 'battery', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '公斤差', dataIndex: 'kgDiff', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣净重', dataIndex: 'deductNetWeight', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣电瓶', dataIndex: 'deductBattery', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '车况较好', dataIndex: 'goodCondition', width: 90, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣两厢', dataIndex: 'deductTwoBox', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣面包斗斗', dataIndex: 'deductBreadBox', width: 100, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣铁圈', dataIndex: 'deductIronRing', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣柴油', dataIndex: 'deductDiesel', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '自送', dataIndex: 'selfDelivery', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '扣小件', dataIndex: 'deductSmallParts', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: '单价', dataIndex: 'unitPrice', width: 90, align: 'right', render: (val: number) => val?.toLocaleString() },
  { title: '总价', dataIndex: 'totalPrice', width: 100, align: 'right', render: (val: number) => val?.toLocaleString() },
  { title: '备注', dataIndex: 'remark', width: 100, render: (val: string) => val || '' },
  {
    title: '提交人',
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>,
  },
  { title: '提交时间', dataIndex: 'submitTime', width: 170 },
  { title: '更新时间', dataIndex: 'updateTime', width: 170 },
  {
    title: '流程状态',
    dataIndex: 'processStatus',
    width: 100,
    render: (val: string) => (
      <Tag color={val === 'completed' ? 'green' : 'orange'} style={{ borderRadius: 10, padding: '2px 10px' }}>
        {val === 'completed' ? '流转完成' : '处理中'}
      </Tag>
    ),
  },
  { title: '当前节点', dataIndex: 'currentNode', width: 100, render: (val: string) => val || '' },
  { title: '当前负责人', dataIndex: 'currentHandler', width: 100, render: (val: string) => val || '' },
];

export default function PriceChangePage() {
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
  } = useBizDataWithLocal<PriceChangeItem>('price-change');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [addForm] = Form.useForm();


  const handleAdd = () => {
    addForm.resetFields();
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      appendLocal({
        ...values,
        code: values.code || `HJ${Date.now()}`,
        flowStatus: '已提交',
      } as Omit<PriceChangeItem, 'id'>);
      message.success('提交成功，已写入列表！');
      setAddModalOpen(false);
    } catch {
      // validation failed
    }
  };

  const handleSaveDraft = () => {
    const values = addForm.getFieldsValue();
    appendLocal({
      ...values,
      code: values.code || `HJ${Date.now()}`,
      flowStatus: '草稿',
    } as Omit<PriceChangeItem, 'id'>);
    message.success('草稿保存成功！');
    setAddModalOpen(false);
  };

  const handleImport = () => {
    message.info('导入');
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

  const permissionMenuItems = [
    { key: 'all', label: '查看全部流程' },
    { key: 'dept', label: '本部门' },
    { key: 'self', label: '仅自己' },
  ];

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* 顶部工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fff',
            gap: 8,
          }}
        >
          <Dropdown
            menu={{ items: permissionMenuItems, defaultSelectedKeys: ['all'] }}
          >
            <Button>
              查看全部流程 <DownOutlined />
            </Button>
          </Dropdown>
          <Button type="link" onClick={() => setLinkModalOpen(true)}>从结账/过磅带入</Button>
          <Button type="link" icon={<PlusOutlined />}>
            新建视图
          </Button>
          <Button type="link" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button type="link" icon={<DatabaseOutlined />}>
            数据管理
          </Button>
          <Button type="link" icon={<MoreOutlined />}>
            流程分析
          </Button>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
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
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                color: '#fff',
              }}
            >
              筛选
            </Button>
            <ExportOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
            <ColumnWidthOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
            <FullscreenOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
            <MoreOutlined
              style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
            />
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

      {/* 添加修改价格弹窗 */}
      <Modal
        title={null}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        width={720}
        closable={false}
        centered
        styles={{ body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' } }}
        footer={null}
      >
        <div style={{ padding: '16px 32px 24px' }}>
          {/* 标题栏 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
              业务结账
            </span>
            <Space>
              <FullscreenOutlined
                style={{ fontSize: 16, cursor: 'pointer', color: '#666' }}
              />
              <span
                onClick={() => setAddModalOpen(false)}
                style={{
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#999',
                  lineHeight: '20px',
                }}
              >
                ×
              </span>
            </Space>
          </div>

          <Form
            form={addForm}
            layout="vertical"
            initialValues={{}}
          >
            {/* 基本信息 */}
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              基本信息
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item
                name="code"
                label="编号"
                rules={[{ required: true, message: '请选择编号' }]}
              >
                <Select placeholder="请选择">
                  {dataSource.map(item => (
                    <Select.Option key={item.id} value={item.code}>{item.code}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="returnDate"
                label="回车日期"
                rules={[{ required: true, message: '请选择回车日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
              </Form.Item>

              <Form.Item
                name="weighDate"
                label="过磅日期"
                rules={[{ required: true, message: '请选择过磅日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
              </Form.Item>

              <Form.Item
                name="plateNumber"
                label="车牌号"
                rules={[{ required: true, message: '请输入车牌号' }]}
              >
                <Input placeholder="请输入车牌号" />
              </Form.Item>
            </div>

            <Form.Item
              name="vehicleType"
              label="车辆类型"
              rules={[{ required: true, message: '请输入车辆类型' }]}
            >
              <Input placeholder="请输入车辆类型" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="vehicleModel" label="车辆型号">
                <DictSelect dict="vehicleModel" placeholder="请选择车辆型号（基础资料）" />
              </Form.Item>

              <Form.Item name="supplier" label="供应商">
                <DictSelect dict="supplier" placeholder="请选择供应商（基础资料）" />
              </Form.Item>

              <Form.Item name="salesperson" label="业务员">
                <DictSelect dict="salesman" placeholder="请选择业务员（基础资料）" />
              </Form.Item>

              <Form.Item name="returnLocation" label="回车地">
                <Input placeholder="请输入回车地" />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item
                name="unitPrice"
                label="单价"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={1} />
              </Form.Item>

              <Form.Item
                name="tonnage"
                label="吨位"
                rules={[{ required: true, message: '请输入吨位' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="iron" label="铁">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="ternary" label="三元">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px', marginBottom: 16 }}>
              <Form.Item name="aluminum" label="铝">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="battery" label="电瓶">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            {/* 车辆情况 */}
            <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
              车辆情况
            </Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="deductNetWeight" label="扣净重">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="kgDiff" label="公斤差">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="deductBattery" label="扣电瓶">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="goodCondition" label="车况较好">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="deductTwoBox" label="扣两厢">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="deductBreadBox" label="扣面包斗斗">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="deductIronRing" label="扣铁圈">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="deductDiesel" label="扣柴油">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', marginBottom: 16 }}>
              <Form.Item name="totalPrice" label="总价">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="暂无内容"
                  disabled
                  min={0}
                  step={1}
                />
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <Input placeholder="请输入备注内容" />
              </Form.Item>
            </div>

            {/* 修改情况 */}
            <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
              修改情况
            </Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="newUnitPrice" label="单价">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={1} />
              </Form.Item>

              <Form.Item name="newDeductBattery" label="扣电瓶">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newGoodCondition" label="车况较好">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newDeductTwoBox" label="扣两厢">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="newDeductBreadBox" label="扣面包斗斗">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newDeductIronRing" label="扣铁圈">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newDeductDiesel" label="扣柴油">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newDeductNetWeight" label="扣净重">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '0 16px', marginBottom: 16 }}>
              <Form.Item name="newKgDiff" label="公斤差">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="newTotalPrice" label="总价">
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={1} />
              </Form.Item>

              <Form.Item name="modifyRemark" label="修改备注">
                <Input.TextArea rows={3} placeholder="请输入修改备注内容" />
              </Form.Item>
            </div>

            {/* 底部按钮 */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleAddSubmit}
                style={{
                  flex: 1,
                  background: '#00a884',
                  borderColor: '#00a884',
                  height: 44,
                }}
              >
                提交修改
              </Button>
              <Button
                size="large"
                onClick={handleSaveDraft}
                style={{ flex: 1, height: 44 }}
              >
                保存草稿
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <BizLinkDataModal
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        sources={['settlement', 'weighing-inspection']}
        title="从业务结账 / 过磅查验带入"
        onSelect={(row) => {
          addForm.setFieldsValue(mapLinkedRowToFormValues(row));
          setLinkModalOpen(false);
          setAddModalOpen(true);
        }}
      />
    </div>
  );
}
