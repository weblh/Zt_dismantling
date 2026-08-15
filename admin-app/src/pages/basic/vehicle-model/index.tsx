import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message, Upload } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined,
  HistoryOutlined, ImportOutlined, InboxOutlined, UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface VehicleModelItem {
  key: string;
  vehicleModel: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: VehicleModelItem[] = [
  { key: '1', vehicleModel: '星马', submitter: '王盼盼', submitTime: '2026-08-04 17:59:22', updateTime: '2026-08-04 17:59:22' },
  { key: '2', vehicleModel: '元永达', submitter: '王盼盼', submitTime: '2026-08-01 18:35:04', updateTime: '2026-08-01 18:35:04' },
  { key: '3', vehicleModel: '莺通', submitter: '冯瑶瑶', submitTime: '2026-07-15 11:43:35', updateTime: '2026-07-15 11:43:35' },
  { key: '4', vehicleModel: '程力', submitter: '冯瑶瑶', submitTime: '2026-07-11 18:16:38', updateTime: '2026-07-11 18:16:38' },
  { key: '5', vehicleModel: '鑫宏达', submitter: '冯瑶瑶', submitTime: '2026-07-10 17:33:20', updateTime: '2026-07-10 17:33:20' },
  { key: '6', vehicleModel: '成事达', submitter: '冯瑶瑶', submitTime: '2026-07-08 17:09:09', updateTime: '2026-07-08 17:09:09' },
  { key: '7', vehicleModel: '京驼', submitter: '冯瑶瑶', submitTime: '2026-07-05 11:39:44', updateTime: '2026-07-05 11:39:44' },
  { key: '8', vehicleModel: '倍特', submitter: '冯瑶瑶', submitTime: '2026-07-04 17:51:03', updateTime: '2026-07-04 17:51:03' },
  { key: '9', vehicleModel: '华佑', submitter: '王盼盼', submitTime: '2026-06-17 18:47:24', updateTime: '2026-06-17 18:47:24' },
  { key: '10', vehicleModel: '德龙', submitter: '王盼盼', submitTime: '2026-06-17 18:43:48', updateTime: '2026-06-17 18:43:48' },
  { key: '11', vehicleModel: '大金马', submitter: '王盼盼', submitTime: '2026-06-15 18:10:00', updateTime: '2026-06-15 18:10:00' },
  { key: '12', vehicleModel: '骏王牌', submitter: '王盼盼', submitTime: '2026-06-15 10:39:20', updateTime: '2026-06-15 10:39:20' },
  { key: '13', vehicleModel: '中联祥晟', submitter: '王盼盼', submitTime: '2026-06-14 17:46:20', updateTime: '2026-06-14 17:46:20' },
  { key: '14', vehicleModel: '龙威', submitter: '王盼盼', submitTime: '2026-06-09 18:19:41', updateTime: '2026-06-09 18:19:41' },
  { key: '15', vehicleModel: '豪爵', submitter: '冯瑶瑶', submitTime: '2026-06-06 17:51:56', updateTime: '2026-06-06 17:51:56' },
  { key: '16', vehicleModel: '麒强', submitter: '冯瑶瑶', submitTime: '2026-06-06 15:49:07', updateTime: '2026-06-06 15:49:07' },
  { key: '17', vehicleModel: '开瑞', submitter: '王盼盼', submitTime: '2026-06-04 15:18:47', updateTime: '2026-06-04 15:18:47' },
  { key: '18', vehicleModel: '骐铃', submitter: '冯瑶瑶', submitTime: '2026-06-01 17:12:42', updateTime: '2026-06-01 17:12:42' },
  { key: '19', vehicleModel: '骏达牌', submitter: '冯瑶瑶', submitTime: '2026-05-29 11:16:23', updateTime: '2026-05-29 11:16:23' },
  { key: '20', vehicleModel: '新日', submitter: '冯瑶瑶', submitTime: '2026-05-07 17:58:21', updateTime: '2026-05-07 17:58:21' },
];

const columns: ColumnsType<VehicleModelItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 150 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>, dataIndex: 'submitter', width: 120, render: (text: string) => <a style={{ color: '#1890ff' }}>{text}</a> },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 180, sorter: true },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 180 },
];

export default function VehicleModel() {
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

  const importProps = {
    accept: '.xlsx,.xls,.csv',
    showUploadList: false,
    beforeUpload: (file: File) => {
      message.loading({ content: '正在导入...', key: 'import' });
      setTimeout(() => {
        message.success({ content: `导入成功，文件: ${file.name}`, key: 'import' });
      }, 1000);
      return false;
    },
  };

  return (
    <div className="page-container">
      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
          <Upload {...importProps}>
            <Button icon={<ImportOutlined />}>导入</Button>
          </Upload>
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
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <div style={{ marginTop: 16, color: '#999' }}>暂无数据</div>
              </div>
            ),
          }}
          scroll={{ x: 630 }}
        />
      </div>

      {/* 添加表单弹窗 */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={500}
        destroyOnClose
      >
        <div style={{ padding: '0 24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#333' }}>车辆型号</h2>
          <Form form={form} layout="vertical">
            <Form.Item
              name="vehicleModel"
              label="车辆型号"
              rules={[{ required: true, message: '请输入车辆型号' }]}
            >
              <Input placeholder="请输入车辆型号" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-start', paddingTop: 24, borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
              <Button type="primary" size="large" onClick={() => handleModalOk(false)} style={{ minWidth: 120 }}>提交</Button>
              <Button size="large" onClick={() => handleModalOk(true)} style={{ minWidth: 120 }}>保存草稿</Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
