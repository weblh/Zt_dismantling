import { useState, useEffect, useRef, useCallback } from 'react';
import { DatePicker, Select } from 'antd';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileStatSummary from '@/components/MobileStatSummary';
import { type Dayjs } from 'dayjs';
import {
  getDigitalDashboard,
  type DigitalDashboardData,
  type DashboardKpiCard,
  type ProductionTrendItem,
  type SalesTrendItem,
  type StaffRankingItem,
  type SourceBreakdownItem,
  type SourcePeriodStats,
  type SalesSummary,
  type PartStats,
  type PartCategoryItem,
} from '@/api/dashboard';
import SourceBreakdownModal from '@/components/SourceBreakdownModal';
import {
  DASHBOARD_DATE_PRESET_OPTIONS,
  periodCompareLabels,
  resolveDateRange,
  type DateRangePreset,
} from '@/utils/dateRangePresets';
import './dashboard.css';

function chartMax(values: number[], fallback = 1): number {
  if (values.length === 0) return fallback;
  const max = Math.max(...values);
  return max > 0 ? max : fallback;
}

const EN = {
  kpi: {
    入库车辆: 'Inbound Vehicles',
    收货车辆: 'Receipt Vehicles',
    拆解车辆: 'Disassembled',
    销售金额: 'Sales Amount',
    放油: 'Oil Drain',
    拆解: 'Disassembly',
    综合拆解: 'Full Disassembly',
    月度放油: 'Oil Drain',
    月度拆解: 'Disassembly',
    月度综合拆解: 'Full Disassembly',
  } as Record<string, string>,
  unit: {
    辆: 'units',
    吨: 't',
    万元: '¥10k',
    元: 'CNY',
    '元/吨': 'CNY/t',
  } as Record<string, string>,
};

function kpiEn(title: string) {
  return EN.kpi[title] || '';
}

const emptyKpiCards: DashboardKpiCard[] = [
  { title: '入库车辆', value: 0, unit: '辆', sub: '过磅 0 吨', color: '#1a4f8b' },
  { title: '收货车辆', value: 0, unit: '辆', sub: '', color: '#16365c' },
  { title: '拆解车辆', value: 0, unit: '辆', sub: '', color: '#10233d' },
  { title: '销售金额', value: 0, unit: '万元', sub: '本月 0 万 · 本年 0 万', color: '#1a4f8b' },
  { title: '放油', value: 0, unit: '辆', sub: '', color: '#4ea1e8' },
  { title: '拆解', value: 0, unit: '辆', sub: '', color: '#6ec6ff' },
  { title: '综合拆解', value: 0, unit: '辆', sub: '', color: '#9ec0e6' },
];

const emptyProductionTrend: ProductionTrendItem[] = [];
const emptyProductionSummary = { totalReceipt: 0, totalDisassembly: 0, totalWeight: 0, avgPrice: 0 };
const emptySalesTrend: SalesTrendItem[] = [];
const emptyStaffRanking: StaffRankingItem[] = [];
const emptySalesSummary: SalesSummary = {
  monthAmount: 0, yearAmount: 0, monthWan: 0, yearWan: 0, monthCount: 0, yearCount: 0,
};
const emptyPartStats: PartStats = {
  yearAmount: 0, monthAmount: 0, yearWan: 0, monthWan: 0,
  yearWeight: 0, monthWeight: 0, yearCount: 0, monthCount: 0,
  categoryYear: [], categoryMonth: [],
};

const KPI_ORDER = ['入库车辆', '收货车辆', '拆解车辆', '销售金额', '放油', '拆解', '综合拆解'];
const KPI_TITLE_ALIASES: Record<string, string[]> = {
  放油: ['放油', '月度放油', '累计放油'],
  拆解: ['拆解', '月度拆解', '累计拆解'],
  综合拆解: ['综合拆解', '月度综合拆解', '累计综合拆解'],
};
const KPI_COLORS = ['#4ea1e8', '#9ec0e6', '#6ec6ff', '#4caf82', '#4ea1e8', '#6ec6ff', '#9ec0e6'];

function mergeKpiCards(data: DigitalDashboardData['kpiCards']) {
  const filtered = (data || []).filter((item) => item?.title && !String(item.title).includes('库存总价'));
  const ordered = KPI_ORDER.map((title, i) => {
    const aliases = KPI_TITLE_ALIASES[title] || [title, `累计${title}`];
    const found = filtered.find((item) => aliases.includes(item.title));
    if (!found) return null;
    return {
      ...found,
      title,
      color: KPI_COLORS[i] || found.color || '#1a4f8b',
    };
  }).filter(Boolean) as DashboardKpiCard[];
  return ordered.slice(0, KPI_ORDER.length);
}

function PanelTitle({
  kicker,
  title,
  sub,
  extra,
}: {
  kicker: string;
  title: string;
  sub?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="dash-panel-title">
      <div>
        <p className="kicker">{kicker}</p>
        <h3>{title}</h3>
      </div>
      {extra || (sub ? <span className="sub">{sub}</span> : null)}
    </div>
  );
}

function ProductionTrendChart({ data }: { data: ProductionTrendItem[] }) {
  const W = 560;
  const H = 340;
  const pad = { t: 34, r: 50, b: 36, l: 50 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  if (data.length === 0) {
    return (
      <div className="dash-chart-wrap">
        <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <text x={W / 2} y={H / 2} textAnchor="middle" fill="#8aa0b8" fontSize="14">暂无数据</text>
        </svg>
      </div>
    );
  }

  const maxR = chartMax(data.map((d) => d.receipt));
  const maxW = chartMax(data.map((d) => d.weight));
  const step = cw / data.length;

  const makePath = (key: 'receipt' | 'disassembly' | 'weight') => {
    const values = data.map((d) => (key === 'weight' ? d.weight : d[key]));
    const max = key === 'weight' ? maxW : maxR;
    return values.map((v, i) => {
      const x = pad.l + i * step + step / 2;
      const y = pad.t + ch - (v / max) * ch;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="dash-chart-wrap">
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="dashReceiptFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4ea1e8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4ea1e8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = pad.t + ch * (1 - r);
          return (
            <g key={i}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="rgba(158,192,230,0.18)" strokeDasharray="3,3" />
              <text x={pad.l - 8} y={y} textAnchor="end" dominantBaseline="middle" fill="#8aa0b8" fontSize="12">
                {Math.round(maxR * r)}
              </text>
            </g>
          );
        })}
        <path d={`${makePath('receipt')} L ${pad.l + cw} ${pad.t + ch} L ${pad.l} ${pad.t + ch} Z`} fill="url(#dashReceiptFill)" />
        <path d={makePath('receipt')} fill="none" stroke="#4ea1e8" strokeWidth="2.5" />
        <path d={makePath('disassembly')} fill="none" stroke="#9ec0e6" strokeWidth="2.5" strokeDasharray="6,4" />
        <path d={makePath('weight')} fill="none" stroke="#d4a017" strokeWidth="2" strokeDasharray="3,3" />
        {data.map((d, i) => {
          const x = pad.l + i * step + step / 2;
          const y = pad.t + ch - (d.receipt / maxR) * ch;
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#4ea1e8" stroke="#0c1e33" strokeWidth="1.5" />;
        })}
        {data.map((d, i) => (
          <text key={`m-${i}`} x={pad.l + i * step + step / 2} y={H - 10} textAnchor="middle" fill="#8aa0b8" fontSize="12">
            {d.month}
          </text>
        ))}
        <g transform={`translate(${pad.l}, 10)`}>
          {[
            { label: '收货', color: '#4ea1e8' },
            { label: '拆解', color: '#9ec0e6' },
            { label: '吨重', color: '#d4a017' },
          ].map((l, i) => (
            <g key={l.label} transform={`translate(${i * 88}, 0)`}>
              <rect width="10" height="10" fill={l.color} rx="1" />
              <text x="15" y="9" fill="#8aa0b8" fontSize="12">{l.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function PartStatsPanel({
  data,
  primaryLabel,
  secondaryLabel,
  showSecondary,
}: {
  data: PartStats;
  primaryLabel: string;
  secondaryLabel: string;
  showSecondary: boolean;
}) {
  const [tab, setTab] = useState<'month' | 'year'>('month');
  const categories = tab === 'month'
    ? (data.categoryMonth?.length ? data.categoryMonth : data.categoryYear || [])
    : (data.categoryYear?.length ? data.categoryYear : data.categoryMonth || []);
  const max = chartMax(categories.map((c) => c.amount ?? 0));
  const summaryItems = showSecondary
    ? [
        { label: `${primaryLabel}金额`, value: `${data.monthWan ?? 0}`, unit: '万元' },
        { label: `${secondaryLabel}金额`, value: `${data.yearWan ?? 0}`, unit: '万元' },
        { label: `${primaryLabel}笔数`, value: `${data.monthCount ?? 0}`, unit: '笔' },
        { label: `${secondaryLabel}笔数`, value: `${data.yearCount ?? 0}`, unit: '笔' },
      ]
    : [
        { label: `${primaryLabel}金额`, value: `${data.yearWan ?? data.monthWan ?? 0}`, unit: '万元' },
        { label: `${primaryLabel}笔数`, value: `${data.yearCount ?? data.monthCount ?? 0}`, unit: '笔' },
      ];

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="dash-mini-grid">
        {summaryItems.map((s) => (
          <div key={s.label} className="dash-mini">
            <div className="lbl">{s.label}</div>
            <div className="val">{s.value}<small>{s.unit}</small></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div className="dash-soft-meta">
          {showSecondary
            ? `吨位 · ${primaryLabel} ${data.monthWeight ?? 0}t / ${secondaryLabel} ${data.yearWeight ?? 0}t`
            : `吨位 · ${primaryLabel} ${data.yearWeight ?? data.monthWeight ?? 0}t`}
        </div>
        {showSecondary && (
          <div className="dash-tabs">
            {([
              { key: 'month' as const, label: primaryLabel },
              { key: 'year' as const, label: secondaryLabel },
            ]).map((t) => (
              <button key={t.key} type="button" className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="dash-bar-list dash-scroll">
        {!categories.length ? (
          <div className="dash-empty">暂无分类数据</div>
        ) : (
          categories.map((c: PartCategoryItem, i: number) => {
            const pct = max > 0 ? ((c.amount ?? 0) / max) * 100 : 0;
            return (
              <div key={`${c.name}-${i}`} className="dash-bar-item">
                <div className="row">
                  <span className="name">{c.name}</span>
                  <span className="amt">{c.wan ?? 0} 万</span>
                </div>
                <div className="dash-bar-track">
                  <div className="dash-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SalesBarChart({ data }: { data: SalesTrendItem[] }) {
  const W = 380;
  const H = 150;
  const pad = { t: 24, r: 15, b: 28, l: 55 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  if (data.length === 0) {
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#8aa0b8" fontSize="13">暂无数据</text>
      </svg>
    );
  }

  const max = chartMax(data.map((d) => d.amount ?? 0));
  const bw = (cw / data.length) * 0.55;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="dashSalesBar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4ea1e8" />
          <stop offset="100%" stopColor="#1a4f8b" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
        const y = pad.t + ch * (1 - r);
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="rgba(158,192,230,0.18)" strokeDasharray="3,3" />
            <text x={pad.l - 6} y={y} textAnchor="end" dominantBaseline="middle" fill="#8aa0b8" fontSize="11">
              {(max * r / 10000).toFixed(0)}万
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const amount = d.amount ?? 0;
        const x = pad.l + i * (cw / data.length) + (cw / data.length - bw) / 2;
        const bh = (amount / max) * ch;
        const y = pad.t + ch - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(bh, 0)} fill="url(#dashSalesBar)" rx="2" />
            <text x={x + bw / 2} y={y - 5} textAnchor="middle" fill="#9ec0e6" fontSize="11">
              {(amount / 10000).toFixed(1)}万
            </text>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" fill="#8aa0b8" fontSize="12">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

function RankingChart({ data }: { data: StaffRankingItem[] }) {
  const max = chartMax(data.map((d) => d.monthly));
  if (!data.length) return <div className="dash-empty">暂无排行数据</div>;

  return (
    <div className="dash-bar-list dash-scroll">
      {data.map((s, i) => {
        const pct = (s.monthly / max) * 100;
        return (
          <div key={`${s.name}-${i}`} className="dash-bar-item">
            <div className="row">
              <span className="name">
                <span className={`dash-rank-badge${i < 3 ? ' top' : ''}`}>{i + 1}</span>
                {s.name}
              </span>
              <span className="amt">{s.monthly} 辆</span>
            </div>
            <div className="dash-bar-track">
              <div className="dash-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DigitalDashboard() {
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [datePreset, setDatePreset] = useState<DateRangePreset>('thisYear');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [rangeLabel, setRangeLabel] = useState('今年');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [kpiCards, setKpiCards] = useState<DashboardKpiCard[]>(emptyKpiCards);
  const periodLabels = periodCompareLabels(datePreset);
  const [productionTrend, setProductionTrend] = useState(emptyProductionTrend);
  const [productionSummary, setProductionSummary] = useState(emptyProductionSummary);
  const [salesTrend, setSalesTrend] = useState(emptySalesTrend);
  const [staffRankingMonth, setStaffRankingMonth] = useState(emptyStaffRanking);
  const [staffRankingYear, setStaffRankingYear] = useState(emptyStaffRanking);
  const [staffTab, setStaffTab] = useState<'month' | 'year'>('month');
  const [salesSummary, setSalesSummary] = useState<SalesSummary>(emptySalesSummary);
  const [partStats, setPartStats] = useState<PartStats>(emptyPartStats);
  const [sourcePeriodStats, setSourcePeriodStats] = useState<SourcePeriodStats | null>(null);
  const [breakdown, setBreakdown] = useState<{
    title: string;
    total: number;
    unit: string;
    bySource: SourceBreakdownItem[];
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadDashboard = useCallback(async () => {
    const range = resolveDateRange(datePreset, customRange);
    setRangeLabel(range.label);
    try {
      const res = await getDigitalDashboard({
        startDate: range.start,
        endDate: range.end,
      });
      const data = res.data;
      setKpiCards(mergeKpiCards(data.kpiCards?.length ? data.kpiCards : emptyKpiCards));
      setProductionTrend(data.productionTrend?.length ? data.productionTrend : emptyProductionTrend);
      setProductionSummary(data.productionSummary ?? emptyProductionSummary);
      setSalesTrend(data.salesTrend?.length ? data.salesTrend : emptySalesTrend);
      setStaffRankingMonth(data.staffRankingMonth?.length ? data.staffRankingMonth : (data.staffRanking || emptyStaffRanking));
      setStaffRankingYear(data.staffRankingYear?.length ? data.staffRankingYear : emptyStaffRanking);
      setSalesSummary({
        ...emptySalesSummary,
        ...(data.salesSummary || {}),
        monthWan: data.salesSummary?.monthWan ?? 0,
        yearWan: data.salesSummary?.yearWan ?? 0,
        monthCount: data.salesSummary?.monthCount ?? 0,
        yearCount: data.salesSummary?.yearCount ?? 0,
        monthAmount: data.salesSummary?.monthAmount ?? 0,
        yearAmount: data.salesSummary?.yearAmount ?? 0,
      });
      setPartStats({
        ...emptyPartStats,
        ...(data.partStats || {}),
        monthWan: data.partStats?.monthWan ?? 0,
        yearWan: data.partStats?.yearWan ?? 0,
        monthCount: data.partStats?.monthCount ?? 0,
        yearCount: data.partStats?.yearCount ?? 0,
        categoryMonth: data.partStats?.categoryMonth || [],
        categoryYear: data.partStats?.categoryYear || [],
      });
      setSourcePeriodStats(data.sourcePeriodStats ?? null);
      setLastUpdated(new Date());
    } catch {
      setKpiCards(emptyKpiCards);
      setProductionTrend(emptyProductionTrend);
      setProductionSummary(emptyProductionSummary);
      setSalesTrend(emptySalesTrend);
      setStaffRankingMonth(emptyStaffRanking);
      setStaffRankingYear(emptyStaffRanking);
      setSalesSummary(emptySalesSummary);
      setPartStats(emptyPartStats);
      setSourcePeriodStats(null);
      setLastUpdated(new Date());
    }
  }, [datePreset, customRange]);

  useEffect(() => {
    loadDashboard();
    const refresh = setInterval(loadDashboard, 60000);
    return () => clearInterval(refresh);
  }, [loadDashboard]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  /** 全屏时弹出层必须挂在全屏节点内，否则挂到 body 会点不开 */
  const getPopupContainer = () => {
    if (document.fullscreenElement && containerRef.current) {
      return containerRef.current;
    }
    return document.body;
  };

  return (
    <div ref={containerRef} className={`dash${isMobile ? ' dash--mobile' : ''}`}>
      {isMobile && (
        <div className="dash-mobile-tip">
          经营大屏在手机上可上下浏览。完整图表与全屏看板请使用电脑打开。
        </div>
      )}

      <header className="dash-hero">
        <div className="dash-hero-glow" aria-hidden="true" />
        <div className="dash-brand">
          <div className="dash-mark" aria-hidden="true" />
          <div>
            <strong>华成攒碳 · 经营可视大屏</strong>
            <em>山西华成攒碳汽车拆解 · Operations</em>
          </div>
        </div>
        <div className="dash-hero-meta">
          <Select
            value={datePreset}
            onChange={(value: DateRangePreset) => setDatePreset(value)}
            options={DASHBOARD_DATE_PRESET_OPTIONS}
            style={{ width: 128 }}
            size="small"
            popupMatchSelectWidth={false}
            getPopupContainer={getPopupContainer}
          />
          {datePreset === 'custom' && (
            <DatePicker.RangePicker
              value={customRange}
              onChange={(dates) => setCustomRange(dates as [Dayjs, Dayjs] | null)}
              allowClear={false}
              size="small"
              getPopupContainer={getPopupContainer}
            />
          )}
          <span className="dash-chip">{rangeLabel}</span>
          <span className="dash-chip">
            数据更新 {lastUpdated
              ? lastUpdated.toLocaleString('zh-CN', { hour12: false })
              : '--'}
          </span>
          <button
            type="button"
            className="dash-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? '退出全屏' : '全屏展示'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {isFullscreen ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M3 8V5a2 2 0 0 1 2-2h3m13 0h-3a2 2 0 0 0-2 2v3m0 13v-3a2 2 0 0 1 2-2h3M5 16v3a2 2 0 0 0 2 2h3"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            <span>{isFullscreen ? '退出全屏' : '全屏'}</span>
          </button>
        </div>
      </header>

      <section className="dash-kpi">
        {kpiCards.map((k, i) => {
          const clickable = !!k.bySource?.length;
          return (
            <article
              key={`${k.title}-${i}`}
              className={`dash-kpi-card${clickable ? ' dash-kpi-card--click' : ''}`}
              onClick={clickable ? () => setBreakdown({
                title: k.title,
                total: k.value,
                unit: k.unit,
                bySource: k.bySource || [],
              }) : undefined}
              title={clickable ? '点击查看来源明细' : undefined}
            >
              <div className="dash-kpi-label">{k.title}</div>
              {kpiEn(k.title) && <div className="dash-kpi-en">{kpiEn(k.title)}</div>}
              <div className="dash-kpi-value">
                <b style={{ color: k.color }}>
                  {typeof k.value === 'number' && k.value % 1 !== 0
                    ? k.value.toFixed(1)
                    : k.value.toLocaleString()}
                </b>
                <span>
                  {k.unit}
                  {EN.unit[k.unit] ? ` / ${EN.unit[k.unit]}` : ''}
                </span>
              </div>
              <div className="dash-kpi-sub">{k.sub || rangeLabel}</div>
              {clickable && <div className="dash-kpi-hint">收车 + 议价 · 点击查看来源</div>}
            </article>
          );
        })}
      </section>

      <section className="dash-sources">
        {([
          { key: 'receipt' as const, title: '收车系统' },
          { key: 'pricing' as const, title: '议价系统' },
        ]).map((src) => {
          const receipt = sourcePeriodStats?.receipt?.[src.key];
          const inbound = sourcePeriodStats?.inbound?.[src.key];
          const receiptPrimary = periodLabels.showSecondary ? (receipt?.month ?? 0) : (receipt?.year ?? receipt?.month ?? 0);
          const inboundPrimary = periodLabels.showSecondary ? (inbound?.month ?? 0) : (inbound?.year ?? inbound?.month ?? 0);
          return (
            <div key={src.key} className="dash-source">
              <div className="dash-source-head">
                <strong>{src.title}</strong>
                <span>{periodLabels.head}</span>
              </div>
              <div className="dash-source-grid">
                <div>
                  <div className="lbl">收货 · {periodLabels.primary}</div>
                  <div className="num">{receiptPrimary.toLocaleString()}</div>
                  {periodLabels.showSecondary && (
                    <div className="yr">{periodLabels.secondary} {(receipt?.year ?? 0).toLocaleString()}</div>
                  )}
                </div>
                <div>
                  <div className="lbl">入库 · {periodLabels.primary}</div>
                  <div className="num">{inboundPrimary.toLocaleString()}</div>
                  {periodLabels.showSecondary && (
                    <div className="yr">{periodLabels.secondary} {(inbound?.year ?? 0).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {isMobile && (
        <MobileStatSummary
          title="经营概览"
          hint="趋势图、配件分布和业务员排行请使用电脑查看。"
          items={[
            { label: '总收货', value: productionSummary.totalReceipt.toLocaleString(), unit: '辆', color: '#1a4f8b' },
            { label: '总拆解', value: productionSummary.totalDisassembly.toLocaleString(), unit: '辆', color: '#16365c' },
            { label: '总吨位', value: productionSummary.totalWeight.toLocaleString(), unit: '吨', color: '#a86b1a' },
            {
              label: `${periodLabels.primary}销售`,
              value: periodLabels.showSecondary ? salesSummary.monthWan : (salesSummary.yearWan ?? salesSummary.monthWan),
              unit: '万元',
              color: '#10233d',
            },
          ]}
        />
      )}

      <section className="dash-main">
        <div className="dash-col">
          <div className="dash-panel">
            <PanelTitle kicker="生产" title="生产趋势（近 8 月）" sub="收货 → 拆解 → 吨重" />
            <ProductionTrendChart data={productionTrend} />
            <div className="dash-stat-row">
              {[
                { label: '总收货', value: productionSummary.totalReceipt.toLocaleString(), unit: '辆' },
                { label: '总拆解', value: productionSummary.totalDisassembly.toLocaleString(), unit: '辆' },
                { label: '总吨位', value: productionSummary.totalWeight.toLocaleString(), unit: '吨' },
                { label: '均价', value: productionSummary.avgPrice.toLocaleString(), unit: '元/吨' },
              ].map((s) => (
                <div key={s.label} className="cell">
                  <div className="lbl">{s.label}</div>
                  <div className="val">{s.value}<small>{s.unit}</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-col">
          <div className="dash-panel">
            <PanelTitle kicker="配件" title="配件销售统计" sub="配件销售台账" />
            <PartStatsPanel
              data={partStats}
              primaryLabel={periodLabels.primary}
              secondaryLabel={periodLabels.secondary || '本年'}
              showSecondary={periodLabels.showSecondary}
            />
          </div>
        </div>

        <div className="dash-col">
          <div className="dash-panel dash-panel--auto">
            <PanelTitle
              kicker="销售"
              title="成品销售金额"
              sub={periodLabels.showSecondary
                ? `${periodLabels.primary} ${salesSummary.monthWan ?? 0} 万 · ${periodLabels.secondary} ${salesSummary.yearWan ?? 0} 万`
                : `${periodLabels.primary} ${salesSummary.yearWan ?? salesSummary.monthWan ?? 0} 万`}
            />
            <div className="dash-mini-grid">
              <div className="dash-mini">
                <div className="lbl">{periodLabels.primary}</div>
                <div className="val">
                  {periodLabels.showSecondary ? (salesSummary.monthWan ?? 0) : (salesSummary.yearWan ?? salesSummary.monthWan ?? 0)}
                  <small>万元</small>
                </div>
                <div className="dash-soft-meta">
                  {periodLabels.showSecondary ? (salesSummary.monthCount ?? 0) : (salesSummary.yearCount ?? salesSummary.monthCount ?? 0)} 笔
                </div>
              </div>
              {periodLabels.showSecondary && (
                <div className="dash-mini">
                  <div className="lbl">{periodLabels.secondary}</div>
                  <div className="val">{salesSummary.yearWan ?? 0}<small>万元</small></div>
                  <div className="dash-soft-meta">{salesSummary.yearCount ?? 0} 笔</div>
                </div>
              )}
            </div>
            <SalesBarChart data={salesTrend} />
          </div>
          <div className="dash-panel">
            <PanelTitle
              kicker="排行"
              title="业务员收车排行"
              extra={(
                <div className="dash-tabs">
                  {(periodLabels.showSecondary
                    ? [
                        { key: 'month' as const, label: periodLabels.staffPrimary },
                        { key: 'year' as const, label: periodLabels.staffSecondary },
                      ]
                    : [{ key: 'year' as const, label: periodLabels.staffPrimary }]
                  ).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className={staffTab === t.key ? 'active' : ''}
                      onClick={() => setStaffTab(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            />
            <RankingChart data={staffTab === 'month' ? staffRankingMonth : staffRankingYear} />
          </div>
        </div>
      </section>

      <SourceBreakdownModal
        open={!!breakdown}
        title={breakdown?.title || ''}
        total={breakdown?.total || 0}
        unit={breakdown?.unit || '辆'}
        bySource={breakdown?.bySource}
        onClose={() => setBreakdown(null)}
      />
    </div>
  );
}
