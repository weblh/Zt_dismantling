import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Drawer,
  Tabs,
  Timeline,
  Empty,
  Input,
  Button,
  Space,
  Tag,
  Image,
  message,
  Spin,
  Table,
  Row,
  Col,
} from 'antd';
import { PrinterOutlined, PartitionOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getStoredUser } from '@/config/apps';
import {
  addPaymentComment,
  getPaymentComments,
  getPaymentDataLogs,
  getPaymentTimeline,
  type DataLogItem,
  type ProcessTimelineItem,
  type RecordComment,
} from '@/api/paymentApplication';
import PaymentProcessAnalysisModal from '@/components/PaymentProcessAnalysisModal';
import { printPaymentApplication } from '@/utils/printPaymentApplication';

function resolveLocalImage(url?: string): string {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  if (url.startsWith('/images/')) {
    return `${base}${url}`;
  }
  return url.startsWith('/') ? `${base}${url}` : url;
}

function ImageStack({ urls }: { urls?: string[] | string }) {
  const list = (Array.isArray(urls) ? urls : urls ? [urls] : [])
    .map((u) => resolveLocalImage(String(u)))
    .filter(Boolean);
  if (list.length === 0) {
    return <span style={{ color: '#999' }}>-</span>;
  }
  return (
    <Image.PreviewGroup items={list}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {list.slice(0, 6).map((url, i) => (
          <Image
            key={`${url}-${i}`}
            src={url}
            width={72}
            height={54}
            style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }}
          />
        ))}
        {list.length > 6 && <span style={{ color: '#666', fontSize: 12 }}>+{list.length - 6}</span>}
      </div>
    </Image.PreviewGroup>
  );
}

function display(v: unknown) {
  if (v == null || v === '') return '-';
  return String(v);
}

function accountLabel(v?: string) {
  if (v === 'big' || v === '大账户') return '大账户';
  if (v === 'small' || v === '小账户') return '小账户';
  return v || '-';
}

function methodLabel(v?: string) {
  const map: Record<string, string> = { cash: '现金', bank: '电汇', transfer: '承兑' };
  return map[v || ''] || v || '-';
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#262626', fontSize: 14, minHeight: 22 }}>{children}</div>
    </div>
  );
}

export interface PaymentDetailLine {
  key?: number;
  serialNo?: number;
  vehicleVin?: string;
  overweightDate?: string;
  plateNo?: string;
  vehicleType?: string;
  vehicleModel?: string;
  supplier?: string;
  salesman?: string;
  returnLocation?: string;
  tonnage?: string;
  iron?: string;
  aluminum?: string;
  ternary?: string;
  battery?: string;
  kgDiff?: string;
  deductNetWeight?: string;
  deductBattery?: string;
  goodCondition?: string;
  deductTwoBox?: string;
  deductBreadBox?: string;
  deductIronRing?: string;
  deductDiesel?: string;
  selfDelivery?: string;
  deductSmallParts?: string;
  unitPrice?: string;
  totalPrice?: string;
  remark?: string;
}

export interface PaymentDetailRecord {
  id: number;
  dataId?: string;
  date?: string;
  applicant?: string;
  department?: string;
  paymentReason?: string;
  images?: string[] | string;
  image?: string;
  paymentReceipt?: string[] | string;
  processStatus?: string;
  currentNode?: string;
  currentHandler?: string;
  submitter?: string;
  submitTime?: string;
  updateTime?: string;
  details?: PaymentDetailLine[];
  totalAmount?: string;
  totalAmountCapital?: string;
  vehicleCount?: number;
  totalTonnage?: string;
  paymentAccount?: string;
  paymentMethod?: string;
  payeeName1?: string;
  payeeAccount1?: string;
  bankName1?: string;
  bankAccount1?: string;
  payeeName2?: string;
  payeeAccount2?: string;
  bankName2?: string;
  bankAccount2?: string;
  attachments?: string[];
  attachment?: string;
  [key: string]: unknown;
}

interface Props {
  open: boolean;
  record: PaymentDetailRecord | null;
  onClose: () => void;
  autoShowProcess?: boolean;
}

const detailColumns: ColumnsType<PaymentDetailLine> = [
  { title: '序号', dataIndex: 'serialNo', width: 56, fixed: 'left' },
  { title: '编号', dataIndex: 'vehicleVin', width: 90 },
  { title: '过磅日期', dataIndex: 'overweightDate', width: 110 },
  { title: '车牌号', dataIndex: 'plateNo', width: 100 },
  { title: '车辆类型', dataIndex: 'vehicleType', width: 90 },
  { title: '车辆型号', dataIndex: 'vehicleModel', width: 90 },
  { title: '供应商', dataIndex: 'supplier', width: 100 },
  { title: '业务员', dataIndex: 'salesman', width: 80 },
  { title: '回车地', dataIndex: 'returnLocation', width: 80 },
  { title: '吨位', dataIndex: 'tonnage', width: 70 },
  { title: '单价', dataIndex: 'unitPrice', width: 80 },
  { title: '总价', dataIndex: 'totalPrice', width: 80 },
  { title: '备注', dataIndex: 'remark', width: 100, ellipsis: true },
];

export default function PaymentDetailDrawer({ open, record, onClose, autoShowProcess }: Props) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('flow');
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<ProcessTimelineItem[]>([]);
  const [logs, setLogs] = useState<DataLogItem[]>([]);
  const [comments, setComments] = useState<RecordComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);

  const recordKey = record?.dataId || (record?.id != null ? String(record.id) : '');

  const detailRows = useMemo(() => {
    const list = Array.isArray(record?.details) ? record!.details! : [];
    return list.map((d, i) => ({
      ...d,
      key: d.key || i + 1,
      serialNo: d.serialNo || i + 1,
    }));
  }, [record]);

  const displayTimeline = useMemo(() => {
    if (timeline.length > 0) return timeline;
    if (!record) return [];
    const items: ProcessTimelineItem[] = [];
    if (record.submitter || record.submitTime) {
      items.push({
        id: 0,
        recordKey: recordKey || '',
        nodeKey: 'start',
        nodeName: '流程发起节点',
        action: '提交申请',
        operatorName: record.submitter || record.applicant || '-',
        remark: '简道云同步 / 本地记录',
        createdAt: record.submitTime || '',
      });
    }
    if (record.currentNode) {
      items.push({
        id: 1,
        recordKey: recordKey || '',
        nodeKey: 'current',
        nodeName: record.currentNode,
        action: record.processStatus === 'completed' ? '流转完成' : '处理中',
        operatorName: record.currentHandler || '-',
        remark: '',
        createdAt: record.updateTime || '',
      });
    }
    return items;
  }, [timeline, record, recordKey]);

  const loadSide = async () => {
    if (!recordKey) return;
    setLoading(true);
    try {
      const [t, l, c] = await Promise.all([
        getPaymentTimeline(recordKey),
        getPaymentDataLogs(recordKey),
        getPaymentComments(recordKey),
      ]);
      setTimeline(t.data || []);
      setLogs(l.data || []);
      setComments(c.data || []);
    } catch {
      setTimeline([]);
      setLogs([]);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && recordKey) {
      setTab('flow');
      setCommentText('');
      loadSide();
      if (autoShowProcess) setProcessOpen(true);
    } else {
      setProcessOpen(false);
    }
  }, [open, recordKey, autoShowProcess]);

  const handlePostComment = async () => {
    const text = commentText.trim();
    if (!text) {
      message.warning('请输入评论内容');
      return;
    }
    if (!recordKey) return;
    setPosting(true);
    try {
      const user = getStoredUser();
      await addPaymentComment(recordKey, text, user.nickname || user.username || '系统');
      setCommentText('');
      message.success('评论已发表');
      const res = await getPaymentComments(recordKey);
      setComments(res.data || []);
    } catch {
      // interceptor
    } finally {
      setPosting(false);
    }
  };

  const statusTag =
    record?.processStatus === 'completed' ? (
      <Tag color="green">流转完成</Tag>
    ) : (
      <Tag color="orange">处理中</Tag>
    );

  const handlePrint = () => {
    if (!record) return;
    try {
      printPaymentApplication(record as Parameters<typeof printPaymentApplication>[0]);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '打印失败');
    }
  };

  const formPane = (
    <div style={{ padding: isMobile ? '0 4px 16px' : '0 20px 16px 4px' }}>
      <Row gutter={24}>
        <Col xs={24} sm={8}>
          <FieldBlock label="日期">{display(record?.date)}</FieldBlock>
        </Col>
        <Col xs={24} sm={8}>
          <FieldBlock label="申请人">
            <span style={{ color: '#1677ff' }}>{display(record?.applicant)}</span>
          </FieldBlock>
        </Col>
        <Col xs={24} sm={8}>
          <FieldBlock label="部门单选">
            <span style={{ color: '#1677ff' }}>{display(record?.department)}</span>
          </FieldBlock>
        </Col>
      </Row>

      <div style={{ margin: '4px 0 10px', fontWeight: 500, color: '#595959' }}>付款明细</div>
      <Table
        rowKey="key"
        size="small"
        bordered
        pagination={false}
        scroll={{ x: 1200 }}
        columns={detailColumns}
        dataSource={detailRows}
        locale={{ emptyText: '暂无付款明细' }}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={24}>
        <Col xs={24} sm={6}>
          <FieldBlock label="合计金额(小写)">{display(record?.totalAmount)}</FieldBlock>
        </Col>
        <Col xs={24} sm={10}>
          <FieldBlock label="合计金额(大写)">{display(record?.totalAmountCapital)}</FieldBlock>
        </Col>
        <Col xs={12} sm={4}>
          <FieldBlock label="车辆数量">{display(record?.vehicleCount)}</FieldBlock>
        </Col>
        <Col xs={12} sm={4}>
          <FieldBlock label="总吨位">{display(record?.totalTonnage)}</FieldBlock>
        </Col>
      </Row>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '8px 0 14px',
          color: '#faad14',
          fontWeight: 500,
        }}
      >
        付款信息
        <div style={{ flex: 1, height: 1, background: '#ffe58f' }} />
      </div>

      <Row gutter={24}>
        <Col xs={24} sm={6}>
          <FieldBlock label="付款账户">
            {record?.paymentAccount ? (
              <Tag color="gold">{accountLabel(record.paymentAccount)}</Tag>
            ) : (
              '-'
            )}
          </FieldBlock>
        </Col>
        <Col xs={24} sm={6}>
          <FieldBlock label="付款方式">
            {record?.paymentMethod ? (
              <Tag color="gold">{methodLabel(record.paymentMethod)}</Tag>
            ) : (
              '-'
            )}
          </FieldBlock>
        </Col>
        <Col xs={24} sm={6}>
          <FieldBlock label="收款单位1">{display(record?.payeeName1)}</FieldBlock>
        </Col>
        <Col xs={24} sm={6}>
          <FieldBlock label="收款账号1">{display(record?.payeeAccount1)}</FieldBlock>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} sm={6}>
          <FieldBlock label="开户行1">{display(record?.bankName1)}</FieldBlock>
        </Col>
        <Col xs={24} sm={6}>
          <FieldBlock label="银行账号1">{display(record?.bankAccount1)}</FieldBlock>
        </Col>
        <Col xs={24} sm={6}>
          <FieldBlock label="图片">
            <ImageStack urls={record?.images?.length ? record.images : record?.image} />
          </FieldBlock>
        </Col>
        <Col xs={24} sm={6}>
          <FieldBlock label="付款回执单">
            <ImageStack urls={record?.paymentReceipt} />
          </FieldBlock>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={24}>
          <FieldBlock label="付款事由">{display(record?.paymentReason)}</FieldBlock>
        </Col>
      </Row>
    </div>
  );

  const sidePane = (
    <div
      style={{
        width: isMobile ? '100%' : 300,
        flexShrink: 0,
        borderLeft: isMobile ? 'none' : '1px solid #f0f0f0',
        borderTop: isMobile ? '1px solid #f0f0f0' : 'none',
        padding: isMobile ? '12px 0 0' : '0 0 0 16px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: isMobile ? 320 : 'calc(100vh - 160px)',
      }}
    >
      <div style={{ marginBottom: 10, fontSize: 12, color: '#8c8c8c', lineHeight: 1.8 }}>
        <div>提交人：{record?.submitter || '-'}</div>
        <div>提交时间：{record?.submitTime || '-'}</div>
        <div>更新时间：{record?.updateTime || '-'}</div>
        <div>流程状态：{statusTag}</div>
        <div>当前节点：{record?.currentNode || '-'}</div>
        <div>当前负责人：{record?.currentHandler || '-'}</div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Button size="small" icon={<PartitionOutlined />} onClick={() => setProcessOpen(true)}>
          流程图
        </Button>
      </div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        size="small"
        style={{ flex: 1 }}
        items={[
          {
            key: 'flow',
            label: '流程动态',
            children: loading ? (
              <Spin />
            ) : displayTimeline.length === 0 ? (
              <Empty description="暂无流程动态" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ maxHeight: isMobile ? 280 : 'calc(100vh - 360px)', overflow: 'auto', paddingTop: 8 }}>
                <Timeline
                  items={[...displayTimeline].reverse().map((item) => ({
                    color:
                      item.action?.includes('同意') || item.action?.includes('完成')
                        ? 'green'
                        : 'blue',
                    children: (
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {item.nodeName || item.nodeKey}
                          {item.action ? ` · ${item.action}` : ''}
                        </div>
                        <div style={{ color: '#666', fontSize: 12 }}>
                          {item.operatorName || '-'} · {item.createdAt || ''}
                        </div>
                        {item.remark ? (
                          <div style={{ color: '#888', fontSize: 12 }}>{item.remark}</div>
                        ) : null}
                      </div>
                    ),
                  }))}
                />
              </div>
            ),
          },
          {
            key: 'logs',
            label: '数据日志',
            children: loading ? (
              <Spin />
            ) : logs.length === 0 ? (
              <Empty description="暂无数据日志" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ maxHeight: isMobile ? 280 : 'calc(100vh - 360px)', overflow: 'auto', paddingTop: 8 }}>
                <Timeline
                  items={logs.map((item) => ({
                    children: (
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {item.operatorName || '-'} · {item.action || '变更'}
                        </div>
                        <div style={{ color: '#666', fontSize: 12 }}>{item.createdAt || ''}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>{item.summary || ''}</div>
                      </div>
                    ),
                  }))}
                />
              </div>
            ),
          },
          {
            key: 'comments',
            label: '评论',
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 240 }}>
                <div style={{ flex: 1, marginBottom: 12, maxHeight: 220, overflow: 'auto' }}>
                  {loading ? (
                    <Spin />
                  ) : comments.length === 0 ? (
                    <Empty description="暂无评论" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <Timeline
                      items={comments.map((c) => ({
                        children: (
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>
                              {c.authorName || '-'} · {c.createdAt || ''}
                            </div>
                            <div style={{ marginTop: 4 }}>{c.content}</div>
                          </div>
                        ),
                      }))}
                    />
                  )}
                </div>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="发表评论"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onPressEnter={handlePostComment}
                  />
                  <Button type="primary" loading={posting} onClick={handlePostComment}>
                    发送
                  </Button>
                </Space.Compact>
              </div>
            ),
          },
        ]}
      />
    </div>
  );

  return (
    <Drawer
      title={record?.date || '付款申请详情'}
      width={isMobile ? '100%' : '92vw'}
      styles={{
        body: { padding: isMobile ? 12 : '12px 16px 16px', overflow: 'hidden' },
        wrapper: { maxWidth: 1400 },
      }}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button icon={<PartitionOutlined />} onClick={() => setProcessOpen(true)}>
            查看流程
          </Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印
          </Button>
        </Space>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'stretch',
          height: isMobile ? 'auto' : 'calc(100vh - 120px)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'auto',
            paddingRight: isMobile ? 0 : 8,
          }}
        >
          {formPane}
        </div>
        {sidePane}
      </div>

      <PaymentProcessAnalysisModal
        open={processOpen}
        onClose={() => setProcessOpen(false)}
        currentNode={record?.currentNode}
        processStatus={record?.processStatus}
      />
    </Drawer>
  );
}

export { resolveLocalImage, ImageStack };
