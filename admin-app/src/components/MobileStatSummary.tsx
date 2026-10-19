import type { ReactNode } from 'react';

export interface MobileStatItem {
  label: string;
  value: ReactNode;
  unit?: string;
  color?: string;
}

interface MobileStatSummaryProps {
  title?: string;
  items: MobileStatItem[];
  hint?: string;
}

/** 统计页手机端优先展示的数字卡片汇总 */
export default function MobileStatSummary({ title, items, hint }: MobileStatSummaryProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
        padding: 12,
        marginBottom: 12,
      }}
    >
      {title ? (
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a3a5c', marginBottom: 10 }}>{title}</div>
      ) : null}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: items.length <= 2 ? `repeat(${items.length}, 1fr)` : '1fr 1fr',
          gap: 10,
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              background: '#f7fbff',
              border: '1px solid #e6eef8',
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: 12, color: '#8899aa', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: item.color || '#13227a', lineHeight: 1.2 }}>
              {item.value}
              {item.unit ? (
                <span style={{ fontSize: 12, fontWeight: 500, color: '#99aabb', marginLeft: 4 }}>{item.unit}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {hint ? (
        <div style={{ marginTop: 10, fontSize: 12, color: '#ad6800', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '6px 10px' }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}
