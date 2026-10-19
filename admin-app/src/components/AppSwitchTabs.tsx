import { getVisibleApps, openAppInNewWindow, type AppCode } from '@/config/apps';

interface AppSwitchTabsProps {
  currentApp: AppCode;
  /** 移动端压缩按钮尺寸并允许横向滚动 */
  compact?: boolean;
}

export default function AppSwitchTabs({ currentApp, compact = false }: AppSwitchTabsProps) {
  const apps = getVisibleApps();

  if (apps.length === 0) {
    return null;
  }

  return (
    <div
      className="app-switch-tabs"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 6 : 8,
        flex: 1,
        minWidth: 0,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {apps.map((app) => {
        const active = app.code === currentApp;
        return (
          <button
            key={app.code}
            type="button"
            onClick={() => {
              if (!active) {
                openAppInNewWindow(app.url);
              }
            }}
            style={{
              border: active ? '1px solid #13227a' : '1px solid #d9d9d9',
              background: active ? '#13227a' : '#fff',
              color: active ? '#fff' : '#333',
              borderRadius: 6,
              padding: compact ? '4px 10px' : '6px 14px',
              fontSize: compact ? 12 : 13,
              fontWeight: active ? 600 : 400,
              cursor: active ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              lineHeight: 1.4,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            title={active ? '当前应用' : `新窗口打开：${app.name}`}
          >
            {app.name}
          </button>
        );
      })}
    </div>
  );
}
