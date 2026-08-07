import { Card, Table, Input, Button, Space, message, Modal, Form, DatePicker, InputNumber } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, FilterOutlined, ColumnHeightOutlined, CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

interface DailyItem {
  id: number;
  date: string;
  received: number | null;
  issued: number;
  voided: number | null;
  other: number | null;
  unissued: number;
  remark: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: DailyItem[] = [
  { id: 1, date: '2025-03-25', received: null, issued: 45, voided: null, other: null, unissued: 88, remark: '', submitter: '张明', submitTime: '2025-03-25 19:58:13', updateTime: '2025-03-25 19:58:13' },
  { id: 2, date: '2025-03-24', received: null, issued: 65, voided: 1, other: null, unissued: 133, remark: '晋L8H663，品牌型号打错，未打印纸...', submitter: '张明', submitTime: '2025-03-24 17:33:14', updateTime: '2025-03-24 18:18:00' },
  { id: 3, date: '2025-03-23', received: null, issued: 13, voided: null, other: null, unissued: 198, remark: '', submitter: '张明', submitTime: '2025-03-24 11:41:45', updateTime: '2025-03-24 11:41:45' },
  { id: 4, date: '2025-03-22', received: null, issued: 20, voided: null, other: null, unissued: 211, remark: '', submitter: '张明', submitTime: '2025-03-22 18:25:58', updateTime: '2025-03-22 18:25:58' },
  { id: 5, date: '2025-03-21', received: null, issued: 68, voided: null, other: null, unissued: 231, remark: '', submitter: '张明', submitTime: '2025-03-21 17:38:57', updateTime: '2025-03-21 17:38:57' },
  { id: 6, date: '2025-03-20', received: 300, issued: 31, voided: null, other: null, unissued: 299, remark: '', submitter: '张明', submitTime: '2025-03-20 20:59:08', updateTime: '2025-03-20 20:59:08' },
  { id: 7, date: '2025-03-19', received: null, issued: 47, voided: null, other: null, unissued: 30, remark: '', submitter: '张明', submitTime: '2025-03-19 18:20:46', updateTime: '2025-03-19 18:21:00' },
  { id: 8, date: '2025-03-18', received: null, issued: 73, voided: null, other: null, unissued: 77, remark: '', submitter: '张明', submitTime: '2025-03-18 18:05:05', updateTime: '2025-03-18 18:05:05' },
  { id: 9, date: '2025-03-17', received: null, issued: 66, voided: null, other: null, unissued: 150, remark: '', submitter: '张明', submitTime: '2025-03-18 18:04:47', updateTime: '2025-03-18 18:04:47' },
  { id: 10, date: '2025-03-16', received: null, issued: 40, voided: null, other: null, unissued: 216, remark: '', submitter: '张明', submitTime: '2025-03-16 18:00:28', updateTime: '2025-03-16 18:00:28' },
  { id: 11, date: '2025-03-15', received: null, issued: 44, voided: null, other: null, unissued: 256, remark: '', submitter: '张明', submitTime: '2025-03-15 18:10:41', updateTime: '2025-03-15 18:10:41' },
  { id: 12, date: '2025-03-14', received: 300, issued: 38, voided: null, other: null, unissued: 300, remark: '', submitter: '张明', submitTime: '2025-03-14 18:12:17', updateTime: '2025-03-14 18:12:17' },
  { id: 13, date: '2025-03-13', received: null, issued: 84, voided: null, other: null, unissued: 38, remark: '', submitter: '张明', submitTime: '2025-03-13 17:54:41', updateTime: '2025-03-13 17:54:41' },
  { id: 14, date: '2025-03-12', received: null, issued: 94, voided: null, other: null, unissued: 122, remark: '', submitter: '张明', submitTime: '2025-03-12 18:13:23', updateTime: '2025-03-12 18:13:23' },
  { id: 15, date: '2025-03-11', received: null, issued: 74, voided: null, other: null, unissued: 216, remark: '', submitter: '张明', submitTime: '2025-03-11 17:55:04', updateTime: '2025-03-11 17:55:04' },
  { id: 16, date: '2025-03-10', received: 300, issued: 10, voided: 3, other: null, unissued: 290, remark: '', submitter: '张明', submitTime: '2025-03-11 08:09:20', updateTime: '2025-03-11 08:09:20' },
  { id: 17, date: '2025-03-06', received: null, issued: 57, voided: null, other: null, unissued: 0, remark: '', submitter: '张明', submitTime: '2025-03-06 17:17:58', updateTime: '2025-03-06 17:17:58' },
  { id: 18, date: '2025-03-05', received: null, issued: 56, voided: null, other: null, unissued: 57, remark: '', submitter: '张明', submitTime: '2025-03-05 18:11:55', updateTime: '2025-03-05 18:11:55' },
  { id: 19, date: '2025-03-04', received: null, issued: 58, voided: null, other: null, unissued: 113, remark: '', submitter: '张明', submitTime: '2025-03-05 17:15:59', updateTime: '2025-03-05 17:15:59' },
  { id: 20, date: '2025-03-03', received: null, issued: 66, voided: null, other: null, unissued: 171, remark: '', submitter: '张明', submitTime: '2025-03-03 18:18:17', updateTime: '2025-03-03 18:18:17' },
];

const renderNum = (v: number | null) => v === null || v === undefined ? '' : v;

const columns: ColumnsType<DailyItem> = [
  { title: '日期', dataIndex: 'date', width: 110, fixed: 'left' },
  { title: '回收证明领取数量', dataIndex: 'received', width: 130, align: 'right', render: renderNum },
  { title: '回收证明开具数量', dataIndex: 'issued', width: 130, align: 'right', render: renderNum },
  { title: '作废数量', dataIndex: 'voided', width: 100, align: 'right', render: renderNum },
  { title: '其他', dataIndex: 'other', width: 80, align: 'right', render: renderNum },
  { title: '回收证明未开具数', dataIndex: 'unissued', width: 130, align: 'right', render: renderNum },
  { title: '备注', dataIndex: 'remark', width: 200 },
  { title: '提交人', dataIndex: 'submitter', width: 90, render: (v: string) => <span style={{ color: '#1890ff' }}>{v}</span> },
  { title: '提交时间', dataIndex: 'submitTime', width: 150 },
  { title: '更新时间', dataIndex: 'updateTime', width: 150 },
];

export default function RecycleCertificateDaily() {
  const [searchValue, setSearchValue] = useState('');
  const [dataSource, setDataSource] = useState(mockData);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = () => {
    if (!searchValue) {
      setDataSource(mockData);
    } else {
      setDataSource(mockData.filter(item =>
        item.date.includes(searchValue) ||
        item.submitter.includes(searchValue)
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
    <div style={{ padding: 0, background: '#f5f5f5', minHeight: '100%' }}>
      <Card style={{ margin: 0, borderRadius: 0 }} bodyStyle={{ padding: 0 }} title={null}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} style={{ background: '#13c2c2', borderColor: '#13c2c2' }} onClick={() => setAddOpen(true)}>添加</Button>
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
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            scroll={{ x: 1200 }}
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
        title="山西华成攒碳回收证明台账"
        open={addOpen}
        onCancel={() => { setAddOpen(false); form.resetFields(); }}
        footer={null}
        width={560}
        centered
        closeIcon={<CloseOutlined />}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} suffixIcon={<CalendarOutlined />} />
          </Form.Item>
          <Form.Item label="回收证明领取数量" name="received">
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="回收证明开具数量" name="issued">
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="作废数量" name="voided">
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="其他" name="other">
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="回收证明未开具数" name="unissued">
            <InputNumber style={{ width: '100%' }} placeholder="请填写数值" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <TextArea rows={4} placeholder="请输入" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 16, marginTop: 16 }}>
            <Button type="primary" onClick={handleSubmit} style={{ background: '#13c2c2', borderColor: '#13c2c2', paddingLeft: 32, paddingRight: 32 }}>提交</Button>
            <Button onClick={handleSaveDraft} style={{ paddingLeft: 32, paddingRight: 32 }}>保存草稿</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
