import { useCallback, useEffect, useState } from 'react';
import { Card, Table, Button, Form, Input, Row, Col, Tag, message } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getKingdeeSupplierPage,
  type SupplierDetailVO,
} from '@/api/kingdee';
import KingdeeAccountSelect from '@/components/kingdee/KingdeeAccountSelect';
import {
  applyKingdeeAccountToSupplierForm,
  useKingdeeAccountSelect,
} from '@/hooks/useKingdeeAccountSelect';

interface SearchForm {
  accountId?: number;
  supplierNumber?: string;
  supplierName?: string;
  useOrgCode?: string;
}

const documentStatusMap: Record<string, { color: string; label: string }> = {
  A: { color: 'default', label: '创建' },
  B: { color: 'processing', label: '审核中' },
  C: { color: 'success', label: '已审核' },
  D: { color: 'warning', label: '重新审核' },
};

const forbidStatusMap: Record<string, { color: string; label: string }> = {
  A: { color: 'success', label: '未禁用' },
  B: { color: 'error', label: '已禁用' },
};

export default function KingdeeSupplierPage() {
  const [items, setItems] = useState<SupplierDetailVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchForm>({});
  const [form] = Form.useForm<SearchForm>();
  const {
    accounts,
    loading: accountsLoading,
    selectedAccountId,
    setSelectedAccountId,
    selectedAccount,
  } = useKingdeeAccountSelect();

  useEffect(() => {
    if (!selectedAccountId) return;
    applyKingdeeAccountToSupplierForm(selectedAccount, form);
    setSearchParams((prev) => ({
      ...prev,
      accountId: selectedAccountId,
      useOrgCode: selectedAccount?.useOrgCode || prev.useOrgCode || '',
    }));
  }, [selectedAccountId, selectedAccount, form]);

  const fetchItems = useCallback(async () => {
    if (!searchParams.accountId) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const res = await getKingdeeSupplierPage({
        pageNo,
        pageSize,
        accountId: searchParams.accountId,
        supplierNumber: searchParams.supplierNumber,
        supplierName: searchParams.supplierName,
        useOrgCode: searchParams.useOrgCode,
      });
      setItems(res.data.records);
      setTotal(res.data.total);
    } catch {
      message.error('加载金蝶供应商失败');
    } finally {
      setLoading(false);
    }
  }, [pageNo, pageSize, searchParams]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = async () => {
    const values = await form.validateFields();
    setPageNo(1);
    setSearchParams(values);
  };

  const handleReset = () => {
    form.resetFields();
    applyKingdeeAccountToSupplierForm(selectedAccount, form);
    setPageNo(1);
    setSearchParams({
      accountId: selectedAccountId,
      useOrgCode: selectedAccount?.useOrgCode || '',
    });
  };

  const columns: ColumnsType<SupplierDetailVO> = [
    { title: '供应商编码', dataIndex: 'fnumber', width: 140, fixed: 'left' },
    { title: '供应商名称', dataIndex: 'fname', width: 200, ellipsis: true },
    { title: '简称', dataIndex: 'fshortName', width: 120, ellipsis: true },
    { title: '分组', dataIndex: 'fgroupName', width: 120 },
    {
      title: '单据状态',
      dataIndex: 'fdocumentStatus',
      width: 100,
      render: (value?: string) => {
        const status = value ? documentStatusMap[value] : undefined;
        return status ? <Tag color={status.color}>{status.label}</Tag> : value || '-';
      },
    },
    {
      title: '禁用状态',
      dataIndex: 'fforbidStatus',
      width: 100,
      render: (value?: string) => {
        const status = value ? forbidStatusMap[value] : undefined;
        return status ? <Tag color={status.color}>{status.label}</Tag> : value || '-';
      },
    },
    { title: '使用组织', dataIndex: 'fuseOrgName', width: 140, ellipsis: true },
    { title: '联系人', dataIndex: 'fcontact', width: 100 },
    { title: '电话', dataIndex: 'ftel', width: 130 },
    { title: '纳税人识别号', dataIndex: 'ftaxRegisterCode', width: 180, ellipsis: true },
    { title: '地址', dataIndex: 'faddress', width: 200, ellipsis: true },
    { title: '创建日期', dataIndex: 'fcreateDate', width: 170 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="金蝶供应商" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <KingdeeAccountSelect
            accounts={accounts}
            loading={accountsLoading}
            onChange={(id, account) => {
              setSelectedAccountId(id);
              applyKingdeeAccountToSupplierForm(account, form);
            }}
          />
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="供应商编码" name="supplierNumber">
                <Input allowClear placeholder="支持模糊查询" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="供应商名称" name="supplierName">
                <Input allowClear placeholder="支持模糊查询" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="使用组织编码" name="useOrgCode">
                <Input allowClear placeholder="默认取账套配置" />
              </Form.Item>
            </Col>
          </Row>
          <SpaceActions onSearch={handleSearch} onReset={handleReset} onReload={fetchItems} loading={loading} />
        </Form>
      </Card>

      <Card>
        <Table
          rowKey={(record) => `${record.fnumber || ''}-${record.fname || ''}-${record.fuseOrgName || ''}`}
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: 1600 }}
          pagination={{
            current: pageNo,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, size) => {
              setPageNo(page);
              setPageSize(size);
            },
          }}
        />
      </Card>
    </div>
  );
}

function SpaceActions({
  onSearch,
  onReset,
  onReload,
  loading,
}: {
  onSearch: () => void;
  onReset: () => void;
  onReload: () => void;
  loading: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button type="primary" icon={<SearchOutlined />} onClick={onSearch} loading={loading}>
        查询
      </Button>
      <Button onClick={onReset}>重置</Button>
      <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}>
        刷新
      </Button>
    </div>
  );
}
