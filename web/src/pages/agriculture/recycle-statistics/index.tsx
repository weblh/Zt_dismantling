import { useState } from 'react';
import {
  ReloadOutlined, SettingOutlined, BellOutlined, QuestionOutlined,
  UserOutlined, DownOutlined, SyncOutlined,
} from '@ant-design/icons';

const cardData = [
  { title: '注销统计(营运)', value: 0 },
  { title: '移交手续统计(营运)', value: 84 },
  { title: '回收证明统计(营运)', value: 41 },
  { title: '注销统计(非营运)', value: 459 },
  { title: '移交手续统计(非营运)', value: 1834 },
  { title: '回收证明统计(非营运)', value: 973 },
];

const dateTabs = ['日', '周', '月', '年'];

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #0f2a4a 0%, #0a1f3a 100%)',
        borderRadius: 8,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        border: '1px solid rgba(0, 200, 255, 0.1)',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #00d4ff, #00ff88, #00d4ff)',
          padding: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 16px rgba(0, 212, 255, 0.3)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#0a1f3a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none">
            <path
              d="M12 2L4 7v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V7l-8-5z"
              fill="url(#gemGrad)"
              stroke="#00d4ff"
              strokeWidth="0.5"
            />
            <defs>
              <linearGradient id="gemGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4facfe" />
                <stop offset="1" stopColor="#00c6ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#a8c5e0', fontSize: 15, marginBottom: 8 }}>{title}</div>
        <div style={{ color: '#00d4ff', fontSize: 42, fontWeight: 600, lineHeight: 1, textShadow: '0 0 20px rgba(0, 212, 255, 0.4)' }}>
          {value.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default function RecycleStatisticsDashboard() {
  const [activeDateTab, setActiveDateTab] = useState('日');
  const [subTab, setSubTab] = useState('今天');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a1628',
        padding: 0,
        color: '#fff',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: '#0d1b2a',
          borderBottom: '1px solid rgba(0, 200, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, color: '#e0e8f0' }}>回收证明统计看板</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#a8c5e0' }}>
          <ReloadOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          <SettingOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          <QuestionOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4facfe, #00c6ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
            }}
          >
            <UserOutlined />
          </div>
        </div>
      </div>

      {/* Filter section */}
      <div style={{ padding: '16px 20px 0' }}>
        <div
          style={{
            background: '#0d1b2a',
            borderRadius: 8,
            padding: '12px 16px',
            border: '1px solid rgba(0, 200, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Date type tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#a8c5e0', fontSize: 14 }}>日期</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {dateTabs.map((tab) => (
                  <div
                    key={tab}
                    onClick={() => setActiveDateTab(tab)}
                    style={{
                      padding: '4px 14px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                      background: activeDateTab === tab ? '#1890ff' : 'transparent',
                      color: activeDateTab === tab ? '#fff' : '#a8c5e0',
                    }}
                  >
                    {tab}
                  </div>
                ))}
              </div>
            </div>

            {/* Dropdown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                border: '1px solid rgba(0, 200, 255, 0.3)',
                borderRadius: 4,
                cursor: 'pointer',
                color: '#00d4ff',
                fontSize: 13,
              }}
            >
              <span>动态流送</span>
              <DownOutlined style={{ fontSize: 10 }} />
            </div>
          </div>

          {/* Sub tabs */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {['今天', '本周', '本月', '本年'].map((tab) => (
              <div
                key={tab}
                onClick={() => setSubTab(tab)}
                style={{
                  padding: '4px 14px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  background: subTab === tab ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                  color: subTab === tab ? '#00d4ff' : '#a8c5e0',
                  border: subTab === tab ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent',
                }}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle section - chart area */}
      <div style={{ padding: '16px 20px 0' }}>
        <div
          style={{
            background: '#0d1b2a',
            borderRadius: 8,
            padding: '16px',
            border: '1px solid rgba(0, 200, 255, 0.1)',
            minHeight: 180,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ color: '#e0e8f0', fontSize: 15 }}>利润数据统计</span>
            <SyncOutlined style={{ color: '#a8c5e0', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0', color: '#5a7a9a' }}>
            <SyncOutlined style={{ fontSize: 28, marginBottom: 12 }} />
            <span style={{ fontSize: 13 }}>暂无数据</span>
          </div>
        </div>
      </div>

      {/* Bottom section - stat cards */}
      <div style={{ padding: '16px 20px' }}>
        <div
          style={{
            background: '#0d1b2a',
            borderRadius: 8,
            padding: 20,
            border: '1px solid rgba(0, 200, 255, 0.1)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {cardData.map((item) => (
              <StatCard key={item.title} title={item.title} value={item.value} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
