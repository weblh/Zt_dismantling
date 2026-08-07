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
  Tooltip,
} from 'antd';
import { ReloadOutlined, SearchOutlined, EyeOutlined, SyncOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getFundUsageApplicationItems,
  getFundUsageApplicationDetail,
  getApplicationItems,
  reparseFundUsageApplications,
  pushFundUsageItemToKingdee,
  batchPushFundUsageItemsToKingdee,
  pushFundUsageApplicationToKingdee,
  type FundUsageApplication,
  type FundUsageApplicationItem,
} from '@/api/fund-usage-application';
import KingdeeScheduledPushAlert from '@/components/kingdee/KingdeeScheduledPushAlert';

interface SearchForm {
  businessId?: string;
  submitterName?: string;
  paymentType?: string;
}

const approvalResultLabel: Record<string, string> = {
  agree: '同意',
  refuse: '拒绝',
};

const SUPPORTED_PAYMENT_TYPES = ['修理费备品备件', '缴纳税', '税费', '采购材料', '倒户'];

const isSupportedPaymentType = (paymentType?: string) =>
  Boolean(paymentType && SUPPORTED_PAYMENT_TYPES.some((keyword) => paymentType.includes(keyword)));

const isKingdeePushed = (record: FundUsageApplicationItem) => Boolean(record.kingdeeVoucherId);

const isMultiItemApplication = (count?: number) => (count ?? 0) > 1;

export default function FundUsageApplicationPage() {
  const [items, setItems] = useState<FundUsageApplicationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [reparseLoading, setReparseLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchForm>({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [detail, setDetail] = useState<FundUsageApplication | null>(null);
  const [applicationItems, setApplicationItems] = useState<FundUsageApplicationItem[]>([]);
  const [pushLoadingId, setPushLoadingId] = useState<number | null>(null);
  const [applicationPushLoadingId, setApplicationPushLoadingId] = useState<number | null>(null);
  const [batchPushLoading, setBatchPushLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [form] = Form.useForm<SearchForm>();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFundUsageApplicationItems({
        pageNo,
        pageSize,
        ...searchParams,
      });
      setItems(res.data.records);
      setTotal(res.data.total);
    } catch {
      message.error('加载资金使用申请明细失败');
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
    setSelectedRowKeys([]);
  };

  const handleReset = () => {
    form.resetFields();
    setPageNo(1);
    setSearchParams({});
    setSelectedRowKeys([]);
  };

  const handleReparse = async () => {
    setReparseLoading(true);
    try {
      const res = await reparseFundUsageApplications();
      message.success(`已重新解析 ${res.data} 条审批数据`);
      setSelectedRowKeys([]);
      fetchItems();
    } catch {
      message.error('重新解析失败');
    } finally {
      setReparseLoading(false);
    }
  };

  const canPushItem = (item: FundUsageApplicationItem) =>
    item.approvalResult === 'agree' &&
    item.amount != null &&
    Number(item.amount) > 0 &&
    isSupportedPaymentType(item.paymentType) &&
    !isKingdeePushed(item);

  const renderKingdeeStatus = (record: FundUsageApplicationItem) => {
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

  const renderApprovalResult = (val: string) => {
    if (!val) return '-';
    const color = val === 'agree' ? 'green' : val === 'refuse' ? 'red' : 'default';
    const label = approvalResultLabel[val] || val;
    return <Tag color={color}>{label}</Tag>;
  };

  const showApplicationDetail = async (applicationId: number) => {
    try {
      const res = await getFundUsageApplicationDetail(applicationId);
      const siblingsRes = await getApplicationItems(applicationId);
      setDetail(res.data);
      setApplicationItems(siblingsRes.data);
      setDetailVisible(true);
    } catch {
      message.error('获取详情失败');
    }
  };

  const handlePushItem = async (id: number) => {
    setPushLoadingId(id);
    try {
      const res = await pushFundUsageItemToKingdee(id);
      const voucherNumber = res.data.voucherNumber || res.data.voucherId || '-';
      const action = res.data.savedMode === 'appended' ? '已追加到银字凭证' : '已新建银字凭证';
      message.success(`${action}：${voucherNumber}`);
      setSelectedRowKeys((keys) => keys.filter((key) => key !== id));
      await fetchItems();
      if (detailVisible && detail) {
        const siblingsRes = await getApplicationItems(detail.id);
        setApplicationItems(siblingsRes.data);
      }
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      setPushLoadingId(null);
    }
  };

  const handleBatchPushToKingdee = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要写入的明细');
      return;
    }

    const selectedItems = items.filter((item) => selectedRowKeys.includes(item.id));
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
      const res = await batchPushFundUsageItemsToKingdee(selectedRowKeys);
      const voucherNumber = res.data.voucherNumber || res.data.voucherId || '-';
      const action = res.data.savedMode === 'appended' ? '已追加到银字凭证' : '已新建银字凭证';
      const count = res.data.itemCount ?? selectedRowKeys.length;
      message.success(`${action}：${voucherNumber}（共 ${count} 条明细）`);
      setSelectedRowKeys([]);
      await fetchItems();
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      setBatchPushLoading(false);
    }
  };

  const handlePushApplication = async (applicationId: number) => {
    setApplicationPushLoadingId(applicationId);
    try {
      const res = await pushFundUsageApplicationToKingdee(applicationId);
      const voucherNumber = res.data.voucherNumber || res.data.voucherId || '-';
      const action = res.data.savedMode === 'appended' ? '已追加到银字凭证' : '已新建银字凭证';
      const count = res.data.itemCount ?? 0;
      message.success(`${action}：${voucherNumber}（本申请共 ${count} 条明细）`);
      setSelectedRowKeys([]);
      await fetchItems();
      if (detailVisible && detail?.id === applicationId) {
        const siblingsRes = await getApplicationItems(applicationId);
        setApplicationItems(siblingsRes.data);
      }
    } catch {
      // 错误提示由 request 拦截器统一处理
    } finally {
      setApplicationPushLoadingId(null);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys.map(Number)),
    getCheckboxProps: (record: FundUsageApplicationItem) => ({
      disabled: !canPushItem(record),
    }),
  };

  const columns: ColumnsType<FundUsageApplicationItem> = [
    { title: '业务ID', dataIndex: 'businessId', width: 180, ellipsis: true },
    {
      title: '明细行',
      dataIndex: 'rowIndex',
      width: 80,
      render: (val: number, record) =>
        isMultiItemApplication(record.applicationItemCount)
          ? `${val ?? '-'} / ${record.applicationItemCount}`
          : val ?? '1',
    },
    { title: '提交人', dataIndex: 'submitterName', width: 100 },
    { title: '部门', dataIndex: 'department', width: 100, ellipsis: true },
    { title: '付款类型', dataIndex: 'paymentType', width: 120 },
    { title: '付款事由', dataIndex: 'paymentReason', width: 180, ellipsis: true },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      render: (val: number) => (val != null ? `¥${Number(val).toFixed(2)}` : '-'),
    },
    { title: '收款单位', dataIndex: 'payeeName', width: 160, ellipsis: true },
    {
      title: '审批结果',
      dataIndex: 'approvalResult',
      width: 100,
      render: renderApprovalResult,
    },
    {
      title: '金蝶状态',
      width: 240,
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <>
          <Button type="link" icon={<EyeOutlined />} onClick={() => showApplicationDetail(record.applicationId)}>
            详情
          </Button>
          {canPushItem(record) && (
            <Button
              type="link"
              icon={<CloudUploadOutlined />}
              loading={pushLoadingId === record.id}
              onClick={() => handlePushItem(record.id)}
            >
              写入金蝶
            </Button>
          )}
        </>
      ),
    },
  ];

  const nestedItemColumns: ColumnsType<FundUsageApplicationItem> = [
    { title: '序号', dataIndex: 'rowIndex', width: 60 },
    { title: '付款类型', dataIndex: 'paymentType', width: 100 },
    { title: '付款事由', dataIndex: 'paymentReason', width: 160, ellipsis: true },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 110,
      render: (val: number) => (val != null ? `¥${Number(val).toFixed(2)}` : '-'),
    },
    { title: '收款单位', dataIndex: 'payeeName', width: 160, ellipsis: true },
    {
      title: '金蝶状态',
      width: 240,
      render: (_, record) => renderKingdeeStatus(record),
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) =>
        canPushItem(record) ? (
          <Button
            type="link"
            size="small"
            loading={pushLoadingId === record.id}
            onClick={() => handlePushItem(record.id)}
          >
            写入
          </Button>
        ) : null,
    },
  ];

  const detailHasPushableItems = applicationItems.some(canPushItem);

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
              <Form.Item label="付款类型" name="paymentType">
                <Input placeholder="请输入付款类型" allowClear />
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
        title="资金使用申请明细"
        extra={
          <>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={batchPushLoading}
              disabled={selectedRowKeys.length === 0}
              onClick={handleBatchPushToKingdee}
              style={{ marginRight: 8 }}
            >
              批量写入金蝶{selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}
            </Button>
            <Button
              icon={<SyncOutlined />}
              onClick={handleReparse}
              loading={reparseLoading}
              style={{ marginRight: 8 }}
            >
              重新解析
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchItems} loading={loading}>
              刷新
            </Button>
          </>
        }
      >
        <Table
          rowKey="id"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: 1800 }}
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
      </Card>

      <Modal
        title="资金使用申请详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          detail && detailHasPushableItems ? (
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={applicationPushLoadingId === detail.id}
              onClick={() => {
                const pushableItems = applicationItems.filter(canPushItem);
                if (pushableItems.length === 1) {
                  handlePushItem(pushableItems[0].id);
                } else {
                  handlePushApplication(detail.id);
                }
              }}
            >
              {applicationItems.filter(canPushItem).length > 1 ? '写入全部明细' : '写入金蝶'}
            </Button>
          ) : null
        }
        width={960}
      >
        {detail && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="业务ID">{detail.businessId || '-'}</Descriptions.Item>
              <Descriptions.Item label="提交人">{detail.submitterName || '-'}</Descriptions.Item>
              <Descriptions.Item label="部门">{detail.department || '-'}</Descriptions.Item>
              <Descriptions.Item label="发起人部门">{detail.originatorDept || '-'}</Descriptions.Item>
              <Descriptions.Item label="付款类型">{detail.paymentType || '-'}</Descriptions.Item>
              <Descriptions.Item label="付款事由">{detail.paymentReason || '-'}</Descriptions.Item>
              <Descriptions.Item label="总金额">
                {detail.totalAmount != null ? `¥${Number(detail.totalAmount).toFixed(2)}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审批结果">{renderApprovalResult(detail.approvalResult)}</Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {detail.submitTime ? dayjs(detail.submitTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {detail.finishTime ? dayjs(detail.finishTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Table
              rowKey="id"
              size="small"
              columns={nestedItemColumns}
              dataSource={applicationItems}
              pagination={false}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
