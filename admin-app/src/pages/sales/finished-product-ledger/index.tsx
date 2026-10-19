import React, { useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, DatePicker, Modal, Form, Radio, InputNumber, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

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
  {
    key: '1', code: 'XS20260803001', deliveryDate: '2026-08-03 18:34:47', syncDate: '2026-08-03 10:10:38',
    carNo: '晋A6TS98', receiver: '冯张', warehouse: '', productName: '底盘料', productNameColor: 'orange',
    model: '', grossWeight: 25.5, tareWeight: 12.3, netWeight: 13.2, contractNo: 'HT20260801',
    unitPrice: 3200, totalPrice: 42240, customer: '丰驰回收', address: '晋中市榆次区',
    contact: '13800000001', paymentStatus: '已回款', outWeight: 13.2, actualAmount: 42240,
    description: '正常销售', submitter: '张三', submitTime: '2026-08-03 18:34:47', updateTime: '2026-08-03 18:34:47'
  },
  {
    key: '2', code: 'XS20260803002', deliveryDate: '2026-08-03 18:35:44', syncDate: '2026-08-03 10:09:20',
    carNo: '晋A6TS98', receiver: '冯张', warehouse: '', productName: '橡胶', productNameColor: 'gold',
    model: '', grossWeight: 15.8, tareWeight: 8.5, netWeight: 7.3, contractNo: 'HT20260802',
    unitPrice: 2800, totalPrice: 20440, customer: '洪洞废品站', address: '临汾市洪洞县',
    contact: '13800000002', paymentStatus: '已回款', outWeight: 7.3, actualAmount: 20440,
    description: '', submitter: '张三', submitTime: '2026-08-03 18:35:44', updateTime: '2026-08-03 18:35:44'
  },
  {
    key: '3', code: 'XS20260802001', deliveryDate: '2026-08-02 18:33:57', syncDate: '2026-08-02 13:39:24',
    carNo: '晋L73813', receiver: '丰驰', warehouse: '', productName: '撕碎料', productNameColor: 'red',
    model: '', grossWeight: 32.1, tareWeight: 15.6, netWeight: 16.5, contractNo: 'HT20260803',
    unitPrice: 2500, totalPrice: 41250, customer: '华成再生', address: '太原市小店区',
    contact: '13800000003', paymentStatus: '未回款', outWeight: 16.5, actualAmount: 0,
    description: '等待客户付款', submitter: '王五', submitTime: '2026-08-02 18:33:57', updateTime: '2026-08-02 18:33:57'
  },
  {
    key: '4', code: 'XS20260801001', deliveryDate: '2026-08-01 16:34:13', syncDate: '2026-08-01 16:43:14',
    carNo: '晋L3456', receiver: '洪洞', warehouse: '', productName: '废钢', productNameColor: 'green',
    model: '', grossWeight: 28.7, tareWeight: 14.2, netWeight: 14.5, contractNo: 'HT20260804',
    unitPrice: 3800, totalPrice: 55100, customer: '冯张回收站', address: '临汾市尧都区',
    contact: '13800000004', paymentStatus: '已回款', outWeight: 14.5, actualAmount: 55100,
    description: '', submitter: '赵六', submitTime: '2026-08-01 16:34:13', updateTime: '2026-08-01 16:34:13'
  },
  {
    key: '5', code: 'XS20260731001', deliveryDate: '2026-07-31 18:21:38', syncDate: '2026-07-31 17:24:05',
    carNo: '晋JRL297', receiver: '丰驰', warehouse: '', productName: '铜线', productNameColor: 'blue',
    model: '', grossWeight: 18.3, tareWeight: 9.1, netWeight: 9.2, contractNo: 'HT20260805',
    unitPrice: 12000, totalPrice: 110400, customer: '华成再生', address: '太原市小店区',
    contact: '13800000005', paymentStatus: '已回款', outWeight: 9.2, actualAmount: 110400,
    description: '高价铜', submitter: '孙八', submitTime: '2026-07-31 18:21:38', updateTime: '2026-07-31 18:21:38'
  },
  {
    key: '6', code: 'XS20260730001', deliveryDate: '2026-07-30 15:18:03', syncDate: '2026-07-30 15:05:55',
    carNo: '晋L11155', receiver: '丰驰', warehouse: '成品库', productName: '铝件', productNameColor: 'cyan',
    model: '破碎', grossWeight: 22.4, tareWeight: 11.8, netWeight: 10.6, contractNo: 'HT20260806',
    unitPrice: 15000, totalPrice: 159000, customer: '洪洞废品站', address: '临汾市洪洞县',
    contact: '13800000006', paymentStatus: '已回款', outWeight: 10.6, actualAmount: 159000,
    description: '', submitter: '王五', submitTime: '2026-07-30 15:18:03', updateTime: '2026-07-30 15:18:03'
  },
  {
    key: '7', code: 'XS20260714001', deliveryDate: '2026-07-14 11:55:09', syncDate: '2026-07-14 09:35:12',
    carNo: '晋L11155', receiver: '华成', warehouse: '成品库', productName: '塑料', productNameColor: 'purple',
    model: '车', grossWeight: 19.6, tareWeight: 10.2, netWeight: 9.4, contractNo: 'HT20260807',
    unitPrice: 3500, totalPrice: 32900, customer: '冯张回收站', address: '临汾市尧都区',
    contact: '13800000007', paymentStatus: '未回款', outWeight: 9.4, actualAmount: 0,
    description: '等待客户付款', submitter: '孙八', submitTime: '2026-07-14 11:55:09', updateTime: '2026-07-14 11:55:09'
  },
  {
    key: '8', code: 'XS20260710001', deliveryDate: '2026-07-10 14:23:15', syncDate: '2026-07-10 10:21:33',
    carNo: '晋A6TS98', receiver: '冯张', warehouse: '', productName: '小件', productNameColor: 'magenta',
    model: '', grossWeight: 26.3, tareWeight: 13.5, netWeight: 12.8, contractNo: 'HT20260808',
    unitPrice: 4200, totalPrice: 53760, customer: '丰驰回收', address: '晋中市榆次区',
    contact: '13800000008', paymentStatus: '已回款', outWeight: 12.8, actualAmount: 53760,
    description: '', submitter: '张三', submitTime: '2026-07-10 14:23:15', updateTime: '2026-07-10 14:23:15'
  },
  {
    key: '9', code: 'XS20260705001', deliveryDate: '2026-07-05 09:15:22', syncDate: '2026-07-05 08:45:00',
    carNo: '晋L3456', receiver: '洪洞', warehouse: '', productName: '其他1', productNameColor: 'geekblue',
    model: '', grossWeight: 21.7, tareWeight: 11.0, netWeight: 10.7, contractNo: 'HT20260809',
    unitPrice: 3000, totalPrice: 32100, customer: '华成再生', address: '太原市小店区',
    contact: '13800000009', paymentStatus: '已回款', outWeight: 10.7, actualAmount: 32100,
    description: '', submitter: '赵六', submitTime: '2026-07-05 09:15:22', updateTime: '2026-07-05 09:15:22'
  },
  {
    key: '10', code: 'XS20260628001', deliveryDate: '2026-06-28 16:42:33', syncDate: '2026-06-28 14:30:15',
    carNo: '晋JRL297', receiver: '丰驰', warehouse: '', productName: '其他3', productNameColor: 'lime',
    model: '', grossWeight: 24.5, tareWeight: 12.6, netWeight: 11.9, contractNo: 'HT20260810',
    unitPrice: 2800, totalPrice: 33320, customer: '冯张回收站', address: '临汾市尧都区',
    contact: '13800000010', paymentStatus: '未回款', outWeight: 11.9, actualAmount: 0,
    description: '客户验收中', submitter: '王五', submitTime: '2026-06-28 16:42:33', updateTime: '2026-06-28 16:42:33'
  },
];

const renderValue = (val: number | string) => {
  if (typeof val === 'string') return val || '-';
  return val.toFixed(2);
};

const columns: ColumnsType<LedgerItem> = [
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>编号</span>,
    dataIndex: 'code',
    width: 150,
    fixed: 'left',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>出货日期</span>,
    dataIndex: 'deliveryDate',
    width: 160,
    sorter: true,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>过磅同步日期</span>,
    dataIndex: 'syncDate',
    width: 160,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>车号</span>,
    dataIndex: 'carNo',
    width: 120,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>收货单位</span>,
    dataIndex: 'receiver',
    width: 100,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>仓库</span>,
    dataIndex: 'warehouse',
    width: 100,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>品名</span>,
    dataIndex: 'productName',
    width: 100,
    render: (val: string, record: LedgerItem) => (
      <Tag color={record.productNameColor}>{val}</Tag>
    ),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>型号</span>,
    dataIndex: 'model',
    width: 80,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>毛重</span>,
    dataIndex: 'grossWeight',
    width: 90,
    align: 'right',
    render: renderValue,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>皮重</span>,
    dataIndex: 'tareWeight',
    width: 90,
    align: 'right',
    render: renderValue,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>净重</span>,
    dataIndex: 'netWeight',
    width: 90,
    align: 'right',
    render: renderValue,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>合同编号</span>,
    dataIndex: 'contractNo',
    width: 130,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>单价(RMB/吨不含税)</span>,
    dataIndex: 'unitPrice',
    width: 160,
    align: 'right',
    render: renderValue,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>总价(含税)</span>,
    dataIndex: 'totalPrice',
    width: 130,
    align: 'right',
    render: (val: number | string) => {
      if (typeof val === 'string') return <span style={{ color: '#999' }}>{val}</span>;
      return <span style={{ color: '#f5222d' }}>{val.toLocaleString()}</span>;
    },
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>客户</span>,
    dataIndex: 'customer',
    width: 120,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>地址</span>,
    dataIndex: 'address',
    width: 140,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>联系方式</span>,
    dataIndex: 'contact',
    width: 120,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>回款情况</span>,
    dataIndex: 'paymentStatus',
    width: 100,
    render: (val: string) => (
      <Tag color={val === '已回款' ? 'green' : 'orange'}>{val}</Tag>
    ),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>出库吨重</span>,
    dataIndex: 'outWeight',
    width: 100,
    align: 'right',
    render: renderValue,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>实际到账金额</span>,
    dataIndex: 'actualAmount',
    width: 130,
    align: 'right',
    render: (val: number | string) => {
      if (typeof val === 'string') return <span style={{ color: '#999' }}>{val}</span>;
      return val > 0 ? <span style={{ color: '#52c41a' }}>{val.toLocaleString()}</span> : '-';
    },
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>情况说明</span>,
    dataIndex: 'description',
    width: 150,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>,
    dataIndex: 'submitTime',
    width: 160,
    sorter: true,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>,
    dataIndex: 'updateTime',
    width: 160,
  },
];

export default function FinishedProductLedger() {
  const isMobile = useIsMobile();
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
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>删除</Button>
          <Button icon={<HistoryOutlined />}>操作记录</Button>
        </Space>
        <Space wrap>
          <Input
            placeholder="搜索数据"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: isMobile ? '100%' : 200 }}
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
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={withMobilePagination(isMobile, {
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSize: 20,
          })}
          bordered
          size="middle"
          scroll={{ x: 3600 }}
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
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#333' }}>成品销售台账</h2>
          <Form
            form={form}
            layout="vertical"
          >
            {/* 第一行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="code"
                label="编号"
                style={{ flex: 1 }}
              >
                <Input placeholder="自动生成无需填写" disabled />
              </Form.Item>
              <Form.Item
                name="deliveryDate"
                label="出货日期"
                rules={[{ required: true, message: '请选择出货日期' }]}
                style={{ flex: 1 }}
              >
                <DatePicker showTime style={{ width: '100%' }} placeholder="请选择" />
              </Form.Item>
            </div>

            {/* 第二行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="syncDate"
                label="过磅同步日期"
                style={{ flex: 1 }}
              >
                <DatePicker showTime style={{ width: '100%' }} placeholder="请选择" />
              </Form.Item>
              <Form.Item
                name="carNo"
                label="车号"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第三行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="receiver"
                label="收货单位"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="warehouse"
                label="仓库"
                style={{ flex: 1 }}
              >
                <Select placeholder="请选择" options={[{ label: '成品库', value: '成品库' }]} />
              </Form.Item>
            </div>

            {/* 品名和型号 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="productName"
                label="品名"
                rules={[{ required: true, message: '请选择品名' }]}
                style={{ flex: 2 }}
              >
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
                      <Radio value="其他1"><Tag color="geekblue">其他1</Tag></Radio>
                      <Radio value="其他2"><Tag color="volcano">其他2</Tag></Radio>
                    </Space>
                    <Space wrap>
                      <Radio value="其他3"><Tag color="lime">其他3</Tag></Radio>
                      <Radio value="其他4"><Tag color="amber">其他4</Tag></Radio>
                      <Radio value="其他5"><Tag color="yellow">其他5</Tag></Radio>
                      <Radio value="其他6"><Tag color="pink">其他6</Tag></Radio>
                    </Space>
                  </Space>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="model"
                label="型号"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第四行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="grossWeight"
                label="毛重"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="tareWeight"
                label="皮重"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="netWeight"
                label="净重"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="contractNo"
                label="合同编号"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第五行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="unitPrice"
                label="单价(RMB/吨不含税)"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="totalPrice"
                label="总价(含税)"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="customer"
                label="客户"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="address"
                label="地址"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </div>

            {/* 第六行 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Form.Item
                name="contact"
                label="联系方式"
                style={{ flex: 1 }}
              >
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item
                name="paymentStatus"
                label="回款情况"
                style={{ flex: 1 }}
              >
                <Select placeholder="请选择" options={[
                  { label: '已回款', value: '已回款' },
                  { label: '未回款', value: '未回款' },
                ]} />
              </Form.Item>
              <Form.Item
                name="outWeight"
                label="出库吨重"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
              <Form.Item
                name="actualAmount"
                label="实际到账金额"
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
              </Form.Item>
            </div>

            {/* 情况说明 */}
            <Form.Item
              name="description"
              label="情况说明"
              style={{ marginBottom: 24 }}
            >
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
