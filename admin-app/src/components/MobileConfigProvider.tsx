import { useEffect, type ReactNode } from 'react';
import { ConfigProvider, Grid } from 'antd';

const { useBreakpoint } = Grid;

/**
 * 移动端统一收紧 Modal / Drawer 默认行为，配合 mobile-overlay.css 覆盖写死宽度。
 */
export default function MobileConfigProvider({ children }: { children: ReactNode }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    document.documentElement.classList.toggle('is-mobile', isMobile);
    return () => {
      document.documentElement.classList.remove('is-mobile');
    };
  }, [isMobile]);

  return (
    <ConfigProvider
      modal={{
        centered: isMobile,
        styles: isMobile
          ? {
              body: {
                maxHeight: 'unset',
              },
            }
          : undefined,
      }}
      drawer={{
        styles: isMobile
          ? {
              body: {
                padding: 12,
              },
            }
          : undefined,
      }}
    >
      {children}
    </ConfigProvider>
  );
}
