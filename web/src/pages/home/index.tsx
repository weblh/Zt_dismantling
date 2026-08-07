import { useState, useEffect } from 'react';
import { Select, DatePicker } from 'antd';
import dayjs from 'dayjs';

interface StatData {
  label: string;
  value: number;
  isCircle: boolean;
}

interface RowData {
  title: string;
  stats: StatData[];
}

const mockRowData: RowData[] = [
  {
    title: '累计',
    stats: [
      { label: '累计收货', value: 5117, isCircle: false },
      { label: '累计查验', value: 5130, isCircle: true },
      { label: '累计入库', value: 5130, isCircle: false },
      { label: '累计放油', value: 5108, isCircle: true },
      { label: '累计拆解', value: 5108, isCircle: false },
      { label: '累计综合拆解', value: 5110, isCircle: true },
    ],
  },
  {
    title: '月度',
    stats: [
      { label: '月度收货', value: 401, isCircle: false },
      { label: '月度查验', value: 430, isCircle: true },
      { label: '月度入库', value: 430, isCircle: false },
      { label: '月度放油', value: 470, isCircle: true },
      { label: '月度拆解', value: 470, isCircle: false },
      { label: '月度综合拆解', value: 470, isCircle: true },
    ],
  },
  {
    title: '今日',
    stats: [
      { label: '今日收货', value: 0, isCircle: false },
      { label: '今日查验', value: 0, isCircle: true },
      { label: '今日入库', value: 0, isCircle: false },
      { label: '今日放油', value: 0, isCircle: true },
      { label: '今日拆解', value: 0, isCircle: false },
      { label: '今日综合拆解', value: 0, isCircle: true },
    ],
  },
];

const chartData = [
  { label: '5月', value: 60 },
  { label: '5月', value: 65 },
  { label: '5月', value: 51 },
  { label: '5月', value: 52 },
  { label: '5月', value: 71 },
  { label: '5月', value: 67 },
  { label: '5月', value: 56 },
  { label: '6月', value: 63 },
  { label: '6月', value: 64 },
  { label: '6月', value: 73 },
  { label: '6月', value: 72 },
  { label: '6月', value: 62 },
  { label: '6月', value: 53 },
  { label: '6月', value: 55 },
  { label: '6月', value: 56 },
  { label: '6月', value: 53 },
];

function CircleStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '15px',
      background: 'rgba(5, 20, 35, 0.9)',
      borderRadius: '0',
      border: '1px solid rgba(0, 217, 255, 0.1)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 外圈刻度装饰 */}
      <svg style={{
        position: 'absolute',
        width: '160px',
        height: '160px',
        zIndex: 1,
        pointerEvents: 'none',
      }} viewBox="0 0 160 160">
        {[...Array(36)].map((_, i) => {
          const angle = (i * 10 - 90) * (Math.PI / 180);
          const innerRadius = 70;
          const outerRadius = i % 3 === 0 ? 78 : 74;
          const x1 = 80 + innerRadius * Math.cos(angle);
          const y1 = 80 + innerRadius * Math.sin(angle);
          const x2 = 80 + outerRadius * Math.cos(angle);
          const y2 = 80 + outerRadius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(0, 217, 255, 0.4)"
              strokeWidth={i % 3 === 0 ? 2 : 1}
            />
          );
        })}
      </svg>
      
      {/* 圆形仪表盘 */}
      <div style={{
        width: '130px',
        height: '130px',
        borderRadius: '50%',
        background: 'conic-gradient(from -90deg, #6c5ce7 0%, #6c5ce7 25%, #00d9ff 45%, rgba(5, 20, 35, 0.95) 45%, rgba(5, 20, 35, 0.95) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 0 30px rgba(0, 217, 255, 0.4), inset 0 0 20px rgba(108, 92, 231, 0.1)',
      }}>
        {/* 内圈 */}
        <div style={{
          width: '95px',
          height: '95px',
          borderRadius: '50%',
          background: 'rgba(5, 20, 35, 0.98)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          border: '2px solid rgba(0, 217, 255, 0.35)',
          boxShadow: 'inset 0 0 12px rgba(0, 217, 255, 0.08)',
        }}>
          <span style={{ fontSize: '11px', color: '#00d9ff', marginBottom: '2px', opacity: '0.85' }}>{label}</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#00d9ff', textShadow: '0 0 15px rgba(0, 217, 255, 0.6)' }}>{value}</span>
        </div>
      </div>
    </div>
  );
}

function BoxStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      padding: '12px 15px',
      background: 'rgba(5, 20, 35, 0.9)',
      borderRadius: '0',
      border: '1px solid rgba(0, 217, 255, 0.1)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 标签 */}
      <span style={{ fontSize: '11px', color: '#00d9ff', marginBottom: '8px', opacity: '0.85', fontWeight: '500' }}>{label}</span>
      {/* 数值框 */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(0, 217, 255, 0.06) 0%, rgba(9, 132, 227, 0.03) 100%)',
        padding: '10px 20px',
        borderRadius: '0',
        border: '1px solid rgba(0, 217, 255, 0.35)',
        borderLeft: '3px solid #00d9ff',
        boxShadow: '0 0 12px rgba(0, 217, 255, 0.12)',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
      }}>
        {/* 底部斜切装饰 */}
        <div style={{
          position: 'absolute',
          bottom: '-6px',
          left: '0',
          right: '0',
          height: '8px',
          background: `
            linear-gradient(135deg, transparent 0%, rgba(0, 217, 255, 0.3) 10%, rgba(0, 217, 255, 0.3) 90%, transparent 100%),
            linear-gradient(90deg, rgba(0, 217, 255, 0.15) 0%, rgba(0, 217, 255, 0.2) 50%, rgba(0, 217, 255, 0.15) 100%)
          `,
          clipPath: 'polygon(0 100%, 4px 0, 12px 60%, 20px 0, 28px 60%, 36px 0, 44px 60%, 52px 0, 60px 60%, 68px 0, 76px 60%, 84px 0, 92px 60%, 100px 0, 108px 60%, 100% 0, 100% 100%)',
        }} />
        <span style={{ fontSize: '30px', fontWeight: 'bold', color: '#00d9ff', textShadow: '0 0 12px rgba(0, 217, 255, 0.5)' }}>{value}</span>
      </div>
    </div>
  );
}

function BarChart({ title, data }: { title: string; data: typeof chartData }) {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = '16px';
  
  return (
    <div style={{
      background: 'rgba(5, 20, 35, 0.9)',
      borderRadius: '0',
      border: '1px solid rgba(0, 217, 255, 0.1)',
      padding: '18px',
      height: '180px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 标题 */}
      <div style={{ fontSize: '13px', color: '#00d9ff', marginBottom: '12px', fontWeight: '600', opacity: '0.9' }}>
        {title}
      </div>
      {/* Y轴刻度 */}
      <div style={{
        position: 'absolute',
        left: '0',
        top: '42px',
        height: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: 'rgba(0, 217, 255, 0.5)',
        paddingLeft: '4px',
      }}>
        <span>80</span>
        <span>60</span>
        <span>40</span>
      </div>
      {/* 图表区域 */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '120px',
        paddingTop: '12px',
        paddingLeft: '32px',
        borderTop: '1px dashed rgba(0, 217, 255, 0.2)',
      }}>
        {data.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: `${barWidth}`,
          }}>
            <span style={{ fontSize: '10px', color: '#00d9ff', marginBottom: '5px', opacity: '0.8' }}>{item.value}</span>
            <div style={{
              width: `${barWidth}`,
              height: `${(item.value / maxValue) * 100}%`,
              background: 'linear-gradient(180deg, #00d9ff 0%, #0984e3 100%)',
              borderRadius: '2px 2px 0 0',
              boxShadow: '0 0 8px rgba(0, 217, 255, 0.5)',
              minHeight: '4px',
              position: 'relative',
            }}>
              {/* 柱状图顶部高光 */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '3px',
                background: '#ffffff',
                opacity: '0.6',
                borderRadius: '2px 2px 0 0',
              }} />
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(0, 217, 255, 0.5)', marginTop: '5px' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState('今年');
  const [customDate, setCustomDate] = useState<dayjs.Dayjs | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '0',
      margin: '0',
      position: 'relative',
      overflow: 'hidden',
      background: '#051423',
    }}>
      {/* 网格背景 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 217, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 217, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        zIndex: 0,
      }} />
      {/* 顶部装饰线 */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #00d9ff 0%, #6c5ce7 50%, #00d9ff 100%)',
        zIndex: 10,
      }} />
      <div style={{
        position: 'absolute',
        top: '4px',
        left: '0',
        right: '0',
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(0, 217, 255, 0.3) 50%, transparent 100%)',
        zIndex: 10,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* 顶部导航栏 */}
      <div style={{
        background: 'linear-gradient(90deg, #0a1628 0%, #0d1f35 30%, #0d1f35 70%, #0a1628 100%)',
        padding: '6px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 217, 255, 0.1)',
        position: 'relative',
      }}>
        {/* 左侧装饰 */}
        <div style={{
          position: 'absolute',
          left: '0',
          top: '0',
          bottom: '0',
          width: '50px',
          background: 'linear-gradient(90deg, rgba(0, 217, 255, 0.06) 0%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute',
          left: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '10px',
          height: '32px',
          background: 'linear-gradient(90deg, rgba(0, 217, 255, 0.7) 0%, transparent 100%)',
        }} />
        {/* 右侧装饰 */}
        <div style={{
          position: 'absolute',
          right: '0',
          top: '0',
          bottom: '0',
          width: '50px',
          background: 'linear-gradient(270deg, rgba(0, 217, 255, 0.06) 0%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '10px',
          height: '32px',
          background: 'linear-gradient(270deg, rgba(0, 217, 255, 0.7) 0%, transparent 100%)',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '60px',
        }}>
          {/* 标题容器 */}
          <div style={{
            background: 'linear-gradient(90deg, #1a1a4e 0%, #0d2847 50%, #1a1a4e 100%)',
            padding: '6px 30px',
            borderRadius: '0',
            border: '1px solid rgba(0, 217, 255, 0.3)',
            boxShadow: '0 0 15px rgba(0, 217, 255, 0.1)',
            position: 'relative',
            clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
          }}>
            {/* 左侧三条斜线 */}
            <span style={{
              color: '#00d9ff',
              marginRight: '10px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>///</span>
            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#00d9ff' }}>华成攒碳汽车拆解有限公司业务一览</span>
            {/* 右侧三条斜线 */}
            <span style={{
              color: '#00d9ff',
              marginLeft: '10px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>///</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          paddingRight: '60px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '12px', color: 'rgba(0, 217, 255, 0.7)' }}>提交时间</span>
            <span style={{
              fontSize: '12px',
              color: '#00d9ff',
              background: 'rgba(0, 217, 255, 0.06)',
              padding: '4px 8px',
              borderRadius: '0',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              fontWeight: '500',
            }}>动态筛选 ▼</span>
            <Select
              value={selectedYear}
              onChange={(value) => {
                setSelectedYear(value);
                if (value !== '自定义') {
                  setCustomDate(null);
                }
              }}
              options={[
                  { value: '今日', label: '今日' },
                  { value: '昨日', label: '昨日' },
                  { value: '本周', label: '本周' },
                  { value: '本月', label: '本月' },
                  { value: '上月', label: '上月' },
                  { value: '今年', label: '今年' },
                  { value: '去年', label: '去年' },
                  { value: '自定义', label: '自定义' },
                ]}
              style={{ width: '100px', background: 'rgba(5, 20, 35, 0.9)', border: '1px solid rgba(0, 217, 255, 0.3)', color: '#00d9ff', borderRadius: '0' }}
              dropdownStyle={{ background: '#051423', border: '1px solid rgba(0, 217, 255, 0.3)', color: '#00d9ff' }}
            />
            {selectedYear === '自定义' && (
              <DatePicker
                value={customDate}
                onChange={(date) => setCustomDate(date)}
                style={{ width: '150px', background: 'rgba(5, 20, 35, 0.9)', border: '1px solid rgba(0, 217, 255, 0.3)', color: '#00d9ff', borderRadius: '0' }}
                picker="date"
                placeholder="选择日期"
              />
            )}
          </div>

          {/* 时间显示框 */}
          <div style={{
            background: 'rgba(5, 20, 35, 0.9)',
            padding: '8px 22px',
            borderRadius: '0',
            border: '2px solid rgba(0, 217, 255, 0.5)',
            boxShadow: '0 0 15px rgba(0, 217, 255, 0.3), inset 0 0 10px rgba(0, 217, 255, 0.08)',
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#00d9ff', textShadow: '0 0 10px rgba(0, 217, 255, 0.4)' }}>
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
      }}>
        {/* 科技曲线装饰 - 上层 */}
        <svg style={{
          position: 'absolute',
          top: '60px',
          left: '0',
          width: '100%',
          height: '200px',
          zIndex: 0,
          pointerEvents: 'none',
        }}>
          {/* 曲线1 */}
          <path
            d="M -100 100 Q 300 50, 600 120 T 1300 80"
            fill="none"
            stroke="rgba(0, 217, 255, 0.15)"
            strokeWidth="2"
          />
          <path
            d="M -100 110 Q 300 60, 600 130 T 1300 90"
            fill="none"
            stroke="rgba(0, 217, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray="10,5"
          />
          {/* 曲线2 */}
          <path
            d="M -50 150 Q 400 100, 800 160 T 1400 120"
            fill="none"
            stroke="rgba(0, 217, 255, 0.12)"
            strokeWidth="2"
          />
        </svg>
        {/* 科技曲线装饰 - 中层 */}
        <svg style={{
          position: 'absolute',
          top: '200px',
          left: '0',
          width: '100%',
          height: '200px',
          zIndex: 0,
          pointerEvents: 'none',
        }}>
          {/* 曲线3 */}
          <path
            d="M -150 50 Q 250 100, 550 60 T 1200 100"
            fill="none"
            stroke="rgba(0, 217, 255, 0.15)"
            strokeWidth="2"
          />
          <path
            d="M -150 60 Q 250 110, 550 70 T 1200 110"
            fill="none"
            stroke="rgba(0, 217, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray="8,4"
          />
          {/* 曲线4 */}
          <path
            d="M -100 120 Q 350 70, 700 130 T 1350 90"
            fill="none"
            stroke="rgba(0, 217, 255, 0.12)"
            strokeWidth="2"
          />
        </svg>
        {/* 科技曲线装饰 - 下层 */}
        <svg style={{
          position: 'absolute',
          top: '340px',
          left: '0',
          width: '100%',
          height: '200px',
          zIndex: 0,
          pointerEvents: 'none',
        }}>
          {/* 曲线5 */}
          <path
            d="M -200 80 Q 200 130, 500 90 T 1150 130"
            fill="none"
            stroke="rgba(0, 217, 255, 0.15)"
            strokeWidth="2"
          />
          <path
            d="M -200 90 Q 200 140, 500 100 T 1150 140"
            fill="none"
            stroke="rgba(0, 217, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray="10,5"
          />
          {/* 曲线6 */}
          <path
            d="M -150 150 Q 300 100, 650 160 T 1300 120"
            fill="none"
            stroke="rgba(0, 217, 255, 0.12)"
            strokeWidth="2"
          />
        </svg>

        {/* 数据卡片行 */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {mockRowData.map((row, rowIndex) => (
            <div key={rowIndex} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              marginBottom: '8px',
            }}>
              {row.stats.map((stat, statIndex) => (
                stat.isCircle ? (
                  <CircleStat key={statIndex} label={stat.label} value={stat.value} />
                ) : (
                  <BoxStat key={statIndex} label={stat.label} value={stat.value} />
                )
              ))}
            </div>
          ))}
        </div>

        {/* 图表区域 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          position: 'relative',
          zIndex: 1,
        }}>
          <BarChart title="业务收货统计" data={chartData} />
          <BarChart title="过磅统计" data={chartData} />
        </div>
      </div>
      </div>

      <style>{`
        .ant-select-dropdown-menu-item {
          color: #00d9ff !important;
        }
        .ant-select-dropdown-menu-item:hover {
          color: #fff !important;
          background: rgba(0, 217, 255, 0.1) !important;
        }
        .ant-select-item-option-content {
          color: #00d9ff !important;
        }
        .ant-select-dropdown {
          color: #00d9ff !important;
          background: #051423 !important;
          border: 1px solid rgba(0, 217, 255, 0.3) !important;
        }
        .ant-select-dropdown-menu {
          color: #00d9ff !important;
        }
        .ant-select-dropdown-menu-item-selected {
          background: rgba(0, 217, 255, 0.2) !important;
          color: #00d9ff !important;
        }
        .ant-select-item-option-selected {
          background: rgba(0, 217, 255, 0.2) !important;
          color: #00d9ff !important;
        }
        .ant-picker {
          color: #00d9ff !important;
          background: rgba(5, 20, 35, 0.9) !important;
          border: 1px solid rgba(0, 217, 255, 0.3) !important;
        }
        .ant-picker-input > input {
          color: #00d9ff !important;
        }
        .ant-select-selector {
          background: rgba(5, 20, 35, 0.9) !important;
          border: 1px solid rgba(0, 217, 255, 0.3) !important;
          color: #00d9ff !important;
          border-radius: 0 !important;
        }
      `}</style>
    </div>
  );
}
