import type { CSSProperties, ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PageHeaderBarProps {
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  style?: CSSProperties;
}

/** 页面标题 + 操作区，移动端自动换行堆叠 */
export default function PageHeaderBar({ title, description, extra, style }: PageHeaderBarProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className="page-header-bar"
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        gap: 12,
        marginBottom: 16,
        ...style,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 20 }}>{title}</h2>
        {description ? (
          <div style={{ color: '#888', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{description}</div>
        ) : null}
      </div>
      {extra ? (
        <div
          className="page-header-bar-extra"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: isMobile ? 'flex-start' : 'flex-end',
          }}
        >
          {extra}
        </div>
      ) : null}
    </div>
  );
}
