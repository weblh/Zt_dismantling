import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined,
  HistoryOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  listVehicleModels,
  createVehicleModel,
  updateVehicleModel,
  removeVehicleModels,
  type VehicleModelRecord,
} from '@/utils/dictStore';
import { useBasicDictHydrate } from '@/hooks/useBasicDictHydrate';
import BasicJdySyncButton from '@/components/BasicJdySyncButton';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

export default function VehicleModel() {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<VehicleModelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleModelRecord | null>(null);
  const [form] = Form.useForm();

  const refresh = useBasicDictHydrate('vehicle-model', listVehicleModels, setRows, setLoading);

  const dataSource = useMemo(
    () => filterBasicRows(rows, searchValue, selectedFields),
    [rows, searchValue, selectedFields],
  );

  const columns: ColumnsType<VehicleModelRecord> = [
    { title: '车辆型号', dataIndex: 'vehicleModel', width: 150 },
    { title: '提交人', dataIndex: 'submitter', width: 120, render: (t: string) => <a style={{ color: '#1890ff' }}>{t}</a> },
    { title: '提交时间', dataIndex: 'submitTime', width: 180 },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 },
    {
      title: '操作',
      width: 90,
      render: (_: unknown, record: VehicleModelRecord) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
          setEditing(record);
          form.setFieldsValue(record);
          setModalOpen(true);
        }}>编辑</Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: isMobile ? '10px 12px' : '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>添加</Button>
          <BasicJdySyncButton onSynced={refresh} />
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<DeleteOutlined />} disabled={!selectedRowKeys.length} onClick={() => {
            removeVehicleModels(selectedRowKeys.map(Number));
            setSelectedRowKeys([]);
            refresh();
            message.success('删除成功');
          }}>删除</Button>
          <Button icon={<HistoryOutlined />}>操作记录</Button>
        </Space>
        <Space wrap style={{ width: isMobile ? '100%' : undefined }}>
          <BasicFuzzyFilter
            fields={[{ key: 'vehicleModel', label: '车辆型号' }]}
            keyword={searchValue}
            onKeywordChange={setSearchValue}
            selectedFields={selectedFields}
            onSelectedFieldsChange={setSelectedFields}
            inputWidth={isMobile ? '100%' : 200}
          />
        </Space>
      </div>
      <div style={{ padding: isMobile ? 12 : 16 }}>
        <Table rowKey="id" columns={columns} dataSource={dataSource} loading={loading} rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} pagination={withMobilePagination(isMobile, { pageSize: 20, showTotal: (t) => `共 ${t} 条` })} bordered scroll={{ x: 800 }} />
      </div>
      <Modal
        title={editing ? '编辑车辆型号' : '添加车辆型号'}
        open={modalOpen}
        onOk={async () => {
          const values = await form.validateFields();
          if (editing) {
            updateVehicleModel(editing.id, values.vehicleModel);
            message.success('修改成功');
          } else {
            createVehicleModel(values.vehicleModel);
            message.success('提交成功');
          }
          refresh();
          setModalOpen(false);
        }}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="vehicleModel" label="车辆型号" rules={[{ required: true }]}>
            <Input placeholder="请输入车辆型号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
