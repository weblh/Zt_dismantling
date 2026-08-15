import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Upload, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined, FilterOutlined,
  HistoryOutlined, UploadOutlined, ScanOutlined, InboxOutlined, QrcodeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';

interface VinItem {
  key: string;
  vinImage: string;
  vin: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const mockData: VinItem[] = [];

const columns: ColumnsType<VinItem> = [
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>VIN照片</span>,
    dataIndex: 'vinImage',
    width: 100,
    render: () => <span style={{ color: '#1890ff', cursor: 'pointer' }}>查看</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>VIN</span>,
    dataIndex: 'vin',
    width: 180,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>client_id</span>,
    dataIndex: 'clientId',
    width: 150,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>client_secret</span>,
    dataIndex: 'clientSecret',
    width: 150,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>access_token</span>,
    dataIndex: 'accessToken',
    width: 200,
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

export default function VinRecognition() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleAdd = () => {
    form.resetFields();
    setFileList([]);
    setModalOpen(true);
  };

  const handleStartRecognition = () => {
    if (fileList.length === 0) {
      message.error('请先上传VIN照片');
      return;
    }
    message.loading({ content: '正在识别中...', key: 'recognition' });
    setTimeout(() => {
      message.success({ content: '识别完成', key: 'recognition' });
      form.setFieldsValue({ vin: 'LGBH12E09M6784567' });
    }, 1500);
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

  const uploadProps = {
    fileList,
    beforeUpload: (file: UploadFile) => {
      const isLt20M = (file.size ?? 0) / 1024 / 1024 < 20;
      if (!isLt20M) {
        message.error('文件大小不能超过 20MB!');
      }
      return isLt20M || false;
    },
    onChange: ({ fileList: newList }: { fileList: UploadFile[] }) => {
      setFileList(newList.slice(-1));
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
          scroll={{ x: 1200 }}
        />
      </div>

      {/* 添加表单弹窗 */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <div style={{ padding: '0 24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#333' }}>VIN识别</h2>
          <Form form={form} layout="vertical">
            {/* VIN照片上传 */}
            <Form.Item
              name="vinImage"
              label="VIN照片"
              rules={[{ required: true, message: '请上传VIN照片' }]}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Upload.Dragger
                  {...uploadProps}
                  multiple={false}
                  style={{ padding: '16px 0', flex: 1 }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">选择 拖拽或单击后粘贴图片，单张20MB以内</p>
                </Upload.Dragger>
                <Button
                  icon={<QrcodeOutlined />}
                  onClick={() => setQrCodeOpen(true)}
                  style={{ marginTop: 30, height: 40, width: 40 }}
                  title="扫码上传图片"
                />
              </div>
            </Form.Item>

            {/* 开始识别按钮 */}
            <Form.Item>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                onClick={handleStartRecognition}
                size="large"
                style={{ width: 160, background: '#52c41a', borderColor: '#52c41a' }}
              >
                开始识别
              </Button>
            </Form.Item>

            {/* VIN输入 */}
            <Form.Item
              name="vin"
              label="VIN"
              rules={[{ required: true, message: '请输入VIN' }]}
            >
              <Input placeholder="请输入VIN" />
            </Form.Item>

            {/* 底部按钮 */}
            <div style={{ display: 'flex', gap: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', marginTop: 24 }}>
              <Button type="primary" size="large" onClick={() => handleModalOk(false)}>提交</Button>
              <Button size="large" onClick={() => handleModalOk(true)}>保存草稿</Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* 二维码弹窗 */}
      <Modal
        open={qrCodeOpen}
        onCancel={() => setQrCodeOpen(false)}
        footer={null}
        width={320}
        centered
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div
            style={{
              width: 200,
              height: 200,
              margin: '0 auto',
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
              <rect width="180" height="180" fill="#fff" />
              {/* 左上定位标记 */}
              <rect x="10" y="10" width="30" height="30" fill="#000" />
              <rect x="4" y="4" width="42" height="42" fill="none" stroke="#000" strokeWidth="3" />
              <rect x="16" y="16" width="18" height="18" fill="#fff" />
              {/* 右上定位标记 */}
              <rect x="140" y="10" width="30" height="30" fill="#000" />
              <rect x="134" y="4" width="42" height="42" fill="none" stroke="#000" strokeWidth="3" />
              <rect x="146" y="16" width="18" height="18" fill="#fff" />
              {/* 左下定位标记 */}
              <rect x="10" y="140" width="30" height="30" fill="#000" />
              <rect x="4" y="134" width="42" height="42" fill="none" stroke="#000" strokeWidth="3" />
              <rect x="16" y="146" width="18" height="18" fill="#fff" />
              {/* 随机数据模块 */}
              {Array.from({ length: 15 }).map((_, row) =>
                Array.from({ length: 15 }).map((_, col) => {
                  const seed = (row * 31 + col * 17 + 7) % 100;
                  const isFinderArea = (row < 5 && col < 5) || (row < 5 && col > 9) || (row > 9 && col < 5);
                  if (isFinderArea) return null;
                  const size = 8;
                  const x = col * size + 4;
                  const y = row * size + 4;
                  if (seed < 45) {
                    return <rect key={`${row}-${col}`} x={x} y={y} width={size} height={size} fill="#000" />;
                  }
                  return null;
                })
              )}
            </svg>
          </div>
          <p style={{ marginTop: 16, fontSize: 14, color: '#333', fontWeight: 500 }}>扫描二维码，在手机上</p>
          <p style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>选择图片上传</p>
        </div>
      </Modal>
    </div>
  );
}
