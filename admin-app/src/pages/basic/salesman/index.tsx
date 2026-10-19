import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message } from 'antd';
import {
  PlusOutlined, ExportOutlined, DeleteOutlined,
  HistoryOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  listSalesmen,
  createSalesman,
  updateSalesman,
  removeSalesmen,
  type SalesmanRecord,
} from '@/utils/dictStore';
import { useBasicDictHydrate } from '@/hooks/useBasicDictHydrate';
import BasicJdySyncButton from '@/components/BasicJdySyncButton';
import BasicFuzzyFilter, { filterBasicRows } from '@/components/BasicFuzzyFilter';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

export default function Salesman() {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<SalesmanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalesmanRecord | null>(null);
  const [form] = Form.useForm();

  const refresh = useBasicDictHydrate('salesman', listSalesmen, setRows, setLoading);

  const dataSource = useMemo(
    () => filterBasicRows(rows, searchValue, fieldFilters),
    [rows, searchValue, fieldFilters],
  );

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: SalesmanRecord) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateSalesman(editing.id, values.salesman);
      message.success('修改成功');
    } else {
      createSalesman(values.salesman);
      message.success('提交成功');
    }
    refresh();
    setModalOpen(false);
  };

  const columns: ColumnsType<SalesmanRecord> = [
    { title: '业务员', dataIndex: 'salesman', width: 200 },
    { title: '提交人', dataIndex: 'submitter', width: 120 },
    { title: '提交时间', dataIndex: 'submitTime', width: 160 },
    { title: '更新时间', dataIndex: 'updateTime', width: 160 },
    {
      title: '操作',
      width: 90,
      render: (_: unknown, record: SalesmanRecord) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: isMobile ? '10px 12px' : '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加</Button>
          <BasicJdySyncButton onSynced={refresh} />
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button
            icon={<DeleteOutlined />}
            disabled={!selectedRowKeys.length}
            onClick={() => {
              removeSalesmen(selectedRowKeys.map(Number));
              setSelectedRowKeys([]);
              refresh();
              message.success('删除成功');
            }}
          >
            删除
          </Button>
          <Button icon={<HistoryOutlined />}>操作记录</Button>
        </Space>
        <Space wrap style={{ width: isMobile ? '100%' : undefined }}>
          <BasicFuzzyFilter
            fields={[{ key: 'salesman', label: '业务员' }]}
            keyword={searchValue}
            onKeywordChange={setSearchValue}
            filters={fieldFilters}
            onFiltersChange={setFieldFilters}
            inputWidth={isMobile ? '100%' : 200}
          />
        </Space>
      </div>
      <div style={{ padding: isMobile ? 12 : 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={withMobilePagination(isMobile, { pageSize: 20, showTotal: (t) => `共 ${t} 条` })}
          bordered
          scroll={{ x: 720 }}
        />
      </div>
      <Modal title={editing ? '编辑业务员' : '添加业务员'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="salesman" label="业务员" rules={[{ required: true, message: '请输入业务员' }]}>
            <Input placeholder="请输入业务员姓名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
