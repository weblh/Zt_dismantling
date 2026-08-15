import { Card, Table, Input, Button, Space, message, Modal, Form, Select, DatePicker, Radio, InputNumber } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined, FundProjectionScreenOutlined, UnorderedListOutlined, ColumnHeightOutlined, CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

interface RecycleItem {
  id: number;
  no: string;
  closeOrNegotiate: string;
  weighDate: string;
  plateNo: string;
  returnDate: string;
  vehicleType: string;
  vehicleModel: string;
  supplier: string;
  salesperson: string;
  returnPlace: string;
  tonnage: number;
  flatten: string;
  operation: string;
  bLevel: string;
  iron: string;
  aluminum: string;
  ternary: string;
  battery: string;
  remark: string;
  cancelForm: string;
  cancelFormRemark: string;
  handover: string;
  handoverRemark: string;
  recycleCert: string;
  recycleCertNo: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: RecycleItem[] = [
  {
    id: 1, no: 'HS001', closeOrNegotiate: '销户', weighDate: '2026-08-03', plateNo: '晋A12345',
    returnDate: '2026-08-03', vehicleType: '货车', vehicleModel: '解放J6', supplier: '太原运输公司',
    salesperson: '王经理', returnPlace: '太原', tonnage: 8.5, flatten: '是', operation: '营运',
    bLevel: 'B级', iron: '2.5', aluminum: '0.8', ternary: '1.2', battery: '0.5', remark: '正常',
    cancelForm: '已提交', cancelFormRemark: '-', handover: '已移交', handoverRemark: '-',
    recycleCert: '已开具', recycleCertNo: 'HS20260803001', submitter: '张三', submitTime: '2026-08-03 10:30',
    updateTime: '2026-08-03 14:20',
  },
];

const columns: ColumnsType<RecycleItem> = [
  { title: '编号', dataIndex: 'no', width: 90, fixed: 'left' },
  { title: '销户/议价', dataIndex: 'closeOrNegotiate', width: 90 },
  { title: '过磅日期', dataIndex: 'weighDate', width: 110 },
  { title: '车牌号', dataIndex: 'plateNo', width: 110 },
  { title: '回车日期', dataIndex: 'returnDate', width: 110 },
  { title: '车辆类型', dataIndex: 'vehicleType', width: 90 },
  { title: '车辆型号', dataIndex: 'vehicleModel', width: 110 },
  { title: '供应商', dataIndex: 'supplier', width: 120 },
  { title: '业务员', dataIndex: 'salesperson', width: 90 },
  { title: '回车地', dataIndex: 'returnPlace', width: 80 },
  { title: '吨位', dataIndex: 'tonnage', width: 80, align: 'right', render: (v) => v.toFixed(2) },
  { title: '压扁', dataIndex: 'flatten', width: 70, align: 'center' },
  { title: '营运', dataIndex: 'operation', width: 70, align: 'center' },
  { title: 'B级', dataIndex: 'bLevel', width: 70, align: 'center' },
  { title: '铁', dataIndex: 'iron', width: 80, align: 'right' },
  { title: '铝', dataIndex: 'aluminum', width: 80, align: 'right' },
  { title: '三元', dataIndex: 'ternary', width: 80, align: 'right' },
  { title: '电瓶', dataIndex: 'battery', width: 80, align: 'right' },
  { title: '备注', dataIndex: 'remark', width: 100 },
  { title: '注销单', dataIndex: 'cancelForm', width: 90 },
  { title: '注销单备注', dataIndex: 'cancelFormRemark', width: 100 },
  { title: '移交手续', dataIndex: 'handover', width: 90 },
  { title: '移交手续备注', dataIndex: 'handoverRemark', width: 100 },
  { title: '回收证明', dataIndex: 'recycleCert', width: 90 },
  { title: '回收证明', dataIndex: 'recycleCertNo', width: 140 },
  { title: '提交人', dataIndex: 'submitter', width: 90 },
  { title: '提交时间', dataIndex: 'submitTime', width: 140 },
  { title: '更新时间', dataIndex: 'updateTime', width: 140 },
];

const vehicleTypeOptions = [
  '2厢', '3厢', '面包', '大面包', '旅行车', '小商务', '商务', '越野', '小越野',
  '单排', '双排', '皮卡', '轻卡', '客车', '中型客车', '重型货车', '摩托',
  '三轮摩托', '五轮农用车', '箱货', '二轮蹦蹦', '油罐车', '自行车', '奥拓', '其他',
];

const yesNoOptions = [
  { label: '是', value: '是', style: { background: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
  { label: '否', value: '否', style: { borderRadius: 4, padding: '2px 12px' } },
];

const openStatusOptions = [
  { label: '已开', value: '已开', style: { background: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
  { label: '未开', value: '未开', style: { background: '#fffbe6', borderColor: '#ffe58f', color: '#d48806', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
];

const handoverOptions = [
  { label: '已移交', value: '已移交', style: { background: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
  { label: '未移交', value: '未移交', style: { background: '#fffbe6', borderColor: '#ffe58f', color: '#d48806', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
];

const ternaryBatteryOptions = [
  { label: '√', value: '√', style: { background: '#f6ffed', borderColor: '#b7eb8f', color: '#389e0d', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
  { label: '×', value: '×', style: { background: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', borderRadius: 4, padding: '2px 12px', border: '1px solid' } },
];

export default function RecycleCertificateLedger() {
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item =>
        item.no.includes(searchValue) ||
        item.plateNo.includes(searchValue) ||
        item.vehicleModel.includes(searchValue) ||
        item.supplier.includes(searchValue)
      ));
    }
  };

  const handleSubmit = () => {
    form.validateFields().then(() => {
      message.success('提交成功');
      setAddOpen(false);
      form.resetFields();
    });
  };

  const handleSaveDraft = () => {
    message.success('保存草稿成功');
    setAddOpen(false);
    form.resetFields();
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* Top view tabs */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', gap: 16 }}>
          <Space>
            <Button type="primary" size="small" icon={<FundProjectionScreenOutlined />}>表格视图</Button>
            <Button size="small" icon={<UnorderedListOutlined />}>看板视图</Button>
            <Button size="small" icon={<FundProjectionScreenOutlined />}>表格视图</Button>
          </Space>
          <div style={{ flex: 1 }} />
          <Button size="small" type="primary" ghost>新建视图</Button>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>添加</Button>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={() => message.success('导出成功')}>导出</Button>
            <Button icon={<DeleteOutlined />}>删除</Button>
            <Button>操作记录</Button>
          </Space>
          <Space>
            <Input.Search placeholder="搜索数据" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onSearch={handleSearch} style={{ width: 200 }} allowClear />
            <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
            <Button icon={<ColumnHeightOutlined />}>排序</Button>
            <Button>更多</Button>
          </Space>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            scroll={{ x: 2400 }}
            pagination={{
              showSizeChanger: true,
              showTotal: (t) => `0条 / 共 ${t} 条`,
              pageSize: 20,
            }}
          />
        </div>
      </Card>

      {/* Add Modal */}
      <Modal
        title="回收证明"
        open={addOpen}
        onCancel={() => { setAddOpen(false); form.resetFields(); }}
        footer={null}
        width={860}
        centered
        closeIcon={<CloseOutlined />}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {/* Row 1: 4 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 编号</span>} name="no" rules={[{ required: true, message: '请选择编号' }]}>
              <Select placeholder="请选择" />
            </Form.Item>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 销户/议价</span>} name="closeOrNegotiate" rules={[{ required: true, message: '请输入销户/议价' }]}>
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 过磅日期</span>} name="weighDate" rules={[{ required: true, message: '请选择过磅日期' }]}>
              <DatePicker style={{ width: '100%' }} suffixIcon={<CalendarOutlined />} />
            </Form.Item>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 车牌号</span>} name="plateNo" rules={[{ required: true, message: '请选择车牌号' }]}>
              <Select placeholder="请选择" />
            </Form.Item>
          </div>

          {/* Row 2: 回车日期 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 回车日期</span>} name="returnDate" rules={[{ required: true, message: '请选择回车日期' }]}>
              <DatePicker style={{ width: '100%' }} suffixIcon={<CalendarOutlined />} />
            </Form.Item>
          </div>

          {/* Row 3: 车辆类型 radio grid */}
          <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 车辆类型</span>} name="vehicleType" rules={[{ required: true, message: '请选择车辆类型' }]}>
            <Radio.Group>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '8px 16px' }}>
                {vehicleTypeOptions.map((opt) => (
                  <Radio key={opt} value={opt} style={{ display: 'block', marginRight: 0 }}>{opt}</Radio>
                ))}
              </div>
            </Radio.Group>
          </Form.Item>

          {/* Row 4: 4 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 车辆型号</span>} name="vehicleModel" rules={[{ required: true, message: '请选择车辆型号' }]}>
              <Select placeholder="请选择" />
            </Form.Item>
            <Form.Item label="供应商" name="supplier">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item label="业务员" name="salesperson">
              <Select placeholder="请选择" />
            </Form.Item>
            <Form.Item label="回车地" name="returnPlace">
              <Input placeholder="请输入" />
            </Form.Item>
          </div>

          {/* Row 5: 吨位 + 压扁 + 营运 + B级 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 吨位</span>} name="tonnage" rules={[{ required: true, message: '请填写吨位' }]}>
              <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
            </Form.Item>
            <Form.Item label="压扁" name="flatten" initialValue="是">
              <Radio.Group options={yesNoOptions} />
            </Form.Item>
            <Form.Item label="营运" name="operation" initialValue="是">
              <Radio.Group options={yesNoOptions} />
            </Form.Item>
            <Form.Item label="B级" name="bLevel" initialValue="是">
              <Radio.Group options={yesNoOptions} />
            </Form.Item>
          </div>

          {/* Section: 车辆情况 */}
          <div style={{ borderTop: '2px solid #52c41a', margin: '8px 0 16px' }}>
            <span style={{ color: '#52c41a', fontWeight: 500, fontSize: 14 }}>车辆情况</span>
          </div>

          {/* Row: 铁 + 铝 + 三元 + 电瓶 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label="铁" name="iron">
              <Select defaultValue={4}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="铝" name="aluminum">
              <Select defaultValue={4}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 三元</span>} name="ternary" rules={[{ required: true }]} initialValue="√">
              <Radio.Group options={ternaryBatteryOptions} />
            </Form.Item>
            <Form.Item label={<span><span style={{ color: '#ff4d4f' }}>*</span> 电瓶</span>} name="battery" rules={[{ required: true }]} initialValue="√">
              <Radio.Group options={ternaryBatteryOptions} />
            </Form.Item>
          </div>

          {/* 备注 */}
          <Form.Item label="备注" name="remark">
            <TextArea rows={3} placeholder="请输入" />
          </Form.Item>

          {/* Section: 回收证明 */}
          <div style={{ borderTop: '2px solid #52c41a', margin: '8px 0 16px' }}>
            <span style={{ color: '#52c41a', fontWeight: 500, fontSize: 14 }}>回收证明</span>
          </div>

          {/* Row: 注销单 + 注销单备注 + 移交手续 + 移交手续备注 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item label="注销单" name="cancelForm" initialValue="已开">
              <Radio.Group options={openStatusOptions} />
            </Form.Item>
            <Form.Item label="注销单备注" name="cancelFormRemark">
              <TextArea rows={2} placeholder="请输入" />
            </Form.Item>
            <Form.Item label="移交手续" name="handover" initialValue="已移交">
              <Radio.Group options={handoverOptions} />
            </Form.Item>
            <Form.Item label="移交手续备注" name="handoverRemark">
              <TextArea rows={2} placeholder="请输入" />
            </Form.Item>
          </div>

          {/* Row: 回收证明 + 回收证明备注 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Form.Item label="回收证明" name="recycleCert" initialValue="已开">
              <Radio.Group options={openStatusOptions} />
            </Form.Item>
            <Form.Item label="回收证明" name="recycleCertNo">
              <TextArea rows={2} placeholder="请输入" />
            </Form.Item>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <Button type="primary" onClick={handleSubmit} style={{ background: '#13c2c2', borderColor: '#13c2c2', paddingLeft: 32, paddingRight: 32 }}>提交</Button>
            <Button onClick={handleSaveDraft} style={{ paddingLeft: 32, paddingRight: 32 }}>保存草稿</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
