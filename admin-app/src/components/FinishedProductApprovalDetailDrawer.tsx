import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Drawer,
  Tabs,
  Timeline,
  Empty,
  Button,
  Tag,
  Image,
  Row,
  Col,
  Spin,
} from 'antd';
import { PartitionOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import FinishedProductApprovalProcessModal, {
  FINISHED_PRODUCT_APPROVAL_FLOW,
} from '@/components/FinishedProductApprovalProcessModal';
import BizRecordSidePanel from '@/components/BizRecordSidePanel';
import { getBizTimeline, type ProcessTimelineItem } from '@/api/bizRecordMeta';

/** 成品销售审批单真实审批流：发起 → 销售 → 库管 → 财务 → 副总经理（右旁抄送）→ 流程结束 */

function resolveLocalImage(url?: string): string {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  if (url.startsWith('/images/')) return `${base}${url}`;
  return url.startsWith('/') ? `${base}${url}` : url;
}

function ImageStack({ urls }: { urls?: string[] | string | null }) {
  const list = (Array.isArray(urls) ? urls : urls ? [urls] : [])
    .map((u) => resolveLocalImage(String(u)))
    .filter(Boolean);
  if (list.length === 0) return <span style={{ color: '#999' }}>-</span>;
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

function num(v: unknown) {
  if (v == null || v === '') return '-';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#262626', fontSize: 14, minHeight: 22 }}>{children}</div>
    </div>
  );
}

export interface FinishedProductApprovalDetailRecord {
  key?: string;
  id?: number | string;
  dataId?: string;
  code?: string;
  deliveryDate?: string;
  poundNo?: string;
  syncDate?: string;
  carNo?: string;
  receiver?: string;
  warehouse?: string;
  productName?: string;
  productNameColor?: string;
  model?: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  contractNo?: string;
  unitPrice?: number;
  totalPrice?: number;
  customer?: string;
  address?: string;
  contact?: string;
  paymentStatus?: string;
  outWeight?: number;
  timeAmount?: number;
  description?: string;
  remark?: string;
  image?: string[] | string;
  attachment?: string[] | string;
  submitter?: string;
  submitTime?: string;
  updateTime?: string;
  processStatus?: string;
  currentNode?: string;
  currentHandler?: string;
}

interface Props {
  open: boolean;
  record: FinishedProductApprovalDetailRecord | null;
  onClose: () => void;
  autoShowProcess?: boolean;
}

function statusTag(processStatus?: string) {
  const s = (processStatus || '').trim();
  if (s === '已通过' || s === '已完成' || s === 'completed' || s === '流转完成') {
    return <Tag color="green">{s === 'completed' ? '流转完成' : s || '已通过'}</Tag>;
  }
  if (s === '已驳回') return <Tag color="red">已驳回</Tag>;
  if (s === '审批中' || s === 'processing' || s === '处理中') {
    return <Tag color="blue">{s === 'processing' ? '处理中' : s}</Tag>;
  }
  return <Tag>{s || '-'}</Tag>;
}

function buildSyntheticTimeline(record: FinishedProductApprovalDetailRecord | null) {
  if (!record) return [];
  const status = (record.processStatus || '').trim();
  const current = (record.currentNode || '').trim();
  const completed =
    status === '已通过' ||
    status === '已完成' ||
    status === 'completed' ||
    status === '流转完成';
  const rejected = status === '已驳回';
  const order = [...FINISHED_PRODUCT_APPROVAL_FLOW];
  const curIdx = completed
    ? order.length
    : order.findIndex((n) => n === current || current.includes(n));

  return order.map((name, idx) => {
    let action = '未流转';
    let color: 'green' | 'blue' | 'gray' = 'gray';
    if (completed || (curIdx >= 0 && idx < curIdx)) {
      action = idx === 0 ? '已发起' : '已同意';
      color = 'green';
    } else if (curIdx === idx) {
      action = rejected ? '已驳回' : '处理中';
      color = rejected ? 'gray' : 'blue';
    }
    return {
      nodeName: name,
      action,
      color,
      operatorName: idx === curIdx ? record.currentHandler || '-' : '-',
    };
  });
}

const BIZ_KEY = 'finished-product-approval';

export default function FinishedProductApprovalDetailDrawer({
  open,
  record,
  onClose,
  autoShowProcess,
}: Props) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('flow');
  const [processOpen, setProcessOpen] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [apiTimeline, setApiTimeline] = useState<ProcessTimelineItem[]>([]);

  const recordKey = String(record?.dataId || record?.id || record?.key || '');

  useEffect(() => {
    if (open && autoShowProcess) {
      setProcessOpen(true);
    }
  }, [open, autoShowProcess, recordKey]);

  useEffect(() => {
    if (!open) {
      setTab('flow');
      setProcessOpen(false);
      setApiTimeline([]);
      return;
    }
    if (!recordKey) return;
    let cancelled = false;
    (async () => {
      setLoadingTimeline(true);
      try {
        const res = await getBizTimeline(BIZ_KEY, recordKey);
        if (!cancelled) setApiTimeline(res.data || []);
      } catch {
        if (!cancelled) setApiTimeline([]);
      } finally {
        if (!cancelled) setLoadingTimeline(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, recordKey]);

  const syntheticTimeline = useMemo(() => buildSyntheticTimeline(record), [record]);
  const timeline = apiTimeline.length > 0 ? apiTimeline : syntheticTimeline;

  const formPane = (
    <div style={{ paddingBottom: 24 }}>
      <Row gutter={24}>
        <Col xs={24} sm={8}>
          <FieldBlock label="编号">{display(record?.code)}</FieldBlock>
        </Col>
        <Col xs={24} sm={8}>
          <FieldBlock label="出货日期">{display(record?.deliveryDate)}</FieldBlock>
        </Col>
        <Col xs={24} sm={8}>
          <FieldBlock label="磅单号">{display(record?.poundNo)}</FieldBlock>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col xs={24} sm={8}>
          <FieldBlock label="过磅同步日期">{display(record?.syncDate)}</FieldBlock>
        </Col>
        <Col xs={24} sm={8}>
          <FieldBlock label="车号">{display(record?.carNo)}</FieldBlock>
        </Col>
        <Col xs={24} sm={8}>
          <FieldBlock label="收货单位">{display(record?.receiver)}</FieldBlock>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col xs={24} sm={8}>
          <FieldBlock label="仓库">{display(record?.warehouse)}</FieldBlock>
        </Col>
        <Col xs={24} sm={8}>
          <FieldBlock label="品名">
            {record?.productName ? (
              <Tag color={record.productNameColor || 'default'}>{record.productName}</Tag>
            ) : (
              '-'
            )}
          </FieldBlock>
        </Col>
        <Col xs={24} sm={8}>
          <FieldBlock label="型号">{display(record?.model)}</FieldBlock>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col xs={12} sm={6}>
          <FieldBlock label="毛重">{num(record?.grossWeight)}</FieldBlock>
        </Col>
        <Col xs={12} sm={6}>
          <FieldBlock label="皮重">{num(record?.tareWeight)}</FieldBlock>
        </Col>
        <Col xs={12} sm={6}>
          <FieldBlock label="净重">{num(record?.netWeight)}</FieldBlock>
        </Col>
        <Col xs={12} sm={6}>
          <FieldBlock label="合同编号">{display(record?.contractNo)}</FieldBlock>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col xs={12} sm={6}>
          <FieldBlock label="单价(RMB/吨含税)">{num(record?.unitPrice)}</FieldBlock>
        </Col>
        <Col xs={12} sm={6}>
          <FieldBlock label="总价(含税)">{num(record?.totalPrice)}</FieldBlock>
        </Col>
        <Col xs={12} sm={6}>
          <FieldBlock label="客户">{display(record?.customer)}</FieldBlock>
        </Col>
        <Col xs={12} sm={6}>
          <FieldBlock label="联系方式">{display(record?.contact)}</FieldBlock>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col xs={24} sm={8}>
          <FieldBlock label="地址">{display(record?.address)}</FieldBlock>
        </Col>
        <Col xs={12} sm={8}>
          <FieldBlock label="回款情况">{display(record?.paymentStatus)}</FieldBlock>
        </Col>
        <Col xs={12} sm={8}>
          <FieldBlock label="出库吨重">{num(record?.outWeight)}</FieldBlock>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col xs={12} sm={8}>
          <FieldBlock label="时间到账金额">{num(record?.timeAmount)}</FieldBlock>
        </Col>
        <Col xs={24} sm={16}>
          <FieldBlock label="情况说明">
            {display(record?.description || record?.remark)}
          </FieldBlock>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <FieldBlock label="图片">
            <ImageStack urls={record?.image} />
          </FieldBlock>
        </Col>
        <Col xs={24} sm={12}>
          <FieldBlock label="附件">
            <ImageStack urls={record?.attachment} />
          </FieldBlock>
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
        <div>流程状态：{statusTag(record?.processStatus)}</div>
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
            children: loadingTimeline ? (
              <Spin />
            ) : timeline.length === 0 ? (
              <Empty description="暂无流程动态" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div
                style={{
                  maxHeight: isMobile ? 280 : 'calc(100vh - 360px)',
                  overflow: 'auto',
                  paddingTop: 8,
                }}
              >
                <Timeline
                  items={[...timeline].reverse().map((item) => {
                    const action = item.action || '';
                    const color =
                      action.includes('同意') ||
                      action.includes('完成') ||
                      action.includes('发起') ||
                      action.includes('提交') ||
                      action.includes('抄送')
                        ? 'green'
                        : action.includes('处理')
                          ? 'blue'
                          : 'gray';
                    return {
                      color,
                      children: (
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>
                            {item.nodeName}
                            {action ? ` · ${action}` : ''}
                          </div>
                          <div style={{ color: '#666', fontSize: 12 }}>
                            {item.operatorName && item.operatorName !== '-'
                              ? item.operatorName
                              : ''}
                            {item.createdAt ? `${item.operatorName && item.operatorName !== '-' ? ' · ' : ''}${item.createdAt}` : ''}
                          </div>
                        </div>
                      ),
                    };
                  })}
                />
              </div>
            ),
          },
          {
            key: 'meta',
            label: '日志评论',
            children: (
              <BizRecordSidePanel
                bizKey={BIZ_KEY}
                recordKey={recordKey || undefined}
                height={isMobile ? 280 : 'calc(100vh - 360px)'}
              />
            ),
          },
        ]}
      />
    </div>
  );

  return (
    <Drawer
      title={record?.code || '成品销售审批单详情'}
      width={isMobile ? '100%' : '92vw'}
      styles={{
        body: { padding: isMobile ? 12 : '12px 16px 16px', overflow: 'hidden' },
        wrapper: { maxWidth: 1400 },
      }}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Button icon={<PartitionOutlined />} onClick={() => setProcessOpen(true)}>
          查看流程
        </Button>
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

      <FinishedProductApprovalProcessModal
        open={processOpen}
        onClose={() => setProcessOpen(false)}
        currentNode={record?.currentNode}
        processStatus={record?.processStatus}
      />
    </Drawer>
  );
}
