import { getVisibleApps, openAppInNewWindow, type AppCode } from '@/config/apps';

interface AppSwitchTabsProps {
  currentApp: AppCode;
}

export default function AppSwitchTabs({ currentApp }: AppSwitchTabsProps) {
  const apps = getVisibleApps();

  if (apps.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
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
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              cursor: active ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              lineHeight: 1.4,
              transition: 'all 0.2s',
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
