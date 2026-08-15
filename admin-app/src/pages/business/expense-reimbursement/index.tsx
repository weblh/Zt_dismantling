import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Row,
  Col,
  Tag,
  Modal,
  Descriptions,
  message,
  Segmented,
  Tooltip,
} from 'antd';
import { ReloadOutlined, SearchOutlined, EyeOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getExpenseReimbursementItems,
  getExpenseReimbursementItemDetail,
  getReimbursementItems,
  pushExpenseReimbursementToKingdee,
  batchPushExpenseReimbursementToKingdee,
  pushReimbursementToKingdee,
  type ExpenseReimbursementItem,
} from '@/api/expense-reimbursement';
import AttachmentPreviewList from '@/components/AttachmentPreviewList';
import KingdeeScheduledPushAlert from '@/components/kingdee/KingdeeScheduledPushAlert';

interface SearchForm {
  businessId?: string;
  submitterName?: string;
  expenseType?: string;
}

type ViewMode = 'item' | 'approval';

interface ApprovalGroup {
  reimbursementId: number;
  businessId: string;
  submitterName: string;
  department: string;
  totalAmount?: number;
  approvalResult: string;
  createdAt: string;
  itemCount: number;
  items: ExpenseReimbursementItem[];
}

const isKingdeePushed = (record: ExpenseReimbursementItem) => Boolean(record.kingdeeVoucherId);

const isMultiItemApproval = (count?: number) => (count ?? 0) > 1;

const buildApprovalGroups = (items: ExpenseReimbursementItem[]): ApprovalGroup[] => {
  const map = new Map<number, ExpenseReimbursementItem[]>();
  for (const item of items) {
    const list = map.get(item.reimbursementId) ?? [];
    list.push(item);
    map.set(item.reimbursementId, list);
  }
  return Array.from(map.values()).map((groupItems) => {
    const sorted = [...groupItems].sort((a, b) => (a.rowIndex ?? 0) - (b.rowIndex ?? 0));
    const first = sorted[0];
    return {
      reimbursementId: first.reimbursementId,
      businessId: first.businessId,
      submitterName: first.submitterName,
      department: first.department,
      totalAmount: first.totalAmount,
      approvalResult: first.approvalResult,
      createdAt: first.createdAt,
      itemCount: first.reimbursementItemCount ?? sorted.length,
      items: sorted,
    };
  });
};

export default function ExpenseReimbursementPage() {
  const [items, setItems] = useState<ExpenseReimbursementItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchForm>({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [detail, setDetail] = useState<ExpenseReimbursementItem | null>(null);
  const [pushLoadingId, setPushLoadingId] = useState<number | null>(null);
  const [batchPushLoading, setBatchPushLoading] = useState(false);
  const [reimbursementPushLoadingId, setReimbursementPushLoadingId] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedApprovalKeys, setSelectedApprovalKeys] = useState<number[]>([]);
  const [detailPushLoading, setDetailPushLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('item');
  const [approvalItems, setApprovalItems] = useState<ExpenseReimbursementItem[]>([]);
  const [form] = Form.useForm<SearchForm>();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExpenseReimbursementItems({
        pageNo,
        pageSize,
        ...searchParams,
      });
      setItems(res.data.records);
      setTotal(res.data.total);
    } catch {
      message.error('加载费用报销明细失败');
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
    setPageNo(1);
    setSearchParams({});
  };

  const showDetail = async (id: number) => {
    try {
      const res = await getExpenseReimbursementItemDetail(id);
      setDetail(res.data);
      const siblingsRes = await getReimbursementItems(res.data.reimbursementId);
      setApprovalItems(siblingsRes.data);
      setDetailVisible(true);
    } catch {
      message.error('获取详情失败');
    }
  };

  const canPushToKingdee = (record: ExpenseReimbursementItem) =>
    record.approvalResult === 'agree' &&
    record.amount != null &&
    Number(record.amount) > 0 &&
    !isKingdeePushed(record);

  const renderKingdeeStatus = (record: ExpenseReimbursementItem) => {
    if (!isKingdeePushed(record)) {
      const label = record.kingdeePushError ? `未写入：${record.kingdeePushError}` : '未写入';
      if (record.kingdeePushError) {
        return (
          <Tooltip title={record.kingdeePushError}>
            <Tag color="warning" style={{ maxWidth: 220, whiteSpace: 'normal', height: 'auto' }}>
              {label}
            </Tag>
          </Tooltip>
        );
      }
      return <Tag>{label}</Tag>;
    }
    const voucherNo = record.kingdeeVoucherNo || record.kingdeeVoucherId;
    return <Tag color="success">已写入 银{voucherNo}</Tag>;
  };

  const renderApprovalTypeTag = (count?: number) =>
    isMultiItemApproval(count) ? <Tag color="blue">多条明细</Tag> : <Tag>单条明细</Tag>;

  const renderApprovalKingdeeStatus = (groupItems: ExpenseReimbursementItem[]) => {
    const pushed = groupItems.filter(isKingdeePushed);
    if (pushed.length === 0) {
      return <Tag>未写入</Tag>;
    }
    if (pushed.length === groupItems.length) {
      const voucherNo = pushed[0].kingdeeVoucherNo || pushed[0].kingdeeVoucherId;
      return <Tag color="success">已全部写入 银{voucherNo}</Tag>;
    }
    return <Tag color="warning">部分写入 ({pushed.length}/{groupItems.length})</Tag>;
  };

  const renderPushActions = (record: ExpenseReimbursementItem, compact = false) => {
    if (!canPushToKingdee(record)) {
      return null;
    }
    const multi = isMultiItemApproval(record.reimbursementItemCount);
    return (
      <>
        {canPushToKingdee(record) && multi && (
          <Button
            type={compact ? 'link' : 'default'}
            size={compact ? 'small' : 'middle'}
            icon={<CloudUploadOutlined />}
            loading={reimbursementPushLoadingId === record.reimbursementId}
            onClick={() => handleReimbursementPushToKingdee(record.reimbursementId)}
            style={compact ? undefined : { marginRight: 8 }}
          >
            写入本审批全部
          </Button>
        )}
        {canPushToKingdee(record) && (
          <Button
            type={multi ? 'link' : compact ? 'link' : 'primary'}
            size={compact ? 'small' : 'middle'}
            icon={<CloudUploadOutlined />}
            loading={pushLoadingId === record.id}
            onClick={() => handlePushToKingdee(record.id)}
          >
            {multi ? '写入本条' : '写入金蝶'}
          </Button>
        )}
      </>
    );
  };

  const handlePushToKingdee = async (id: number, fromDetail = false) => {
    if (fromDetail) {
      setDetailPushLoading(true);
    } else {
      setPushLoadingId(id);
    }
    try {
      const res = await pushExpenseReimbursementToKingdee(id);
      const voucherNumber = res.data.voucherNumber || res.data.voucherId || '-';
      const action = res.data.savedMode === 'appended' ? '已追加到银字凭证' : '已新建银字凭证';
      message.success(`${action}：${voucherNumber}`);
      await fetchItems();
      setSelectedRowKeys((keys) => keys.filter((key) => key !== id));
      if (fromDetail) {
        const detailRes = await getExpenseReimbursementItemDetail(id);
        setDetail(detailRes.data);
        const siblingsRes = await getReimbursementItems(detailRes.data.reimbursementId);
        setApprovalItems(siblingsRes.data);
      }
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      if (fromDetail) {
        setDetailPushLoading(false);
      } else {
        setPushLoadingId(null);
      }
    }
  };

  const handleBatchPushToKingdee = async () => {
    let idsToPush: number[] = [];
    if (viewMode === 'item') {
      idsToPush = selectedRowKeys;
    } else {
      const selectedGroups = approvalGroups.filter((group) =>
        selectedApprovalKeys.includes(group.reimbursementId),
      );
      idsToPush = selectedGroups.flatMap((group) =>
        group.items.filter(canPushToKingdee).map((item) => item.id),
      );
      idsToPush = Array.from(new Set(idsToPush));
    }

    if (idsToPush.length === 0) {
      message.warning('请先选择要写入的明细');
      return;
    }

    const selectedItems =
      viewMode === 'item'
        ? items.filter((item) => idsToPush.includes(item.id))
        : approvalGroups
            .flatMap((group) => group.items)
            .filter((item) => idsToPush.includes(item.id));
    const importDates = new Set(
      selectedItems.map((item) => (item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD') : '')),
    );
    importDates.delete('');
    if (importDates.size > 1) {
      message.warning('批量写入要求所选明细的入库日期相同');
      return;
    }

    setBatchPushLoading(true);
    try {
      const res = await batchPushExpenseReimbursementToKingdee(idsToPush);
      const voucherNumber = res.data.voucherNumber || res.data.voucherId || '-';
      const action = res.data.savedMode === 'appended' ? '已追加到银字凭证' : '已新建银字凭证';
      const count = res.data.itemCount ?? idsToPush.length;
      message.success(`${action}：${voucherNumber}（共 ${count} 条明细）`);
      setSelectedRowKeys([]);
      setSelectedApprovalKeys([]);
      await fetchItems();
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      setBatchPushLoading(false);
    }
  };

  const handleReimbursementPushToKingdee = async (reimbursementId: number) => {
    setReimbursementPushLoadingId(reimbursementId);
    try {
      const res = await pushReimbursementToKingdee(reimbursementId);
      const voucherNumber = res.data.voucherNumber || res.data.voucherId || '-';
      const action = res.data.savedMode === 'appended' ? '已追加到银字凭证' : '已新建银字凭证';
      const count = res.data.itemCount ?? 0;
      message.success(`${action}：${voucherNumber}（本审批共 ${count} 条明细）`);
      setSelectedRowKeys([]);
      await fetchItems();
      if (detail && detail.reimbursementId === reimbursementId) {
        const detailRes = await getExpenseReimbursementItemDetail(detail.id);
        setDetail(detailRes.data);
        const siblingsRes = await getReimbursementItems(reimbursementId);
        setApprovalItems(siblingsRes.data);
      }
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      setReimbursementPushLoadingId(null);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys.map(Number)),
    getCheckboxProps: (record: ExpenseReimbursementItem) => ({
      disabled: !canPushToKingdee(record),
    }),
  };

  const canPushApprovalGroup = (group: ApprovalGroup) => group.items.some(canPushToKingdee);

  const approvalRowSelection = {
    selectedRowKeys: selectedApprovalKeys,
    onChange: (keys: React.Key[]) => setSelectedApprovalKeys(keys.map(Number)),
    getCheckboxProps: (record: ApprovalGroup) => ({
      disabled: !canPushApprovalGroup(record),
    }),
  };

  const batchSelectedCount =
    viewMode === 'item' ? selectedRowKeys.length : selectedApprovalKeys.length;

  const columns: ColumnsType<ExpenseReimbursementItem> = [
    { title: '业务ID', dataIndex: 'businessId', width: 180, ellipsis: true },
    {
      title: '审批类型',
      width: 100,
      render: (_, record) => renderApprovalTypeTag(record.reimbursementItemCount),
    },
    {
      title: '明细行',
      dataIndex: 'rowIndex',
      width: 80,
      render: (val: number, record) =>
        isMultiItemApproval(record.reimbursementItemCount)
          ? `${val ?? '-'} / ${record.reimbursementItemCount}`
          : val ?? '1',
    },
    { title: '提交人', dataIndex: 'submitterName', width: 100 },
    { title: '部门', dataIndex: 'department', width: 140, ellipsis: true },
    { title: '费用类型', dataIndex: 'expenseType', width: 120 },
    {
      title: '发生日期',
      dataIndex: 'expenseDate',
      width: 120,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      render: (val: number) => (val != null ? `¥${Number(val).toFixed(2)}` : '-'),
    },
    { title: '费用说明', dataIndex: 'description', width: 200, ellipsis: true },
    {
      title: '审批结果',
      dataIndex: 'approvalResult',
      width: 100,
      render: (val: string) => {
        if (!val) return '-';
        const color = val === 'agree' ? 'green' : val === 'refuse' ? 'red' : 'default';
        const label = val === 'agree' ? '同意' : val === 'refuse' ? '拒绝' : val;
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '金蝶状态',
      width: 130,
      render: (_, record) => renderKingdeeStatus(record),
    },
    {
      title: '入库时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <>
          <Button type="link" icon={<EyeOutlined />} onClick={() => showDetail(record.id)}>
            详情
          </Button>
          {renderPushActions(record, true)}
        </>
      ),
    },
  ];

  const nestedItemColumns: ColumnsType<ExpenseReimbursementItem> = [
    {
      title: '行号',
      dataIndex: 'rowIndex',
      width: 70,
      render: (val: number) => val ?? '-',
    },
    { title: '费用类型', dataIndex: 'expenseType', width: 120 },
    {
      title: '发生日期',
      dataIndex: 'expenseDate',
      width: 110,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 110,
      render: (val: number) => (val != null ? `¥${Number(val).toFixed(2)}` : '-'),
    },
    { title: '费用说明', dataIndex: 'description', ellipsis: true },
    {
      title: '金蝶状态',
      width: 130,
      render: (_, record) => renderKingdeeStatus(record),
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <>
          <Button type="link" size="small" onClick={() => showDetail(record.id)}>
            详情
          </Button>
          {canPushToKingdee(record) && (
            <Button
              type="link"
              size="small"
              loading={pushLoadingId === record.id}
              onClick={() => handlePushToKingdee(record.id)}
            >
              写入本条
            </Button>
          )}
        </>
      ),
    },
  ];

  const approvalGroups = buildApprovalGroups(items);

  const approvalColumns: ColumnsType<ApprovalGroup> = [
    { title: '业务ID', dataIndex: 'businessId', width: 180, ellipsis: true },
    {
      title: '审批类型',
      width: 100,
      render: (_, record) => renderApprovalTypeTag(record.itemCount),
    },
    { title: '提交人', dataIndex: 'submitterName', width: 100 },
    {
      title: '明细条数',
      dataIndex: 'itemCount',
      width: 90,
      render: (val: number) => `${val} 条`,
    },
    {
      title: '报销总额',
      dataIndex: 'totalAmount',
      width: 120,
      render: (val: number) => (val != null ? `¥${Number(val).toFixed(2)}` : '-'),
    },
    {
      title: '审批结果',
      dataIndex: 'approvalResult',
      width: 100,
      render: (val: string) => {
        if (!val) return '-';
        const color = val === 'agree' ? 'green' : val === 'refuse' ? 'red' : 'default';
        const label = val === 'agree' ? '同意' : val === 'refuse' ? '拒绝' : val;
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '金蝶状态',
      width: 150,
      render: (_, record) => renderApprovalKingdeeStatus(record.items),
    },
    {
      title: '入库时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const first = record.items[0];
        if (!first) return null;
        const hasPushable = record.items.some(canPushToKingdee);
        if (!hasPushable) {
          return (
            <Button type="link" icon={<EyeOutlined />} onClick={() => showDetail(first.id)}>
              详情
            </Button>
          );
        }
        return (
          <>
            <Button type="link" icon={<EyeOutlined />} onClick={() => showDetail(first.id)}>
              详情
            </Button>
            {isMultiItemApproval(record.itemCount) ? (
              <Button
                type="link"
                icon={<CloudUploadOutlined />}
                loading={reimbursementPushLoadingId === record.reimbursementId}
                onClick={() => handleReimbursementPushToKingdee(record.reimbursementId)}
              >
                写入本审批全部
              </Button>
            ) : (
              <Button
                type="link"
                icon={<CloudUploadOutlined />}
                loading={pushLoadingId === first.id}
                onClick={() => handlePushToKingdee(first.id)}
              >
                写入金蝶
              </Button>
            )}
          </>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <Card title="查询条件" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="业务ID" name="businessId">
                <Input placeholder="请输入业务ID" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="提交人" name="submitterName">
                <Input placeholder="请输入提交人姓名" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="费用类型" name="expenseType">
                <Input placeholder="请输入费用类型" allowClear />
              </Form.Item>
            </Col>
            <Col span={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Form.Item>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} style={{ marginRight: 8 }}>
                  查询
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <KingdeeScheduledPushAlert />

      <Card
        title="费用报销（按审批）"
        extra={
          <>
            <Segmented<ViewMode>
              options={[
                { label: '明细列表', value: 'item' },
                { label: '按审批分组', value: 'approval' },
              ]}
              value={viewMode}
              onChange={(value) => {
                setViewMode(value as ViewMode);
                setSelectedRowKeys([]);
                setSelectedApprovalKeys([]);
              }}
              style={{ marginRight: 8 }}
            />
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={batchPushLoading}
              disabled={batchSelectedCount === 0}
              onClick={handleBatchPushToKingdee}
              style={{ marginRight: 8 }}
            >
              批量写入金蝶{batchSelectedCount > 0 ? ` (${batchSelectedCount})` : ''}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchItems} loading={loading}>
              刷新
            </Button>
          </>
        }
      >
        {viewMode === 'item' ? (
          <Table
            rowKey="id"
            rowSelection={rowSelection}
            columns={columns}
            dataSource={items}
            loading={loading}
            scroll={{ x: 1750 }}
            pagination={{
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条明细`,
              onChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
            }}
          />
        ) : (
          <Table
            rowKey="reimbursementId"
            rowSelection={approvalRowSelection}
            columns={approvalColumns}
            dataSource={approvalGroups}
            loading={loading}
            scroll={{ x: 1400 }}
            expandable={{
              expandedRowRender: (record) => (
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={nestedItemColumns}
                  dataSource={record.items}
                />
              ),
              rowExpandable: (record) => record.itemCount > 0,
            }}
            pagination={{
              current: pageNo,
              pageSize,
              total: approvalGroups.length,
              showSizeChanger: true,
              showTotal: () => `本页 ${approvalGroups.length} 条审批`,
              onChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
            }}
          />
        )}
      </Card>

      <Modal
        title="费用报销明细详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          detail && (canPushToKingdee(detail) || approvalItems.some(canPushToKingdee)) ? (
            <>
              {isMultiItemApproval(detail.reimbursementItemCount) &&
                approvalItems.some(canPushToKingdee) && (
                  <Button
                    icon={<CloudUploadOutlined />}
                    loading={reimbursementPushLoadingId === detail.reimbursementId}
                    onClick={() => handleReimbursementPushToKingdee(detail.reimbursementId)}
                    style={{ marginRight: 8 }}
                  >
                    写入本审批全部明细
                  </Button>
                )}
              {canPushToKingdee(detail) && (
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  loading={detailPushLoading}
                  onClick={() => handlePushToKingdee(detail.id, true)}
                >
                  {isMultiItemApproval(detail.reimbursementItemCount) ? '写入本条明细' : '写入金蝶'}
                </Button>
              )}
            </>
          ) : null
        }
        width={isMultiItemApproval(detail?.reimbursementItemCount) ? 900 : 720}
      >
        {detail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="业务ID">{detail.businessId || '-'}</Descriptions.Item>
            <Descriptions.Item label="审批类型">
              {renderApprovalTypeTag(detail.reimbursementItemCount)}
            </Descriptions.Item>
            <Descriptions.Item label="明细行">
              {isMultiItemApproval(detail.reimbursementItemCount)
                ? `${detail.rowIndex ?? '-'} / ${detail.reimbursementItemCount}`
                : '1'}
            </Descriptions.Item>
            <Descriptions.Item label="提交人">{detail.submitterName || '-'}</Descriptions.Item>
            <Descriptions.Item label="部门">{detail.department || '-'}</Descriptions.Item>
            <Descriptions.Item label="费用类型">{detail.expenseType || '-'}</Descriptions.Item>
            <Descriptions.Item label="发生日期">
              {detail.expenseDate ? dayjs(detail.expenseDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="金额">
              {detail.amount != null ? `¥${Number(detail.amount).toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="总报销金额">
              {detail.totalAmount != null ? `¥${Number(detail.totalAmount).toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="企业主体" span={2}>
              {detail.companyName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="收款账户">
              {detail.bankAccount || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="开户行">
              {detail.bankName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="费用说明" span={2}>
              {detail.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="附件" span={2}>
              <AttachmentPreviewList
                itemId={detail.id}
                attachments={detail.attachments}
                fallbackText={detail.attachmentInfo}
              />
            </Descriptions.Item>
            <Descriptions.Item label="发票信息" span={2}>
              {detail.invoiceInfo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="报销事由" span={2}>
              {detail.reason || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审批结果">
              {detail.approvalResult === 'agree'
                ? '同意'
                : detail.approvalResult === 'refuse'
                  ? '拒绝'
                  : detail.approvalResult || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="金蝶状态">
              {renderKingdeeStatus(detail)}
            </Descriptions.Item>
            <Descriptions.Item label="审批标题" span={2}>
              {detail.title || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审批实例ID" span={2}>
              {detail.processInstanceId || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
        {detail && isMultiItemApproval(detail.reimbursementItemCount) && approvalItems.length > 0 && (
          <Table
            style={{ marginTop: 16 }}
            rowKey="id"
            size="small"
            pagination={false}
            title={() => '本审批全部明细'}
            columns={nestedItemColumns}
            dataSource={approvalItems}
          />
        )}
      </Modal>
    </div>
  );
}
