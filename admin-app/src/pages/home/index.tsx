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
import { type JdyStatus } from '@/api/jdy';
import SourceBreakdownModal from '@/components/SourceBreakdownModal';
import {
  DATE_RANGE_PRESET_OPTIONS,
  resolveDateRange,
  type DateRangePreset,
} from '@/utils/dateRangePresets';

function chartMax(values: number[], fallback = 1): number {
  if (values.length === 0) return fallback;
  const max = Math.max(...values);
  return max > 0 ? max : fallback;
}

function ChartEmpty({ height = 120 }: { height?: number }) {
  return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 14 }}>
      暂无数据 No Data
    </div>
  );
}

/** 中英双语文案（参考丰驰总部大屏） */
const EN = {
  kpi: {
    累计入库车辆: 'Inbound Vehicles',
    累计收货车辆: 'Receipt Vehicles',
    累计拆解车辆: 'Disassembled',
    累计销售金额: 'Sales Amount',
  } as Record<string, string>,
  unit: {
    辆: 'units',
    吨: 't',
    万元: '¥10k',
    元: 'CNY',
    '元/吨': 'CNY/t',
  } as Record<string, string>,
  product: {
    撕碎料: 'Shredding',
    废钢: 'Scrap Steel',
    底盘料: 'Chassis',
    底盘: 'Chassis',
    铜线: 'Copper',
    铝件: 'Aluminum',
    塑料: 'Plastic',
    小件: 'Small Parts',
    橡胶: 'Rubber',
    其他: 'Others',
  } as Record<string, string>,
};

function kpiEn(title: string) {
  return EN.kpi[title] || '';
}

/** 总部大屏深色主题（对齐丰驰总部经营可视化看板） */
type DashTheme = {
  pageBg: string;
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  title: string;
  enTitle: string;
  muted: string;
  text: string;
  divider: string;
  grid: string;
  headerBg: string;
  headerBorder: string;
  clockBg: string;
  clockBorder: string;
  kpiBg: string;
  kpiTitle: string;
  pieHole: string;
  barTrack: string;
  chartAxis: string;
};

const LIGHT_THEME: DashTheme = {
  pageBg: '#ffffff',
  panelBg: '#ffffff',
  panelBorder: '#e6eef8',
  panelShadow: '0 2px 8px rgba(0,0,0,0.04)',
  title: '#1a3a5c',
  enTitle: '#8aa0b8',
  muted: '#999',
  text: '#666',
  divider: '#e6eef8',
  grid: '#e8eef5',
  headerBg: 'linear-gradient(90deg, #ffffff 0%, #f8fbff 50%, #ffffff 100%)',
  headerBorder: '#e6eef8',
  clockBg: '#e6f7ff',
  clockBorder: '#91d5ff',
  kpiBg: '#ffffff',
  kpiTitle: '#666',
  pieHole: '#f8fbff',
  barTrack: '#f0f2f5',
  chartAxis: '#666',
};

const HQ_THEME: DashTheme = {
  pageBg: 'radial-gradient(ellipse at 50% 0%, #0d2a4a 0%, #061018 55%, #03080f 100%)',
  panelBg: 'linear-gradient(180deg, rgba(12,36,64,0.92) 0%, rgba(6,20,36,0.95) 100%)',
  panelBorder: 'rgba(0,217,255,0.28)',
  panelShadow: '0 0 24px rgba(0,140,255,0.12), inset 0 0 0 1px rgba(0,217,255,0.08)',
  title: '#e8f7ff',
  enTitle: '#5ec8ff',
  muted: '#7a9bb8',
  text: '#a8c4dc',
  divider: 'rgba(0,217,255,0.22)',
  grid: 'rgba(0,217,255,0.12)',
  headerBg: 'linear-gradient(90deg, rgba(8,40,72,0.9) 0%, rgba(12,52,92,0.95) 50%, rgba(8,40,72,0.9) 100%)',
  headerBorder: 'rgba(0,217,255,0.35)',
  clockBg: 'rgba(0,217,255,0.12)',
  clockBorder: 'rgba(0,217,255,0.45)',
  kpiBg: 'linear-gradient(160deg, rgba(10,40,70,0.95) 0%, rgba(6,22,40,0.98) 100%)',
  kpiTitle: '#9ec9e8',
  pieHole: '#0a1e32',
  barTrack: 'rgba(255,255,255,0.08)',
  chartAxis: '#8ab0cc',
};

// ============================================================
// 默认数据（简道云未同步或接口失败时兜底）
// ============================================================

const emptyKpiCards: DashboardKpiCard[] = [
  { title: '累计入库车辆', value: 0, unit: '辆', icon: '📦', sub: '过磅 0 吨', color: '#00b894', glow: '0, 184, 148' },
  { title: '累计收货车辆', value: 0, unit: '辆', icon: '🚚', sub: '筛选期内 0 辆', color: '#00d9ff', glow: '0, 217, 255' },
  { title: '累计拆解车辆', value: 0, unit: '辆', icon: '⚙️', sub: '筛选期内 0 辆', color: '#6c5ce7', glow: '108, 92, 231' },
  { title: '累计销售金额', value: 0, unit: '万元', icon: '💰', sub: '本月 0 万 · 本年 0 万', color: '#fdcb6e', glow: '253, 203, 110' },
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

// KPI 核心指标（入库 / 收货 / 拆解 / 销售）
const KPI_ICONS = ['📦', '🚚', '⚙️', '💰'];
const KPI_GLOWS = ['0, 184, 148', '0, 217, 255', '108, 92, 231', '253, 203, 110'];

function PanelTitle({
  title,
  enTitle,
  subTitle,
  color = '#1890ff',
  theme = LIGHT_THEME,
}: {
  title: string;
  enTitle?: string;
  subTitle?: string;
  color?: string;
  theme?: DashTheme;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px',
      paddingBottom: '6px',
      borderBottom: `1px solid ${theme.divider}`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '4px', height: '16px',
          background: color,
          boxShadow: theme === HQ_THEME ? `0 0 8px ${color}` : undefined,
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.2 }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: theme.title, letterSpacing: '1px' }}>{title}</span>
          {enTitle && (
            <span style={{ fontSize: '10px', color: theme.enTitle, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {enTitle}
            </span>
          )}
        </div>
      </div>
      {subTitle && <span style={{ fontSize: '12px', color: theme.muted }}>{subTitle}</span>}
    </div>
  );
}

function PanelBox({ children, style, theme = LIGHT_THEME }: { children: React.ReactNode; style?: React.CSSProperties; theme?: DashTheme }) {
  return (
    <div style={{
      background: theme.panelBg,
      border: `1px solid ${theme.panelBorder}`,
      borderRadius: '8px',
      position: 'relative',
      padding: '12px 14px',
      boxShadow: theme.panelShadow,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

/** KPI 固定顺序：累计入库置左第一；库存总价已下线 */
const KPI_ORDER = ['累计入库车辆', '累计收货车辆', '累计拆解车辆', '累计销售金额'];

function mergeKpiCards(data: DigitalDashboardData['kpiCards']) {
  const filtered = (data || []).filter((item) => item?.title && !String(item.title).includes('库存总价'));
  const ordered = KPI_ORDER
    .map((title) => filtered.find((item) => item.title === title))
    .filter(Boolean) as DashboardKpiCard[];
  const rest = filtered.filter((item) => !KPI_ORDER.includes(item.title));
  return [...ordered, ...rest].slice(0, 4).map((item, i) => ({
    ...item,
    icon: KPI_ICONS[i] || '📊',
    glow: KPI_GLOWS[i] || '0, 217, 255',
  }));
}

function KpiCard({
  item,
  onClick,
  theme = LIGHT_THEME,
}: {
  item: DashboardKpiCard;
  onClick?: () => void;
  theme?: DashTheme;
}) {
  const clickable = !!onClick && !!item.bySource?.length;
  const isHq = theme === HQ_THEME;
  return (
    <div
      onClick={clickable ? onClick : undefined}
      title={clickable ? '点击查看收车 / 议价来源明细 Click for Receipt / Pricing sources' : undefined}
      style={{
        background: theme.kpiBg,
        border: `1px solid ${item.color}${isHq ? '55' : '30'}`,
        borderTop: `4px solid ${item.color}`,
        padding: '12px 14px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '96px',
        borderRadius: '8px',
        boxShadow: isHq ? `0 0 18px rgba(${item.glow || '0,217,255'},0.18)` : '0 2px 8px rgba(0,0,0,0.04)',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!clickable) return;
        e.currentTarget.style.boxShadow = `0 4px 16px ${item.color}55`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (!clickable) return;
        e.currentTarget.style.boxShadow = isHq
          ? `0 0 18px rgba(${item.glow || '0,217,255'},0.18)`
          : '0 2px 8px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0, right: 0,
        width: '80px', height: '80px',
        background: `radial-gradient(circle at top right, ${item.color}22 0%, transparent 70%)`,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '14px', color: theme.kpiTitle }}>{item.title}</div>
          {kpiEn(item.title) && (
            <div style={{ fontSize: '10px', color: theme.enTitle, letterSpacing: '0.4px', marginTop: 1 }}>
              {kpiEn(item.title)}
            </div>
          )}
        </div>
        <span style={{ fontSize: '22px' }}>{item.icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
        <span style={{
          fontSize: item.value > 1000 ? '26px' : '28px',
          fontWeight: 'bold',
          color: item.color,
          fontFamily: 'DIN, Arial, sans-serif',
          textShadow: isHq ? `0 0 12px ${item.color}66` : undefined,
        }}>{typeof item.value === 'number' && item.value % 1 !== 0 ? item.value.toFixed(1) : item.value.toLocaleString()}</span>
        <span style={{ fontSize: '13px', color: theme.muted }}>
          {item.unit}
          {EN.unit[item.unit] ? ` / ${EN.unit[item.unit]}` : ''}
        </span>
      </div>
      <div style={{ marginTop: '4px', fontSize: '12px', color: theme.muted }}>{item.sub}</div>
      {clickable && (
        <div style={{ marginTop: 4, fontSize: 11, color: item.color }}>
          收车+议价 · 点击查看来源
        </div>
      )}
    </div>
  );
}

// ============================================================
// SVG 图表组件
// ============================================================

// 折线图 - 生产趋势（高度随容器拉伸，填满中间栏）
function ProductionTrendChart({ data }: { data: ProductionTrendItem[] }) {
  const W = 560, H = 340;
  const pad = { t: 34, r: 50, b: 36, l: 50 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;

  if (data.length === 0) {
    return (
      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <text x={W / 2} y={H / 2} textAnchor="middle" fill="#999" fontSize="14">暂无数据 No Data</text>
        </svg>
      </div>
    );
  }

  const maxR = chartMax(data.map(d => d.receipt));
  const maxW = chartMax(data.map(d => d.weight));
  const step = cw / data.length;

  const makePath = (key: 'receipt' | 'disassembly' | 'weight') => {
    const values = data.map(d => key === 'weight' ? d.weight : d[key]);
    const max = key === 'weight' ? maxW : maxR;
    return values.map((v, i) => {
      const x = pad.l + i * step + step / 2;
      const y = pad.t + ch - (v / max) * ch;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="receiptLine" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1890ff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1890ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = pad.t + ch * (1 - r);
          return (
            <g key={i}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e8eef5" strokeDasharray="3,3" />
              <text x={pad.l - 8} y={y} textAnchor="end" dominantBaseline="middle" fill="#999" fontSize="12">
                {Math.round(maxR * r)}
              </text>
            </g>
          );
        })}
        <path d={`${makePath('receipt')} L ${pad.l + cw} ${pad.t + ch} L ${pad.l} ${pad.t + ch} Z`} fill="url(#receiptLine)" />
        <path d={makePath('receipt')} fill="none" stroke="#1890ff" strokeWidth="2.5" />
        <path d={makePath('disassembly')} fill="none" stroke="#722ed1" strokeWidth="2.5" strokeDasharray="6,4" />
        <path d={makePath('weight')} fill="none" stroke="#faad14" strokeWidth="2" strokeDasharray="3,3" />

        {data.map((d, i) => {
          const x = pad.l + i * step + step / 2;
          const y = pad.t + ch - (d.receipt / maxR) * ch;
          return <circle key={i} cx={x} cy={y} r="4" fill="#1890ff" stroke="#fff" strokeWidth="1.5" />;
        })}

        {data.map((d, i) => (
          <text key={i} x={pad.l + i * step + step / 2} y={H - 10} textAnchor="middle" fill="#666" fontSize="13">
            {d.month}
          </text>
        ))}

        <g transform={`translate(${pad.l}, 10)`}>
          {[
            { label: '收货 Receipt', color: '#1890ff' },
            { label: '拆解 Dismantle', color: '#722ed1' },
            { label: '吨重 Weight', color: '#faad14' },
          ].map((l, i) => (
            <g key={i} transform={`translate(${i * 120}, 0)`}>
              <rect width="10" height="10" fill={l.color} rx="1" />
              <text x="15" y="9" fill="#666" fontSize="12">{l.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

// 配件销售统计（中间栏 · 简道云配件销售台账）
function PartStatsPanel({ data }: { data: PartStats }) {
  const [tab, setTab] = useState<'month' | 'year'>('month');
  const categories = tab === 'month'
    ? (data.categoryMonth?.length ? data.categoryMonth : data.categoryYear || [])
    : (data.categoryYear?.length ? data.categoryYear : data.categoryMonth || []);
  const max = chartMax(categories.map((c) => c.amount ?? 0));
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 }}>
        {[
          { label: '本月金额', value: `${data.monthWan ?? 0}`, unit: '万元', color: '#00d9ff' },
          { label: '本年金额', value: `${data.yearWan ?? 0}`, unit: '万元', color: '#6c5ce7' },
          { label: '本月笔数', value: `${data.monthCount ?? 0}`, unit: '笔', color: '#00b894' },
          { label: '本年笔数', value: `${data.yearCount ?? 0}`, unit: '笔', color: '#fdcb6e' },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#f7fbff', border: '1px solid #e6eef8', borderRadius: 6, padding: '8px 10px',
          }}>
            <div style={{ fontSize: 12, color: '#8899aa' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'DIN, Arial, sans-serif' }}>
              {s.value}<span style={{ fontSize: 11, fontWeight: 400, color: '#99aabb', marginLeft: 4 }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ fontSize: 12, color: '#8899aa' }}>
          吨位 · 本月 {data.monthWeight ?? 0}t / 本年 {data.yearWeight ?? 0}t
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {([
            { key: 'month' as const, label: '本月' },
            { key: 'year' as const, label: '本年' },
          ]).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                border: `1px solid ${tab === t.key ? '#00b894' : '#e6eef8'}`,
                background: tab === t.key ? '#e6fffb' : '#fff',
                color: tab === t.key ? '#08979c' : '#8899aa',
                borderRadius: 4,
                fontSize: 12,
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {!categories.length ? (
          <ChartEmpty height={100} />
        ) : (
          categories.map((c: PartCategoryItem, i: number) => {
            const pct = max > 0 ? ((c.amount ?? 0) / max) * 100 : 0;
            return (
              <div key={`${c.name}-${i}`} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: '#333' }}>{c.name}</span>
                  <span style={{ color: '#1890ff', fontWeight: 500 }}>{(c.wan ?? 0)}万</span>
                </div>
                <div style={{ height: 6, background: '#f0f2f5', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: 'linear-gradient(90deg, #00d9ff, #6c5ce7)', borderRadius: 4,
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 柱状图 - 销售
function SalesBarChart({ data }: { data: SalesTrendItem[] }) {
  const W = 380, H = 150;
  const pad = { t: 24, r: 15, b: 28, l: 55 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  if (data.length === 0) {
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#999" fontSize="14">暂无数据 No Data</text>
      </svg>
    );
  }
  const max = chartMax(data.map(d => d.amount ?? 0));
  const bw = cw / data.length * 0.55;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="salesBar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#722ed1" />
          <stop offset="100%" stopColor="#1890ff" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
        const y = pad.t + ch * (1 - r);
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e8eef5" strokeDasharray="3,3" />
            <text x={pad.l - 6} y={y} textAnchor="end" dominantBaseline="middle" fill="#999" fontSize="11">
              {(max * r / 10000).toFixed(0)}万/W
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
            <rect x={x} y={y} width={bw} height={Math.max(bh, 0)} fill="url(#salesBar)" rx="3" />
            <text x={x + bw / 2} y={y - 5} textAnchor="middle" fill="#1890ff" fontSize="11">
              {(amount / 10000).toFixed(1)}万
            </text>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" fill="#666" fontSize="13">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

// 排行柱状图
function RankingChart({ data }: { data: StaffRankingItem[] }) {
  const max = chartMax(data.map(d => d.monthly));
  const medals = ['#ffd700', '#c0c0c0', '#cd7f32'];

  if (!data.length) return <ChartEmpty height={120} />;

  return (
    <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
      {data.map((s, i) => {
        const pct = (s.monthly / max) * 100;
        return (
          <div key={i} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
              <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-block', width: '20px', height: '20px',
                  textAlign: 'center', lineHeight: '20px',
                  background: i < 3 ? medals[i] : '#e6f7ff',
                  color: i < 3 ? '#000' : '#1890ff',
                  fontSize: '12px', fontWeight: 'bold',
                  borderRadius: '3px',
                }}>{i + 1}</span>
                {s.name}
              </span>
              <span style={{ color: '#1890ff', fontWeight: 500 }}>{s.monthly}辆</span>
            </div>
            <div style={{ height: '7px', background: '#f0f2f5', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: `linear-gradient(90deg, ${medals[i] || '#1890ff'}, ${medals[i] || '#722ed1'})`,
                borderRadius: '4px',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 主组件
// ============================================================

export default function DigitalDashboard({ standalone = false }: { standalone?: boolean }) {
  const isMobile = useIsMobile();
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dataSource, setDataSource] = useState<'jdy' | 'empty'>('empty');
  const [jdyStatus, setJdyStatus] = useState<JdyStatus | null>(null);
  const [datePreset, setDatePreset] = useState<DateRangePreset>('thisYear');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [rangeLabel, setRangeLabel] = useState('今年 This Year');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [kpiCards, setKpiCards] = useState<DashboardKpiCard[]>(emptyKpiCards);
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
      const hasData = (data.jdyStatus?.dataCount ?? 0) > 0;
      setJdyStatus(data.jdyStatus ?? null);
      setDataSource(data.dataSource === 'jdy' && hasData ? 'jdy' : 'empty');
      setKpiCards(mergeKpiCards(data.kpiCards?.length ? data.kpiCards : emptyKpiCards));
      setProductionTrend(data.productionTrend?.length ? data.productionTrend : emptyProductionTrend);
      setProductionSummary(data.productionSummary ?? emptyProductionSummary);
      setSalesTrend(data.salesTrend?.length ? data.salesTrend : emptySalesTrend);
      setStaffRankingMonth(data.staffRankingMonth?.length ? data.staffRankingMonth : (data.staffRanking || emptyStaffRanking));
      setStaffRankingYear(data.staffRankingYear?.length ? data.staffRankingYear : emptyStaffRanking);
      setSalesSummary(data.salesSummary ?? emptySalesSummary);
      setPartStats(data.partStats ?? emptyPartStats);
      setSourcePeriodStats(data.sourcePeriodStats ?? null);
      setLastUpdated(new Date());
    } catch {
      setDataSource('empty');
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
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
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

  const fmt = (d: Date) => d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const fmtClock = (d: Date) => d.toLocaleTimeString('zh-CN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const wkZh = ['日', '一', '二', '三', '四', '五', '六'][time.getDay()];
  const wkEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][time.getDay()];
  const dt = `${time.getFullYear()}年${time.getMonth() + 1}月${time.getDate()}日 星期${wkZh} ${wkEn}`;
  const nextRefresh = lastUpdated
    ? new Date(lastUpdated.getTime() + 60_000)
    : null;

  return (
    <div ref={containerRef} style={{
      height: isMobile ? 'auto' : standalone ? '100vh' : 'calc(100vh - 64px)',
      minHeight: isMobile ? '100%' : undefined,
      background: '#ffffff',
      padding: '10px 14px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflow: isMobile ? 'auto' : 'hidden',
      boxSizing: 'border-box',
    }}>
      {isMobile && (
        <div
          style={{
            background: '#fff7e6',
            border: '1px solid #ffd591',
            color: '#ad6800',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 8,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          经营大屏在手机上可上下浏览。完整图表与全屏看板请使用电脑打开。
        </div>
      )}
      {/* 全屏按钮 */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? '退出全屏 Exit Fullscreen' : '全屏 Fullscreen'}
        style={{
          position: 'fixed',
          top: '18px',
          right: '18px',
          zIndex: 9999,
          minWidth: '72px',
          height: '48px',
          padding: '0 10px',
          background: 'linear-gradient(135deg, rgba(0,217,255,0.15), rgba(108,92,231,0.15))',
          border: '1px solid rgba(0,217,255,0.4)',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,217,255,0.3), rgba(108,92,231,0.3))';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(0,217,255,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,217,255,0.15), rgba(108,92,231,0.15))';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          {isFullscreen ? (
            <>
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
                stroke="#00d9ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <path d="M3 8V5a2 2 0 0 1 2-2h3m13 0h-3a2 2 0 0 0-2 2v3m0 13v-3a2 2 0 0 1 2-2h3M5 16v3a2 2 0 0 0 2 2h3"
                stroke="#00d9ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
        </svg>
        <span style={{ fontSize: 10, color: '#00d9ff', lineHeight: 1 }}>
          {isFullscreen ? '退出 Exit' : '全屏 Fullscreen'}
        </span>
      </button>

      <div style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {/* 顶部标题 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: '8px 16px',
          background: 'linear-gradient(90deg, #ffffff 0%, #f8fbff 50%, #ffffff 100%)',
          border: '1px solid #e6eef8',
          borderLeft: '5px solid #1890ff',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#1890ff', fontSize: '18px' }}>◆</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontSize: '22px', fontWeight: 'bold', color: '#1a3a5c',
                letterSpacing: '3px', lineHeight: 1.15,
              }}>
                {standalone ? '华成攒碳 · 可视化看板' : '华成攒碳 · 数字化可视大屏'}
              </span>
              <span style={{
                fontSize: '11px', color: '#8aa0b8', letterSpacing: '1.5px',
                textTransform: 'uppercase', fontWeight: 500,
              }}>
                {standalone
                  ? 'ZUANTAN HQ OPERATIONS DASHBOARD'
                  : 'ZUANTAN DIGITAL OPERATIONS DASHBOARD'}
              </span>
            </div>
            <span style={{ color: '#722ed1', fontSize: '18px' }}>◆</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '12px',
              color: dataSource === 'jdy' ? '#52c41a' : '#faad14',
              background: dataSource === 'jdy' ? '#f6ffed' : '#fffbe6',
              border: `1px solid ${dataSource === 'jdy' ? '#b7eb8f' : '#ffe58f'}`,
              padding: '3px 8px',
              borderRadius: '4px',
            }}>
              {dataSource === 'jdy'
                ? `数据 Live${jdyStatus?.dataCount ? ` · ${jdyStatus.dataCount}条` : ''}`
                : '本地数据'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>提交时间</span>
              <Select
                value={datePreset}
                onChange={(value: DateRangePreset) => setDatePreset(value)}
                options={DATE_RANGE_PRESET_OPTIONS}
                style={{ width: 140 }}
                size="small"
                popupMatchSelectWidth={false}
              />
              {datePreset === 'custom' && (
                <DatePicker.RangePicker
                  value={customRange}
                  onChange={(dates) => setCustomRange(dates as [Dayjs, Dayjs] | null)}
                  allowClear={false}
                  size="small"
                />
              )}
              <span style={{ fontSize: '11px', color: '#999' }}>{rangeLabel}</span>
            </div>
            {lastUpdated && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 1,
                fontSize: 11, color: '#666', lineHeight: 1.25,
                padding: '3px 8px',
                background: '#f7fbff',
                border: '1px solid #e6eef8',
                borderRadius: 4,
              }}>
                <span>上次更新 <b style={{ color: '#1890ff' }}>{fmtClock(lastUpdated)}</b></span>
                {nextRefresh && (
                  <span>下次刷新 <b style={{ color: '#722ed1' }}>{fmtClock(nextRefresh)}</b></span>
                )}
              </div>
            )}
            <span style={{ fontSize: '13px', color: '#666' }}>{dt}</span>
            <span style={{
              fontSize: '18px', fontWeight: 'bold', color: '#1890ff',
              background: '#e6f7ff',
              padding: '4px 14px',
              border: '1px solid #91d5ff',
              fontFamily: 'DIN, Arial, sans-serif',
              borderRadius: '6px',
            }}>{fmt(time)}</span>
          </div>
        </div>

        {/* KPI 卡片：4 列，入库第一 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: '10px',
          flexShrink: 0,
        }}>
          {kpiCards.map((k, i) => (
            <KpiCard
              key={i}
              item={k}
              onClick={k.bySource?.length ? () => setBreakdown({
                title: k.title,
                total: k.value,
                unit: k.unit,
                bySource: k.bySource || [],
              }) : undefined}
            />
          ))}
        </div>

        {/* 收车 / 议价融合展示：当月累计 + 年累计 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '10px',
          flexShrink: 0,
        }}>
          {([
            { key: 'receipt' as const, title: '收车系统', color: '#00b894' },
            { key: 'pricing' as const, title: '议价系统', color: '#fa8c16' },
          ]).map((src) => {
            const receipt = sourcePeriodStats?.receipt?.[src.key];
            const inbound = sourcePeriodStats?.inbound?.[src.key];
            return (
              <div key={src.key} style={{
                background: '#ffffff',
                border: '1px solid #e6eef8',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: src.color }}>{src.title}</span>
                  <span style={{ fontSize: 11, color: '#99aabb' }}>当月累计 · 年累计</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#999' }}>收货 · 当月累计</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: src.color }}>
                      {(receipt?.month ?? 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#8899aa' }}>年累计 {(receipt?.year ?? 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#999' }}>入库 · 当月累计</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: src.color }}>
                      {(inbound?.month ?? 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#8899aa' }}>年累计 {(inbound?.year ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isMobile && (
          <MobileStatSummary
            title="经营概览"
            hint="趋势图、配件分布和业务员排行请使用电脑查看。"
            items={[
              { label: '总收货', value: productionSummary.totalReceipt.toLocaleString(), unit: '辆', color: '#00d9ff' },
              { label: '总拆解', value: productionSummary.totalDisassembly.toLocaleString(), unit: '辆', color: '#6c5ce7' },
              { label: '总吨位', value: productionSummary.totalWeight.toLocaleString(), unit: '吨', color: '#d48806' },
              { label: '本月销售', value: salesSummary.monthWan, unit: '万元', color: '#13227a' },
            ]}
          />
        )}

        {/* 主体：左生产趋势 / 中配件库 / 右销售+排行 */}
        <div style={{
          display: isMobile ? 'none' : 'grid',
          gridTemplateColumns: '1.2fr 1fr 1.1fr',
          gap: '10px',
          flex: 1,
          minHeight: 0,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
            <PanelBox style={{ flex: 1 }}>
              <PanelTitle
                title="生产趋势分析（近8月）"
                enTitle="Production Trend (Last 8 Months)"
                subTitle="收货 → 拆解 → 入库"
                color="#00d9ff"
              />
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <ProductionTrendChart data={productionTrend} />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(0,217,255,0.1)',
                  flexShrink: 0,
                }}>
                  {[
                    { label: '总收货', en: 'Receipt', value: productionSummary.totalReceipt.toLocaleString(), unit: '辆', color: '#00d9ff' },
                    { label: '总拆解', en: 'Dismantle', value: productionSummary.totalDisassembly.toLocaleString(), unit: '辆', color: '#6c5ce7' },
                    { label: '总吨位', en: 'Tonnage', value: productionSummary.totalWeight.toLocaleString(), unit: '吨', color: '#fdcb6e' },
                    { label: '均价', en: 'Avg Price', value: productionSummary.avgPrice.toLocaleString(), unit: '元/吨', color: '#00b894' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#8899aa' }}>{s.label}</div>
                      <div style={{ fontSize: '10px', color: '#a8b8c8', marginBottom: 1 }}>{s.en}</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: s.color, fontFamily: 'DIN, Arial, sans-serif' }}>
                        {s.value}<span style={{ fontSize: '11px', fontWeight: 'normal', color: '#667788', marginLeft: '2px' }}>{s.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PanelBox>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
            <PanelBox style={{ flex: 1 }}>
              <PanelTitle
                title="配件库 · 销售统计"
                enTitle="Parts Warehouse Sales"
                subTitle="简道云配件销售台账"
                color="#00b894"
              />
              <PartStatsPanel data={partStats} />
            </PanelBox>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
            <PanelBox style={{ flex: '0 0 auto' }}>
              <PanelTitle
                title="销售金额统计"
                enTitle="Sales Amount Statistics"
                subTitle={`本月 ${salesSummary.monthWan} 万 · 本年 ${salesSummary.yearWan} 万`}
                color="#6c5ce7"
              />
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8,
              }}>
                <div style={{ background: '#f7fbff', border: '1px solid #e6eef8', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: 11, color: '#8899aa' }}>本月累计</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#6c5ce7' }}>
                    {salesSummary.monthWan}<span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>万元</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#99aabb' }}>{salesSummary.monthCount} 笔</div>
                </div>
                <div style={{ background: '#f7fbff', border: '1px solid #e6eef8', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: 11, color: '#8899aa' }}>本年累计</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>
                    {salesSummary.yearWan}<span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>万元</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#99aabb' }}>{salesSummary.yearCount} 笔</div>
                </div>
              </div>
              <SalesBarChart data={salesTrend} />
            </PanelBox>
            <PanelBox style={{ flex: 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #e6eef8', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 4, height: 16, background: '#fdcb6e' }} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a3a5c' }}>业务员收车排行</div>
                    <div style={{ fontSize: 10, color: '#8aa0b8', textTransform: 'uppercase' }}>Receipt Staff Ranking</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([
                    { key: 'month' as const, label: '本月' },
                    { key: 'year' as const, label: '本年' },
                  ]).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setStaffTab(t.key)}
                      style={{
                        border: `1px solid ${staffTab === t.key ? '#fdcb6e' : '#e6eef8'}`,
                        background: staffTab === t.key ? '#fff7e6' : '#fff',
                        color: staffTab === t.key ? '#d48806' : '#8899aa',
                        borderRadius: 4,
                        fontSize: 12,
                        padding: '2px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <RankingChart data={staffTab === 'month' ? staffRankingMonth : staffRankingYear} />
            </PanelBox>
          </div>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,217,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(0,217,255,0.25); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,217,255,0.4); }
      `}</style>

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
