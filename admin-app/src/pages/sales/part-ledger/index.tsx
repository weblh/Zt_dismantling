import React, { useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, DatePicker, Modal, Form, Radio, InputNumber, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface LedgerItem {
  key: string;
  code: string;
  deliveryDate: string;
  syncDate: string;
  carNo: string;
  receiver: string;
  warehouse: string;
  productName: string;
  productNameColor: string;
  model: string;
  grossWeight: number | string;
  tareWeight: number | string;
  netWeight: number | string;
  contractNo: string;
  unitPrice: number | string;
  totalPrice: number | string;
  customer: string;
  address: string;
  contact: string;
  paymentStatus: string;
  outWeight: number | string;
  actualAmount: number | string;
  description: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: LedgerItem[] = [
  { key: '1', code: 'XS20260803001', deliveryDate: '2026-08-03 18:03:42', syncDate: '2026.8.3', carNo: '晋LG330M', receiver: '散户', warehouse: '成品库', productName: '塑料', productNameColor: 'purple', model: '尾灯', grossWeight: 0.01, tareWeight: 0, netWeight: 0.01, contractNo: 'HT20260801', unitPrice: 3500, totalPrice: 35, customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: 0.01, actualAmount: 0, description: '', submitter: '张三', submitTime: '2026-08-03 18:03:42', updateTime: '2026-08-03 18:03:42' },
  { key: '2', code: 'XS20260803002', deliveryDate: '2026-08-03 18:02:43', syncDate: '2026.8.3', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '塑料', productNameColor: 'purple', model: '大灯', grossWeight: 0.002, tareWeight: 0, netWeight: 0.002, contractNo: 'HT20260802', unitPrice: 3500, totalPrice: 7, customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: 0.002, actualAmount: 0, description: '', submitter: '张三', submitTime: '2026-08-03 18:02:43', updateTime: '2026-08-03 18:02:43' },
  { key: '3', code: 'XS20260803003', deliveryDate: '2026-08-03 08:55:20', syncDate: '2026.8.3', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '其他6', productNameColor: 'purple', model: '其他1', grossWeight: 0, tareWeight: 0, netWeight: 0, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: 0, description: '', submitter: '王五', submitTime: '2026-08-03 08:55:20', updateTime: '2026-08-03 08:55:20' },
  { key: '4', code: 'XS20260803004', deliveryDate: '2026-08-03 08:54:12', syncDate: '2026.8.3', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '其他3', productNameColor: 'orange', model: '其他3', grossWeight: 0.07, tareWeight: 0, netWeight: 0.07, contractNo: 'HT20260803', unitPrice: 2800, totalPrice: 196, customer: '散户', address: '', contact: '', paymentStatus: '已回款', outWeight: 0.07, actualAmount: 196, description: '', submitter: '王五', submitTime: '2026-08-03 08:54:12', updateTime: '2026-08-03 08:54:12' },
  { key: '5', code: 'XS20260802001', deliveryDate: '2026-08-02 18:15:34', syncDate: '2026.8.2', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '其他6', productNameColor: 'purple', model: '三元切割费', grossWeight: 0, tareWeight: 0, netWeight: 0, contractNo: '', unitPrice: '', totalPrice: '', customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: '', actualAmount: 0, description: '', submitter: '赵六', submitTime: '2026-08-02 18:15:34', updateTime: '2026-08-02 18:15:34' },
  { key: '6', code: 'XS20260802002', deliveryDate: '2026-08-02 18:14:41', syncDate: '2026.8.2', carNo: '晋LG330M', receiver: '散户', warehouse: '成品库', productName: '塑料', productNameColor: 'purple', model: '尾灯', grossWeight: 0.014, tareWeight: 0, netWeight: 0.014, contractNo: 'HT20260804', unitPrice: 3500, totalPrice: 49, customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: 0.014, actualAmount: 0, description: '', submitter: '赵六', submitTime: '2026-08-02 18:14:41', updateTime: '2026-08-02 18:14:41' },
  { key: '7', code: 'XS20260802003', deliveryDate: '2026-08-02 18:13:42', syncDate: '2026.8.2', carNo: '晋LG330M', receiver: '散户', warehouse: '成品库', productName: '铜线', productNameColor: 'blue', model: '电脑板', grossWeight: 0.001, tareWeight: 0, netWeight: 0.001, contractNo: 'HT20260805', unitPrice: 15000, totalPrice: 15, customer: '散户', address: '', contact: '', paymentStatus: '已回款', outWeight: 0.001, actualAmount: 15, description: '', submitter: '赵六', submitTime: '2026-08-02 18:13:42', updateTime: '2026-08-02 18:13:42' },
  { key: '8', code: 'XS20260802004', deliveryDate: '2026-08-02 18:12:16', syncDate: '2026.8.2', carNo: '晋LG330M', receiver: '散户', warehouse: '成品库', productName: '小件', productNameColor: 'magenta', model: 'CD机', grossWeight: 0.002, tareWeight: 0, netWeight: 0.002, contractNo: 'HT20260806', unitPrice: 4200, totalPrice: 8.4, customer: '散户', address: '', contact: '', paymentStatus: '已回款', outWeight: 0.002, actualAmount: 8.4, description: '', submitter: '孙八', submitTime: '2026-08-02 18:12:16', updateTime: '2026-08-02 18:12:16' },
  { key: '9', code: 'XS20260801001', deliveryDate: '2026-08-01 16:41:09', syncDate: '2026.8.1', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '塑料', productNameColor: 'purple', model: '大灯', grossWeight: 0.011, tareWeight: 0, netWeight: 0.011, contractNo: 'HT20260807', unitPrice: 3500, totalPrice: 38.5, customer: '散户', address: '', contact: '', paymentStatus: '未回款', outWeight: 0.011, actualAmount: 0, description: '', submitter: '孙八', submitTime: '2026-08-01 16:41:09', updateTime: '2026-08-01 16:41:09' },
  { key: '10', code: 'XS20260730001', deliveryDate: '2026-07-30 18:37:04', syncDate: '2026.7.30', carNo: '晋L155N5', receiver: '散户', warehouse: '成品库', productName: '其他2', productNameColor: 'green', model: '废汽油', grossWeight: 0.024, tareWeight: 0, netWeight: 0.024, contractNo: 'HT20260808', unitPrice: 2800, totalPrice: 67.2, customer: '散户', address: '', contact: '', paymentStatus: '已回款', outWeight: 0.024, actualAmount: 67.2, description: '', submitter: '王五', submitTime: '2026-07-30 18:37:04', updateTime: '2026-07-30 18:37:04' },
  { key: '11', code: 'XS20260730002', deliveryDate: '2026-07-30 18:30:55', syncDate: '2026.7.30', carNo: '冀67G58', receiver: '散户', warehouse: '成品库', productName: '废钢', productNameColor: 'green', model: '含铝废钢', grossWeight: 0.95, tareWeight: 0, netWeight: 0.95, contractNo: 'HT20260809', unitPrice: 3800, totalPrice: 3610, customer: '华成再生', address: '太原市小店区', contact: '13800000001', paymentStatus: '已回款', outWeight: 0.95, actualAmount: 3610, description: '', submitter: '王五', submitTime: '2026-07-30 18:30:55', updateTime: '2026-07-30 18:30:55' },
  { key: '12', code: 'XS20260729001', deliveryDate: '2026-07-29 08:08:55', syncDate: '2026.7.29', carNo: '晋LEP958', receiver: '散户', warehouse: '成品库', productName: '其他2', productNameColor: 'green', model: '废汽油', grossWeight: 0.048, tareWeight: 0, netWeight: 0.048, contractNo: 'HT20260810', unitPrice: 2800, totalPrice: 134.4, customer: '冯张回收站', address: '临汾市尧都区', contact: '13800000002', paymentStatus: '未回款', outWeight: 0.048, actualAmount: 0, description: '', submitter: '赵六', submitTime: '2026-07-29 08:08:55', updateTime: '2026-07-29 08:08:55' },
  { key: '13', code: 'XS20260715001', deliveryDate: '2026-07-15 09:25:15', syncDate: '2026.7.15', carNo: '晋LG330M', receiver: '散户', warehouse: '成品库', productName: '铜线', productNameColor: 'blue', model: '电脑板', grossWeight: 0.002, tareWeight: 0, netWeight: 0.002, contractNo: 'HT20260811', unitPrice: 15000, totalPrice: 30, customer: '丰驰回收', address: '晋中市榆次区', contact: '13800000003', paymentStatus: '已回款', outWeight: 0.002, actualAmount: 30, description: '', submitter: '孙八', submitTime: '2026-07-15 09:25:15', updateTime: '2026-07-15 09:25:15' },
  { key: '14', code: 'XS20260710001', deliveryDate: '2026-07-10 14:33:25', syncDate: '2026.7.10', carNo: '无', receiver: '散户', warehouse: '成品库', productName: '小件', productNameColor: 'magenta', model: 'CD机', grossWeight: 0.003, tareWeight: 0, netWeight: 0.003, contractNo: 'HT20260812', unitPrice: 4200, totalPrice: 12.6, customer: '洪洞废品站', address: '临汾市洪洞县', contact: '13800000004', paymentStatus: '已回款', outWeight: 0.003, actualAmount: 12.6, description: '', submitter: '张三', submitTime: '2026-07-10 14:33:25', updateTime: '2026-07-10 14:33:25' },
  { key: '15', code: 'XS20260705001', deliveryDate: '2026-07-05 16:45:35', syncDate: '2026.7.5', carNo: '晋L11155', receiver: '散户', warehouse: '成品库', productName: '底盘料', productNameColor: 'orange', model: '其他5', grossWeight: 0.018, tareWeight: 0, netWeight: 0.018, contractNo: 'HT20260813', unitPrice: 3200, totalPrice: 57.6, customer: '华成再生', address: '太原市小店区', contact: '13800000005', paymentStatus: '未回款', outWeight: 0.018, actualAmount: 0, description: '', submitter: '王五', submitTime: '2026-07-05 16:45:35', updateTime: '2026-07-05 16:45:35' },
];

const formatVal = (val: number | string) => {
  if (typeof val === 'string') return val || '-';
  return val.toFixed(val % 1 === 0 ? 0 : 3);
};

const columns: ColumnsType<LedgerItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>, dataIndex: 'code', width: 140, fixed: 'left' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>出货日期</span>, dataIndex: 'deliveryDate', width: 160, sorter: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅同步日期</span>, dataIndex: 'syncDate', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车号</span>, dataIndex: 'carNo', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>收货单位</span>, dataIndex: 'receiver', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>仓库</span>, dataIndex: 'warehouse', width: 90 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>品名</span>,
    dataIndex: 'productName',
    width: 110,
    render: (val: string, record: LedgerItem) => (
      <Tag color={record.productNameColor}>{val}</Tag>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>型号</span>, dataIndex: 'model', width: 100 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>毛重</span>, dataIndex: 'grossWeight', width: 90, align: 'right', render: formatVal },
  { title: <span style={{ whiteSpace: 'nowrap' }}>皮重</span>, dataIndex: 'tareWeight', width: 90, align: 'right', render: formatVal },
  { title: <span style={{ whiteSpace: 'nowrap' }}>净重</span>, dataIndex: 'netWeight', width: 90, align: 'right', render: formatVal },
  { title: <span style={{ whiteSpace: 'nowrap' }}>合同编号</span>, dataIndex: 'contractNo', width: 130 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>单价(RMB/吨不含税)</span>, dataIndex: 'unitPrice', width: 160, align: 'right', render: formatVal },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>总价(含税)</span>,
    dataIndex: 'totalPrice',
    width: 130,
    align: 'right',
    render: (val: number | string) => {
      if (typeof val === 'string' || !val) return '-';
      return <span style={{ color: '#f5222d' }}>{Number(val).toLocaleString()}</span>;
    },
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>客户</span>, dataIndex: 'customer', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>地址</span>, dataIndex: 'address', width: 140 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>联系方式</span>, dataIndex: 'contact', width: 120 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>回款情况</span>,
    dataIndex: 'paymentStatus',
    width: 100,
    render: (val: string) => <Tag color={val === '已回款' ? 'green' : 'orange'}>{val}</Tag>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>出库吨重</span>, dataIndex: 'outWeight', width: 100, align: 'right', render: formatVal },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>实际到账金额</span>,
    dataIndex: 'actualAmount',
    width: 130,
    align: 'right',
    render: (val: number | string) => {
      if (typeof val === 'string' || !val) return '-';
      return <span style={{ color: '#52c41a' }}>{Number(val).toLocaleString()}</span>;
    },
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>情况说明</span>, dataIndex: 'description', width: 150 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 90 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 160, sorter: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 160 },
];

export default function PartLedger() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleModalOk = async (saveDraft: boolean) => {
    try {
      const values = await form.validateFields();
      console.log('表单值:', values, saveDraft);
      message.success(saveDraft ? '草稿保存成功' : '提交成功');
      setModalOpen(false);
    } catch {
      message.error('请填写必要信息');
    }
  };

  return (
    <div className="page-container">
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>删除</Button>
          <Button icon={<HistoryOutlined />}>操作记录</Button>
        </Space>
        <Space>
          <Input
            placeholder="搜索数据"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>筛选</Button>
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={mockData}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条`, pageSize: 20 }}
          bordered
          size="middle"
          scroll={{ x: 3800 }}
        />
      </div>

      {/* 添加表单弹窗 */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <div style={{ padding: '0 24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#333' }}>配件销售台账</h2>
          <Form form={form} layout="vertical">
            {/* 第一行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="code" label="编号" style={{ flex: 1 }}>
                <Input placeholder="自动生成无需填写" disabled />
              </Form.Item>
              <Form.Item name="deliveryDate" label="出货日期" rules={[{ required: true, message: '请选择出货日期' }]} style={{ flex: 1 }}>
                <DatePicker showTime style={{ width: '100%' }} placeholder="请选择" />
              </Form.Item>
              <Form.Item name="syncDate" label="过磅同步日期" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="carNo" label="车号" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第二行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="receiver" label="收货单位" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="warehouse" label="仓库" style={{ flex: 1 }}>
                <Select placeholder="请选择" options={[{ label: '成品库', value: '成品库' }]} />
              </Form.Item>
            </div>

            {/* 品名和型号 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="productName" label="品名" rules={[{ required: true, message: '请选择品名' }]} style={{ flex: 2 }}>
                <Radio.Group>
                  <Space direction="vertical" size={[8, 8]}>
                    <Space wrap>
                      <Radio value="撕碎料"><Tag color="red">撕碎料</Tag></Radio>
                      <Radio value="废钢"><Tag color="green">废钢</Tag></Radio>
                      <Radio value="底盘料"><Tag color="orange">底盘料</Tag></Radio>
                      <Radio value="铜线"><Tag color="blue">铜线</Tag></Radio>
                      <Radio value="铝件"><Tag color="cyan">铝件</Tag></Radio>
                    </Space>
                    <Space wrap>
                      <Radio value="塑料"><Tag color="purple">塑料</Tag></Radio>
                      <Radio value="小件"><Tag color="magenta">小件</Tag></Radio>
                      <Radio value="橡胶"><Tag color="gold">橡胶</Tag></Radio>
                      <Radio value="其他1"><Tag color="default">其他1</Tag></Radio>
                      <Radio value="其他2"><Tag color="green">其他2</Tag></Radio>
                    </Space>
                    <Space wrap>
                      <Radio value="其他3"><Tag color="orange">其他3</Tag></Radio>
                      <Radio value="其他4"><Tag color="green">其他4</Tag></Radio>
                      <Radio value="其他5"><Tag color="cyan">其他5</Tag></Radio>
                      <Radio value="其他6"><Tag color="purple">其他6</Tag></Radio>
                    </Space>
                  </Space>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="model" label="型号" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第三行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="grossWeight" label="毛重" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="tareWeight" label="皮重" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="netWeight" label="净重" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="contractNo" label="合同编号" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第四行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="unitPrice" label="单价(RMB/吨不含税)" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="totalPrice" label="总价(含税)" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="customer" label="客户" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="address" label="地址" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第五行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item name="contact" label="联系方式" style={{ flex: 1 }}>
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item name="paymentStatus" label="回款情况" style={{ flex: 1 }}>
                <Select placeholder="请选择" options={[
                  { label: '已回款', value: '已回款' },
                  { label: '未回款', value: '未回款' },
                ]} />
              </Form.Item>
              <Form.Item name="outWeight" label="出库吨重" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item name="actualAmount" label="实际到账金额" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
            </div>

            {/* 情况说明 */}
            <Form.Item name="description" label="情况说明" style={{ marginBottom: 24 }}>
              <Input.TextArea rows={4} placeholder="请输入情况说明" />
            </Form.Item>

            {/* 底部按钮 */}
            <div style={{ display: 'flex', gap: 16, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
              <Button type="primary" size="large" onClick={() => handleModalOk(false)}>提交</Button>
              <Button size="large" onClick={() => handleModalOk(true)}>保存草稿</Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
