import { Card } from 'antd';
import { CarOutlined, AppstoreOutlined } from '@ant-design/icons';

interface AppItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const apps: AppItem[] = [
  {
    id: 'car-disassembly',
    name: '汽车拆解-收车',
    icon: <CarOutlined style={{ fontSize: 48, color: '#fff' }} />,
    color: '#ff7875',
  },
  {
    id: 'car-pricing',
    name: '汽车拆解_收货议价',
    icon: <CarOutlined style={{ fontSize: 48, color: '#fff' }} />,
    color: '#52c41a',
  },
];

interface MyAppsProps {
  onSelectApp: (appId: string) => void;
}

export default function MyApps({ onSelectApp }: MyAppsProps) {
  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 50px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>我的应用</h2>
        <AppstoreOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 24 }}>
        {apps.map((app) => (
          <Card
            key={app.id}
            hoverable
            onClick={() => onSelectApp(app.id)}
            style={{
              cursor: 'pointer',
              borderRadius: 8,
              textAlign: 'center',
              transition: 'all 0.3s',
            }}
            bodyStyle={{ padding: 24 }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${app.color} 0%, ${app.color}cc 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: `0 4px 12px ${app.color}40`,
              }}
            >
              {app.icon}
            </div>
            <div style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>{app.name}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
