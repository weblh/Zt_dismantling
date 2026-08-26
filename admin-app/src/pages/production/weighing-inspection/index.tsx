import { useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Divider,
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
  EditOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useBizDataWithLocal } from '@/hooks/useBizDataWithLocal';
import DataScopeDropdown from '@/components/DataScopeDropdown';
import BizLinkDataModal, { mapLinkedRowToFormValues, PRODUCTION_LINK_SOURCES } from '@/components/BizLinkDataModal';
import DictSelect from '@/components/DictSelect';
import { getStoredUser } from '@/config/apps';
import { formatBizDateTime } from '@/utils/localBizStore';

interface WeighingInspectionItem {
  id: number;
  code: string;
  negotiation: string;
  weighDate: string;
  plateNumber: string;
  returnDate: string;
  vehicleType: string;
  vehicleModel: string;
  supplier: string;
  salesperson: string;
  returnLocation: string;
  tonnage: number;
  flatten: string;
  operation: string;
  bLevel: string;
  iron: number;
  aluminum: number;
  ternary: number;
  battery: number;
  tire: number;
  remark: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const columns: ColumnsType<WeighingInspectionItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>, dataIndex: 'code', width: 100, fixed: 'left' },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>销户/议价</span>,
    dataIndex: 'negotiation',
    width: 100,
    fixed: 'left',
    render: (val: string) => (
      <span style={{ color: val === '议价' ? '#fa8c16' : '#52c41a' }}>
        {val === '议价' ? '议价' : '×'}
      </span>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'weighDate', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车牌号</span>, dataIndex: 'plateNumber', width: 130 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>回车日期</span>, dataIndex: 'returnDate', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>供应商</span>, dataIndex: 'supplier', width: 160, ellipsis: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>业务员</span>, dataIndex: 'salesperson', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>回车地</span>, dataIndex: 'returnLocation', width: 80 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>吨位</span>, dataIndex: 'tonnage', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>压扁</span>, dataIndex: 'flatten', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>营运</span>, dataIndex: 'operation', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>B级</span>, dataIndex: 'bLevel', width: 70, align: 'center' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>, dataIndex: 'iron', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>, dataIndex: 'aluminum', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>, dataIndex: 'ternary', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>, dataIndex: 'battery', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>轮胎</span>, dataIndex: 'tire', width: 80, align: 'right', render: (val: number) => val?.toFixed(2) },
  { title: <span style={{ whiteSpace: 'nowrap' }}>备注</span>, dataIndex: 'remark', width: 150, ellipsis: true },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
];

export default function WeighingInspection() {
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
  } = useBizDataWithLocal<WeighingInspectionItem>('weighing-inspection');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const handleAdd = () => {
    addForm.resetFields();
    setAddModalOpen(true);
  };

  const openSettlementLink = () => {
    setLinkModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      const user = getStoredUser();
      const now = formatBizDateTime();
      appendLocal({
        code: values.code || '',
        negotiation: values.negotiation || '',
        weighDate: values.weighDate?.format?.('YYYY-MM-DD') || values.weighDate || '',
        plateNumber: values.plateNumber || '',
        returnDate: values.returnDate?.format?.('YYYY-MM-DD') || values.returnDate || '',
        vehicleType: values.vehicleType || '',
        vehicleModel: values.vehicleModel || '',
        supplier: values.supplier || '',
        salesperson: values.salesperson || '',
        returnLocation: values.returnLocation || '',
        tonnage: Number(values.tonnage || 0),
        flatten: values.flatten || '',
        operation: values.operation || '',
        bLevel: values.bLevel || '',
        iron: Number(values.iron || 0),
        aluminum: Number(values.aluminum || 0),
        ternary: Number(values.ternary || 0),
        battery: Number(values.battery || 0),
        tire: Number(values.tire || 0),
        remark: values.remark || '',
        submitter: user.nickname || user.username || '系统',
        submitTime: now,
        updateTime: now,
      } as Omit<WeighingInspectionItem, 'id'>);
      message.success('提交成功！');
      setAddModalOpen(false);
    } catch {
      // validation failed
    }
  };

  const handleSaveDraft = () => {
    message.success('草稿保存成功！');
    setAddModalOpen(false);
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
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
    setSelectedRowKeys([]);
  };

  const handleImport = () => {
    message.info('导入功能开发中');
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* 顶部工具栏 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fff', gap: 8 }}>
          <DataScopeDropdown onChange={setDataScope} />
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" icon={<DatabaseOutlined />}>数据管理</Button>
          <Button type="link" onClick={openSettlementLink}>联动结账/划价/扣杂</Button>
        </div>

        {/* 操作工具栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
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
            <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
            <ColumnWidthOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
            <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
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
              showTotal: (t) => `${Math.floor(pageSize * (pageNo - 1))}条/共 ${t} 条`,
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

      {/* 添加过磅查验弹窗 */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>过磅查验</span>
            <Space>
              <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer', color: '#666' }} />
              <span onClick={() => setAddModalOpen(false)} style={{ fontSize: 18, cursor: 'pointer', color: '#999', lineHeight: '20px' }}>×</span>
            </Space>
          </div>

          <Form form={addForm} layout="vertical">
            {/* 基本信息 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="code" label="编号" rules={[{ required: true, message: '请输入编号' }]}>
                <Input placeholder="请输入" />
              </Form.Item>

              <Form.Item name="negotiation" label="销户/议价" rules={[{ required: true, message: '请输入销户/议价' }]}>
                <Input placeholder="请输入" />
              </Form.Item>

              <Form.Item name="weighDate" label="过磅日期" rules={[{ required: true, message: '请选择过磅日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
              </Form.Item>

              <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            <Form.Item name="returnDate" label="回车日期" rules={[{ required: true, message: '请选择回车日期' }]} style={{ maxWidth: 260 }}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择日期" />
            </Form.Item>

            {/* 车辆类型 */}
            <Form.Item name="vehicleType" label="车辆类型" rules={[{ required: true, message: '请选择车辆类型' }]}>
              <Radio.Group>
                <Space direction="vertical" size={[8, 8]}>
                  <Space wrap>
                    <Radio value="2厢40">2厢40</Radio>
                    <Radio value="3厢50">3厢50</Radio>
                    <Radio value="三厢B级75">三厢B级75</Radio>
                    <Radio value="三厢BBA85">三厢BBA85</Radio>
                    <Radio value="面包30">面包30</Radio>
                    <Radio value="大面包50">大面包50</Radio>
                  </Space>
                  <Space wrap>
                    <Radio value="旅行车">旅行车</Radio>
                    <Radio value="小商务40">小商务40</Radio>
                    <Radio value="商务55">商务55</Radio>
                    <Radio value="越野55">越野55</Radio>
                    <Radio value="小越野40">小越野40</Radio>
                    <Radio value="单排30">单排30</Radio>
                    <Radio value="双排30">双排30</Radio>
                  </Space>
                  <Space wrap>
                    <Radio value="皮卡40">皮卡40</Radio>
                    <Radio value="轻卡30">轻卡30</Radio>
                    <Radio value="客车">客车</Radio>
                    <Radio value="中型客车">中型客车</Radio>
                    <Radio value="重型货车">重型货车</Radio>
                    <Radio value="摩托20">摩托20</Radio>
                  </Space>
                  <Space wrap>
                    <Radio value="三轮摩托20">三轮摩托20</Radio>
                    <Radio value="五轮农用车30">五轮农用车30</Radio>
                    <Radio value="箱货40">箱货40</Radio>
                    <Radio value="二轮蹦蹦20">二轮蹦蹦20</Radio>
                    <Radio value="油罐车">油罐车</Radio>
                    <Radio value="自行车15">自行车15</Radio>
                  </Space>
                  <Space wrap>
                    <Radio value="奥拓40">奥拓40</Radio>
                    <Radio value="其他">其他</Radio>
                  </Space>
                </Space>
              </Radio.Group>
            </Form.Item>

            {/* 车辆型号等信息 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="vehicleModel" label="车辆型号" rules={[{ required: true, message: '请选择车辆型号' }]}>
                <DictSelect dict="vehicleModel" placeholder="请选择车辆型号（基础资料）" />
              </Form.Item>

              <Form.Item name="supplier" label="供应商">
                <DictSelect dict="supplier" placeholder="请选择供应商（基础资料）" />
              </Form.Item>

              <Form.Item name="salesperson" label="业务员">
                <DictSelect dict="salesman" placeholder="请选择业务员（基础资料）" />
              </Form.Item>

              <Form.Item name="returnLocation" label="回车地">
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 吨位与状态 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="tonnage" label="吨位" rules={[{ required: true, message: '请输入吨位' }]}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" min={0} step={0.01} />
              </Form.Item>

              <Form.Item name="flatten" label="压扁">
                <Radio.Group>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="operation" label="营运">
                <Radio.Group>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="bLevel" label="B级">
                <Radio.Group>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
              </Form.Item>
            </div>

            {/* 车辆情况 */}
            <Divider titlePlacement="left" style={{ borderColor: '#1890ff', fontSize: 14, fontWeight: 500 }}>
              车辆情况
            </Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="iron" label="铁">
                <Select placeholder="请选择">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <Select.Option key={n} value={n}>{n}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="aluminum" label="铝">
                <Select placeholder="请选择">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <Select.Option key={n} value={n}>{n}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="ternary" label="三元" rules={[{ required: true, message: '请选择三元' }]}>
                <Radio.Group>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="battery" label="电瓶" rules={[{ required: true, message: '请选择电瓶' }]}>
                <Radio.Group>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '0 16px' }}>
              <Form.Item name="tire" label="轮胎">
                <Select placeholder="请选择">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <Select.Option key={n} value={n}>{n}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="请输入备注内容" />
              </Form.Item>
            </div>

            {/* 底部按钮 */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleAddSubmit}
                style={{ flex: 1, background: '#00a884', borderColor: '#00a884', height: 44 }}
              >
                提交
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
        sources={PRODUCTION_LINK_SOURCES}
        onSelect={(row) => {
          addForm.setFieldsValue(mapLinkedRowToFormValues(row));
          setLinkModalOpen(false);
          setAddModalOpen(true);
        }}
      />
    </div>
  );
}
