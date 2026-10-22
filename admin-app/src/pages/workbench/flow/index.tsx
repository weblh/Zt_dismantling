import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  FilterOutlined,
  SearchOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import { Empty, Input, Spin, message } from 'antd';
import PaymentDetailDrawer, { type PaymentDetailRecord } from '@/components/PaymentDetailDrawer';
import FinishedProductApprovalDetailDrawer, {
  type FinishedProductApprovalDetailRecord,
} from '@/components/FinishedProductApprovalDetailDrawer';
import PartApprovalDetailDrawer, {
  type PartApprovalDetailRecord,
} from '@/components/PartApprovalDetailDrawer';
import { useWorkbenchFlows } from '../useWorkbenchFlows';
import {
  LAUNCH_CARDS,
  isCompletedStatus,
  isRejectedStatus,
  type FlowTabKey,
  type WorkbenchFlowItem,
} from '../types';
import '../workbench.css';

const SIDE_TABS: { key: FlowTabKey; label: string }[] = [
  { key: 'todo', label: '我的待办' },
  { key: 'initiated', label: '我发起的' },
  { key: 'processed', label: '我处理的' },
  { key: 'cc', label: '抄送我的' },
  { key: 'launch', label: '发起流程' },
  { key: 'delegate', label: '待办委托' },
];

type StatusFilter = 'all' | 'processing' | 'completed' | 'unread' | 'read';

function avatarText(name: string) {
  const n = (name || '').trim();
  return n ? n.slice(0, 1) : 'A';
}

function stampClass(item: WorkbenchFlowItem) {
  if (isRejectedStatus(item.processStatus)) return '';
  if (isCompletedStatus(item.processStatus)) return 'ok';
  return 'ing';
}

function stampText(item: WorkbenchFlowItem) {
  if (isRejectedStatus(item.processStatus)) return '否决';
  if (isCompletedStatus(item.processStatus)) {
    if (item.processStatus.includes('手动结束')) return '手动结束';
    return '已完成';
  }
  return '进行中';
}

export default function WorkbenchFlow() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as FlowTabKey) || 'todo';
  const formFilter = params.get('form') || '';

  const { loading, counts, listFor, formNamesFor, reload } = useWorkbenchFlows();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [detailItem, setDetailItem] = useState<WorkbenchFlowItem | null>(null);

  const setTab = (next: FlowTabKey) => {
    if (next === 'delegate') {
      message.info('待办委托功能即将开放');
      return;
    }
    const nextParams: Record<string, string> = { tab: next };
    setParams(nextParams);
    setStatusFilter('all');
    setKeyword('');
  };

  const setForm = (name: string) => {
    const next: Record<string, string> = { tab };
    if (name) next.form = name;
    setParams(next);
  };

  const listTabs =
    tab === 'todo'
      ? ([{ key: 'all', label: '全部' }] as const)
      : tab === 'cc'
        ? ([
            { key: 'all', label: '全部' },
            { key: 'unread', label: '未读' },
            { key: 'read', label: '已读' },
          ] as const)
        : ([
            { key: 'all', label: '全部' },
            { key: 'processing', label: '进行中' },
            { key: 'completed', label: '已完成' },
          ] as const);

  const rawList = useMemo(() => {
    if (tab === 'launch' || tab === 'delegate') return [];
    return listFor(tab, formFilter || null);
  }, [tab, formFilter, listFor]);

  const displayList = useMemo(() => {
    let list = rawList;
    if (tab !== 'todo' && tab !== 'cc') {
      if (statusFilter === 'processing') {
        list = list.filter((it) => !isCompletedStatus(it.processStatus) && !isRejectedStatus(it.processStatus));
      } else if (statusFilter === 'completed') {
        list = list.filter((it) => isCompletedStatus(it.processStatus) || isRejectedStatus(it.processStatus));
      }
    }
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      list = list.filter((it) => {
        const blob = [
          it.title,
          it.formName,
          it.submitter,
          it.applicant,
          it.currentNode,
          ...it.fields.map((f) => f.value),
        ]
          .join(' ')
          .toLowerCase();
        return blob.includes(kw);
      });
    }
    return list;
  }, [rawList, statusFilter, keyword, tab]);

  const sideFormNames = tab === 'launch' || tab === 'delegate' ? [] : formNamesFor(tab);

  const openDetail = (item: WorkbenchFlowItem) => setDetailItem(item);

  const launch = (path: string) => {
    navigate(`${path}?create=1`);
  };

  const paymentRecord: PaymentDetailRecord | null =
    detailItem?.bizKey === 'payment-application'
      ? {
          ...(detailItem.raw as PaymentDetailRecord),
          id: Number(detailItem.raw.id) || 0,
          dataId: detailItem.dataId,
        }
      : null;

  const finishedRecord: FinishedProductApprovalDetailRecord | null =
    detailItem?.bizKey === 'finished-product-approval'
      ? ({
          ...detailItem.raw,
          dataId: detailItem.dataId,
          key: String(detailItem.raw.key || detailItem.id),
        } as FinishedProductApprovalDetailRecord)
      : null;

  const partRecord: PartApprovalDetailRecord | null =
    detailItem?.bizKey === 'part-approval'
      ? ({
          ...detailItem.raw,
          dataId: detailItem.dataId,
          key: String(detailItem.raw.key || detailItem.id),
        } as PartApprovalDetailRecord)
      : null;

  const mainTitle =
    formFilter ||
    SIDE_TABS.find((t) => t.key === tab)?.label ||
    '流程中心';

  return (
    <div className="wb-flow">
      <aside className="wb-flow-side">
        <div className="wb-flow-side-head">
          <button
            type="button"
            onClick={() => navigate('/workbench')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
            aria-label="返回工作台"
          >
            <ArrowLeftOutlined />
          </button>
          <span className="orange-icon">流</span>
          <span>流程中心</span>
        </div>
        {SIDE_TABS.map((t) => {
          const active = tab === t.key && !formFilter;
          const count =
            t.key === 'todo'
              ? counts.todo
              : t.key === 'initiated'
                ? counts.initiated
                : t.key === 'processed'
                  ? counts.processed
                  : t.key === 'cc'
                    ? counts.cc
                    : 0;
          return (
            <div key={t.key}>
              <div
                className={`wb-side-item${active ? ' active' : ''}`}
                onClick={() => setTab(t.key)}
                role="button"
                tabIndex={0}
              >
                <span>{t.label}</span>
                {t.key === 'todo' && count > 0 ? (
                  <span className="wb-badge">{count > 99 ? '99+' : count}</span>
                ) : null}
                {t.key === 'cc' && count > 0 ? <span className="wb-dot" /> : null}
              </div>
              {tab === t.key &&
                sideFormNames.map((name) => (
                  <div
                    key={name}
                    className={`wb-side-sub${formFilter === name ? ' active' : ''}`}
                    onClick={() => setForm(name)}
                    role="button"
                    tabIndex={0}
                  >
                    {name}
                  </div>
                ))}
            </div>
          );
        })}
      </aside>

      <main className="wb-flow-main">
        {tab === 'launch' ? (
          <div className="wb-launch-panel">
            <LaunchPanel onLaunch={launch} />
          </div>
        ) : tab === 'delegate' ? (
          <Empty description="待办委托功能即将开放" style={{ marginTop: 80 }} />
        ) : (
          <>
            <div className="wb-flow-toolbar">
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{mainTitle}</div>
                <div className="wb-status-tabs">
                  {listTabs.map((t) => {
                    const active = statusFilter === t.key;
                    const countLabel =
                      t.key === 'all'
                        ? displayList.length > 99
                          ? '99+'
                          : String(rawList.length)
                        : '';
                    return (
                      <button
                        key={t.key}
                        type="button"
                        className={`wb-status-tab${active ? ' active' : ''}`}
                        onClick={() => setStatusFilter(t.key as StatusFilter)}
                      >
                        {t.label}
                        {t.key === 'all' && countLabel ? ` (${countLabel})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="搜索流程信息"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ width: 200 }}
                />
                <span style={{ color: '#8c8c8c', fontSize: 13, cursor: 'default' }}>
                  <FilterOutlined /> 筛选
                </span>
                <span style={{ color: '#8c8c8c', fontSize: 13, cursor: 'default' }}>
                  <SortAscendingOutlined /> 排序
                </span>
                <a onClick={() => reload()} style={{ fontSize: 13 }}>
                  刷新
                </a>
              </div>
            </div>

            <Spin spinning={loading} wrapperClassName="wb-flow-spin">
              <div className="wb-flow-list">
                {displayList.length === 0 ? (
                  <Empty description="暂无流程数据" style={{ marginTop: 60 }} />
                ) : (
                  displayList.map((item) => (
                    <div key={item.id} className="wb-card" onClick={() => openDetail(item)} role="button" tabIndex={0}>
                      <div className="wb-card-head">
                        <div>
                          <div className="wb-card-title">{item.title}</div>
                          <div className="wb-card-node">
                            {tab === 'cc' ? '抄送节点' : item.currentNode || item.statusLabel}
                            {item.currentHandler ? `：${item.currentHandler}` : ''}
                          </div>
                        </div>
                        <div className="wb-card-meta">
                          <div>{item.updateTime || item.submitTime || '-'}</div>
                          <span className={`wb-stamp ${stampClass(item)}`}>{stampText(item)}</span>
                        </div>
                      </div>
                      <div className="wb-card-body">
                        <div className="wb-avatar">{avatarText(item.submitter || item.applicant)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ marginBottom: 8, fontSize: 13, color: '#595959' }}>
                            {item.submitter || item.applicant || '-'}
                          </div>
                          <div className="wb-fields">
                            {item.fields.map((f) => (
                              <div key={f.label}>
                                <span className="wb-field-label">{f.label}</span>
                                <span className="wb-field-value">{f.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Spin>
          </>
        )}
      </main>

      <PaymentDetailDrawer
        open={!!paymentRecord}
        record={paymentRecord}
        onClose={() => setDetailItem(null)}
        autoShowProcess
      />
      <FinishedProductApprovalDetailDrawer
        open={!!finishedRecord}
        record={finishedRecord}
        onClose={() => setDetailItem(null)}
        autoShowProcess
      />
      <PartApprovalDetailDrawer
        open={!!partRecord}
        record={partRecord}
        onClose={() => setDetailItem(null)}
        autoShowProcess
      />
    </div>
  );
}

function LaunchPanel({ onLaunch }: { onLaunch: (path: string) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, typeof LAUNCH_CARDS>();
    for (const f of LAUNCH_CARDS) {
      const list = map.get(f.group) || [];
      list.push(f);
      map.set(f.group, list);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 16 }}>发起流程</div>
      {groups.map(([group, forms]) => (
        <div key={group} className="wb-launch-section">
          <div className="wb-launch-group-title">{group}</div>
          <div className="wb-launch-grid">
            {forms.map((f) => (
              <div
                key={f.id}
                className="wb-launch-card"
                onClick={() => onLaunch(f.launchPath)}
                role="button"
                tabIndex={0}
              >
                <div className="wb-launch-card-bar" style={{ background: f.color }} />
                <div className="wb-launch-card-body">
                  <div className="wb-launch-card-name">{f.formName}</div>
                  <div className="wb-launch-card-link">发起流程 &gt;</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
