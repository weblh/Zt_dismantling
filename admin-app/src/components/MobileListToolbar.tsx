import type { CSSProperties, ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface MobileListToolbarProps {
  left?: ReactNode;
  right?: ReactNode;
  style?: CSSProperties;
}

/** 列表页双区工具栏：移动端纵向堆叠并允许换行 */
export default function MobileListToolbar({ left, right, style }: MobileListToolbarProps) {
  const isMobile = useIsMobile();
  return (
    <div
      className="mobile-list-toolbar"
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
        ...style,
      }}
    >
      {left ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 0 }}>{left}</div> : null}
      {right ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 0, width: isMobile ? '100%' : undefined }}>
          {right}
        </div>
      ) : null}
    </div>
  );
}
