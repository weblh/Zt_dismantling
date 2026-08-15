import { useState, useEffect, useRef } from 'react';

// ============================================================
// 数据定义 - 基于系统各业务模块的模拟数据
// ============================================================

// KPI 核心指标（来自：业务收货、生产、销售、库存台账）
const kpiCards = [
  { title: '累计收货车辆', value: 5117, unit: '辆', icon: '🚚', sub: '本月 401 辆', color: '#00d9ff', glow: '0, 217, 255' },
  { title: '累计拆解车辆', value: 5108, unit: '辆', icon: '⚙️', sub: '本月 470 辆', color: '#6c5ce7', glow: '108, 92, 231' },
  { title: '累计入库吨位', value: 6296, unit: '吨', icon: '📦', sub: '本月 586 吨', color: '#00b894', glow: '0, 184, 148' },
  { title: '累计销售金额', value: 1614, unit: '万元', icon: '💰', sub: '本月 146 万', color: '#fdcb6e', glow: '253, 203, 110' },
  { title: '库存总价值', value: 3280, unit: '万元', icon: '🏦', sub: '环比 +2.3%', color: '#e17055', glow: '225, 112, 85' },
];

// 生产趋势（来自：生产模块 - 拆解、过磅查验）
const productionTrend = [
  { month: '1月', receipt: 796, disassembly: 790, weight: 941.5 },
  { month: '2月', receipt: 502, disassembly: 498, weight: 568.5 },
  { month: '3月', receipt: 971, disassembly: 965, weight: 1101.7 },
  { month: '4月', receipt: 705, disassembly: 700, weight: 889.2 },
  { month: '5月', receipt: 791, disassembly: 788, weight: 1029.1 },
  { month: '6月', receipt: 875, disassembly: 870, weight: 1039.2 },
  { month: '7月', receipt: 513, disassembly: 510, weight: 682.6 },
  { month: '8月', receipt: 8, disassembly: 8, weight: 13.7 },
];

// 产品入库结构（来自：库存台账 - 产成品入库单）
const productInbound = [
  { name: '撕碎料', value: 500.11, color: '#00d9ff' },
  { name: '废钢', value: 161.24, color: '#6c5ce7' },
  { name: '底盘料', value: 188.16, color: '#00b894' },
  { name: '铜线', value: 10.84, color: '#fdcb6e' },
  { name: '铝件', value: 22.61, color: '#e17055' },
  { name: '塑料', value: 39.44, color: '#fd79a8' },
  { name: '小件', value: 27.81, color: '#74b9ff' },
  { name: '橡胶', value: 35.91, color: '#a29bfe' },
];

// 实时库存（来自：库存台账 - 仓库信息）
const warehouseStock = [
  { warehouse: 'A区仓库', shredding: 28.28, scrapSteel: 37.2, chassis: 27.37, copper: 7.26, aluminum: 17.26, plastic: 22.79, smallParts: 17.6, rubber: 22.44 },
  { warehouse: 'B区仓库', shredding: 61.31, scrapSteel: 7.56, chassis: 0, copper: 0, aluminum: 0, plastic: 0, smallParts: 0, rubber: 0 },
  { warehouse: 'C区仓库', shredding: 15.5, scrapSteel: 22.3, chassis: 18.9, copper: 3.2, aluminum: 8.1, plastic: 12.4, smallParts: 9.8, rubber: 11.2 },
];

// 销售趋势（来自：销售模块 - 成品销售统计）
const salesTrend = [
  { month: '1月', amount: 2471869, count: 796 },
  { month: '2月', amount: 1544442, count: 502 },
  { month: '3月', amount: 3022109, count: 971 },
  { month: '4月', amount: 2460132, count: 705 },
  { month: '5月', amount: 2908000, count: 791 },
  { month: '6月', amount: 1980550, count: 875 },
  { month: '7月', amount: 1725120, count: 513 },
];

// 业务人员排行（来自：业务模块 - 业务员管理）
const staffRanking = [
  { name: '段石峰', monthly: 82, amount: 286500 },
  { name: '周月胜', monthly: 76, amount: 254200 },
  { name: '边飞旋', monthly: 71, amount: 238900 },
  { name: '孙文奇', monthly: 65, amount: 215600 },
  { name: '许敬红', monthly: 58, amount: 192300 },
  { name: '武汉马', monthly: 52, amount: 173800 },
];

// 实时动态（来自：各业务模块最新操作）
const activities = [
  { time: '10:32', type: '入库', text: 'A区仓库 入库 撕碎料 12.5吨', color: '#00b894' },
  { time: '10:28', type: '销售', text: '段石峰 销售废钢 8.2吨 ¥23,600', color: '#00d9ff' },
  { time: '10:15', type: '拆解', text: '车辆 豫A·12345 完成综合拆解', color: '#6c5ce7' },
  { time: '10:02', type: '巡检', text: '业务巡检-3号站点 巡检完成', color: '#fdcb6e' },
  { time: '09:48', type: '收货', text: '周月胜 收货 5辆 总重 23.8吨', color: '#fd79a8' },
  { time: '09:30', type: '出库', text: 'B区仓库 出库 底盘料 5.6吨', color: '#e17055' },
];

// 出入库对比（来自：出入库统计）
const inOutCompare = [
  { product: '撕碎料', inbound: 500.11, outbound: 472.52, unit: '吨' },
  { product: '废钢', inbound: 161.24, outbound: 145.30, unit: '吨' },
  { product: '底盘料', inbound: 188.16, outbound: 170.50, unit: '吨' },
  { product: '铜线', inbound: 10.84, outbound: 9.20, unit: '吨' },
  { product: '铝件', inbound: 22.61, outbound: 20.15, unit: '吨' },
  { product: '塑料', inbound: 39.44, outbound: 35.80, unit: '吨' },
];

// ============================================================
// 通用组件
// ============================================================

function PanelTitle({ title, subTitle, color = '#1890ff' }: { title: string; subTitle?: string; color?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
      paddingBottom: '10px',
      borderBottom: `1px solid #e6eef8`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '4px', height: '18px',
          background: color,
        }} />
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#1a3a5c', letterSpacing: '1px' }}>{title}</span>
      </div>
      {subTitle && <span style={{ fontSize: '14px', color: '#999' }}>{subTitle}</span>}
    </div>
  );
}

function PanelBox({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e6eef8',
      borderRadius: '8px',
      position: 'relative',
      padding: '18px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ============================================================
// KPI 卡片
// ============================================================
function KpiCard({ item }: { item: typeof kpiCards[0] }) {
  return (
    <div style={{
      background: '#ffffff',
      border: `1px solid ${item.color}30`,
      borderTop: `4px solid ${item.color}`,
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '140px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        position: 'absolute',
        top: 0, right: 0,
        width: '80px', height: '80px',
        background: `radial-gradient(circle at top right, ${item.color}15 0%, transparent 70%)`,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>{item.title}</div>
        <span style={{ fontSize: '26px' }}>{item.icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '10px' }}>
        <span style={{
          fontSize: item.value > 1000 ? '32px' : '34px',
          fontWeight: 'bold',
          color: item.color,
          fontFamily: 'DIN, Arial, sans-serif',
        }}>{typeof item.value === 'number' && item.value % 1 !== 0 ? item.value.toFixed(1) : item.value.toLocaleString()}</span>
        <span style={{ fontSize: '15px', color: '#999' }}>{item.unit}</span>
      </div>
      <div style={{ marginTop: '8px', fontSize: '14px', color: '#999' }}>{item.sub}</div>
    </div>
  );
}

// ============================================================
// SVG 图表组件
// ============================================================

// 折线图 - 生产趋势
function ProductionTrendChart({ data }: { data: typeof productionTrend }) {
  const W = 560, H = 240;
  const pad = { t: 30, r: 50, b: 32, l: 50 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;

  const maxR = Math.max(...data.map(d => d.receipt));
  const maxW = Math.max(...data.map(d => d.weight));
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
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="receiptLine" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1890ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1890ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 网格 */}
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
      {/* 收货面积 */}
      <path d={`${makePath('receipt')} L ${pad.l + cw} ${pad.t + ch} L ${pad.l} ${pad.t + ch} Z`} fill="url(#receiptLine)" />
      {/* 收货线 */}
      <path d={makePath('receipt')} fill="none" stroke="#1890ff" strokeWidth="2.5" />
      {/* 拆解线 */}
      <path d={makePath('disassembly')} fill="none" stroke="#722ed1" strokeWidth="2.5" strokeDasharray="6,4" />
      {/* 吨重线 */}
      <path d={makePath('weight')} fill="none" stroke="#faad14" strokeWidth="2" strokeDasharray="3,3" />

      {/* 数据点 */}
      {data.map((d, i) => {
        const x = pad.l + i * step + step / 2;
        const y = pad.t + ch - (d.receipt / maxR) * ch;
        return <circle key={i} cx={x} cy={y} r="4" fill="#1890ff" stroke="#fff" strokeWidth="1.5" />;
      })}

      {/* X轴 */}
      {data.map((d, i) => (
        <text key={i} x={pad.l + i * step + step / 2} y={H - 8} textAnchor="middle" fill="#666" fontSize="13">
          {d.month}
        </text>
      ))}

      {/* 图例 */}
      <g transform={`translate(${pad.l}, 10)`}>
        {[
          { label: '收货(辆)', color: '#1890ff' },
          { label: '拆解(辆)', color: '#722ed1' },
          { label: '吨重(吨)', color: '#faad14' },
        ].map((l, i) => (
          <g key={i} transform={`translate(${i * 100}, 0)`}>
            <rect width="10" height="10" fill={l.color} rx="1" />
            <text x="15" y="9" fill="#666" fontSize="13">{l.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// 饼图 - 产品入库
function PieChart({ data }: { data: typeof productInbound }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = 100, cy = 100, r = 78;
  let angle = -90;

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        {data.map((d, i) => {
          const a = (d.value / total) * 360;
          const sA = (angle * Math.PI) / 180;
          const eA = ((angle + a) * Math.PI) / 180;
          angle += a;
          const large = a > 180 ? 1 : 0;
          const x1 = cx + r * Math.cos(sA);
          const y1 = cy + r * Math.sin(sA);
          const x2 = cx + r * Math.cos(eA);
          const y2 = cy + r * Math.sin(eA);
          return (
            <path key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={d.color} opacity="0.85"
            />
          );
        })}
        <circle cx={cx} cy={cy} r="45" fill="#f8fbff" />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#1890ff" fontSize="13">总入库</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#333" fontSize="16" fontWeight="bold">{total.toFixed(0)}吨</text>
      </svg>
      <div style={{ flex: 1, fontSize: '14px', lineHeight: '2.1' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'flex-start', color: '#666', gap: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: d.color, display: 'inline-block', borderRadius: '1px' }} />
              {d.name}
            </span>
            <span style={{ color: d.color, fontWeight: 500, marginLeft: '8px' }}>{d.value.toFixed(1)}t</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 柱状图 - 销售
function SalesBarChart({ data }: { data: typeof salesTrend }) {
  const W = 380, H = 190;
  const pad = { t: 24, r: 15, b: 28, l: 55 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const max = Math.max(...data.map(d => d.amount));
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
              {(max * r / 10000).toFixed(0)}万
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = pad.l + i * (cw / data.length) + (cw / data.length - bw) / 2;
        const bh = (d.amount / max) * ch;
        const y = pad.t + ch - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} fill="url(#salesBar)" rx="3" />
            <text x={x + bw / 2} y={y - 5} textAnchor="middle" fill="#1890ff" fontSize="11">
              {(d.amount / 10000).toFixed(1)}万
            </text>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" fill="#666" fontSize="13">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

// 排行柱状图
function RankingChart({ data }: { data: typeof staffRanking }) {
  const max = Math.max(...data.map(d => d.monthly));
  const medals = ['#ffd700', '#c0c0c0', '#cd7f32'];

  return (
    <div>
      {data.map((s, i) => {
        const pct = (s.monthly / max) * 100;
        return (
          <div key={i} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
              <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-block', width: '22px', height: '22px',
                  textAlign: 'center', lineHeight: '22px',
                  background: i < 3 ? medals[i] : '#e6f7ff',
                  color: i < 3 ? '#000' : '#1890ff',
                  fontSize: '13', fontWeight: 'bold',
                  borderRadius: '3px',
                }}>{i + 1}</span>
                {s.name}
              </span>
              <span style={{ color: '#1890ff', fontWeight: 500 }}>{s.monthly}辆</span>
            </div>
            <div style={{ height: '8px', background: '#f0f2f5', borderRadius: '4px', overflow: 'hidden' }}>
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

// 出入库对比图
function InOutCompareChart({ data }: { data: typeof inOutCompare }) {
  const max = Math.max(...data.flatMap(d => [d.inbound, d.outbound]));
  const bw = 16;

  return (
    <div>
      {data.map((d, i) => {
        const iPct = (d.inbound / max) * 100;
        const oPct = (d.outbound / max) * 100;
        return (
          <div key={i} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px', color: '#333' }}>
              <span>{d.product}</span>
              <span>
                <span style={{ color: '#52c41a' }}>入库 {d.inbound.toFixed(1)}t</span>
                <span style={{ color: '#999', margin: '0 6px' }}>|</span>
                <span style={{ color: '#fa8c16' }}>出库 {d.outbound.toFixed(1)}t</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div style={{ flex: 1, height: bw, background: '#f6ffed', borderRadius: '3px', position: 'relative' }}>
                <div style={{
                  height: '100%', width: `${iPct}%`,
                  background: 'linear-gradient(90deg, #52c41a, #1890ff)',
                  borderRadius: '3px',
                }} />
              </div>
              <div style={{ flex: 1, height: bw, background: '#fff7e6', borderRadius: '3px' }}>
                <div style={{
                  height: '100%', width: `${oPct}%`,
                  background: 'linear-gradient(90deg, #fa8c16, #eb2f96)',
                  borderRadius: '3px',
                }} />
              </div>
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

export default function DigitalDashboard() {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
  const wk = ['日', '一', '二', '三', '四', '五', '六'][time.getDay()];
  const dt = `${time.getFullYear()}年${time.getMonth() + 1}月${time.getDate()}日 星期${wk}`;

  return (
    <div ref={containerRef} style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#ffffff',
      padding: '16px 20px',
      position: 'relative',
    }}>
      {/* 全屏按钮 */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? '退出全屏' : '全屏显示'}
        style={{
          position: 'fixed',
          top: '18px',
          right: '18px',
          zIndex: 9999,
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, rgba(0,217,255,0.15), rgba(108,92,231,0.15))',
          border: '1px solid rgba(0,217,255,0.4)',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s',
          padding: 0,
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
      </button>

      {/* 背景网格 - 移除 */}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 顶部标题 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '14px 24px',
          background: 'linear-gradient(90deg, #ffffff 0%, #f8fbff 50%, #ffffff 100%)',
          border: '1px solid #e6eef8',
          borderLeft: '5px solid #1890ff',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#1890ff', fontSize: '22px' }}>◆</span>
            <span style={{
              fontSize: '28px', fontWeight: 'bold', color: '#1a3a5c',
              letterSpacing: '5px',
            }}>
              华成攒碳 · 数字化可视大屏
            </span>
            <span style={{ color: '#722ed1', fontSize: '22px' }}>◆</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span style={{ fontSize: '16px', color: '#666' }}>{dt}</span>
            <span style={{
              fontSize: '22px', fontWeight: 'bold', color: '#1890ff',
              background: '#e6f7ff',
              padding: '8px 24px',
              border: '1px solid #91d5ff',
              fontFamily: 'DIN, Arial, sans-serif',
              borderRadius: '6px',
            }}>{fmt(time)}</span>
          </div>
        </div>

        {/* KPI 卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '14px',
          marginBottom: '16px',
        }}>
          {kpiCards.map((k, i) => <KpiCard key={i} item={k} />)}
        </div>

        {/* 主体区域 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5fr 1fr',
          gap: '14px',
        }}>
          {/* ==================== 左侧列 ==================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 产品入库分析 */}
            <PanelBox>
              <PanelTitle title="产品入库分析" color="#00d9ff" />
              <PieChart data={productInbound} />
            </PanelBox>

            {/* 出入库对比 */}
            <PanelBox>
              <PanelTitle title="出入库对比（吨）" color="#00b894" />
              <InOutCompareChart data={inOutCompare} />
            </PanelBox>
          </div>

          {/* ==================== 中间列 ==================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 生产趋势 */}
            <PanelBox>
              <PanelTitle title="生产趋势分析（近8月）" subTitle="业务收货 → 拆解 → 入库" color="#00d9ff" />
              <ProductionTrendChart data={productionTrend} />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(0,217,255,0.1)',
              }}>
                {[
                  { label: '总收货', value: '5,161', unit: '辆', color: '#00d9ff' },
                  { label: '总拆解', value: '5,139', unit: '辆', color: '#6c5ce7' },
                  { label: '总吨位', value: '6,296', unit: '吨', color: '#fdcb6e' },
                  { label: '均价', value: '2,563', unit: '元/吨', color: '#00b894' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', color: '#8899aa' }}>{s.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: s.color, fontFamily: 'DIN, Arial, sans-serif' }}>
                      {s.value}<span style={{ fontSize: '14px', fontWeight: 'normal', color: '#667788', marginLeft: '3px' }}>{s.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </PanelBox>

            {/* 销售金额趋势 */}
            <PanelBox>
              <PanelTitle title="销售金额统计" subTitle={`总金额 ¥${salesTrend.reduce((s, d) => s + d.amount, 0).toLocaleString()}`} color="#6c5ce7" />
              <SalesBarChart data={salesTrend} />
            </PanelBox>
          </div>

          {/* ==================== 右侧列 ==================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 实时库存 */}
            <PanelBox>
              <PanelTitle title="实时库存监控（吨）" color="#e17055" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(0,217,255,0.25)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 6px', color: '#1890ff' }}>仓库</th>
                      <th style={{ padding: '8px 5px', color: '#1890ff' }}>撕碎料</th>
                      <th style={{ padding: '8px 5px', color: '#1890ff' }}>废钢</th>
                      <th style={{ padding: '8px 5px', color: '#1890ff' }}>底盘</th>
                      <th style={{ padding: '8px 5px', color: '#1890ff' }}>铜线</th>
                      <th style={{ padding: '8px 5px', color: '#1890ff' }}>其他</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseStock.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(0,217,255,0.06)' }}>
                        <td style={{ padding: '8px 6px', color: '#666' }}>{row.warehouse}</td>
                        <td style={{ padding: '8px 5px', color: '#1890ff', fontWeight: 500 }}>{row.shredding.toFixed(1)}</td>
                        <td style={{ padding: '8px 5px', color: '#6c5ce7', fontWeight: 500 }}>{row.scrapSteel.toFixed(1)}</td>
                        <td style={{ padding: '8px 5px', color: '#00b894', fontWeight: 500 }}>{row.chassis.toFixed(1)}</td>
                        <td style={{ padding: '8px 5px', color: '#d48806', fontWeight: 500 }}>{row.copper.toFixed(1)}</td>
                        <td style={{ padding: '8px 5px', color: '#666' }}>
                          {(row.aluminum + row.plastic + row.smallParts + row.rubber).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelBox>

            {/* 业务员排行 */}
            <PanelBox>
              <PanelTitle title="业务员销售排行" subTitle="本月" color="#fdcb6e" />
              <RankingChart data={staffRanking} />
            </PanelBox>

            {/* 实时动态 */}
            <PanelBox>
              <PanelTitle title="实时业务动态" subTitle="最新 6 条" color="#00d9ff" />
              <div style={{ fontSize: '14px' }}>
                {activities.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '7px 0',
                    borderBottom: i < activities.length - 1 ? '1px solid rgba(0,217,255,0.06)' : 'none',
                  }}>
                    <span style={{
                      fontSize: '13px', color: '#667788',
                      fontFamily: 'monospace', minWidth: '42px',
                    }}>{a.time}</span>
                    <span style={{
                      fontSize: '13px',
                      background: `${a.color}20`,
                      color: a.color,
                      padding: '2px 8px',
                      borderRadius: '3px',
                      border: `1px solid ${a.color}40`,
                      whiteSpace: 'nowrap',
                    }}>{a.type}</span>
                    <span style={{ color: '#666', flex: 1, lineHeight: 1.5 }}>{a.text}</span>
                  </div>
                ))}
              </div>
            </PanelBox>
          </div>
        </div>
      </div>

      {/* 全局滚动条样式 */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,217,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(0,217,255,0.25); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,217,255,0.4); }
      `}</style>
    </div>
  );
}
