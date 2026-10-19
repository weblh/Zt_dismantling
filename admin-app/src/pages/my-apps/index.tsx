import { Card } from 'antd';
import { CarOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';

const FingerprintIcon = () => (
  <svg viewBox="0 0 48 48" width={56} height={56} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8C24 8 14 14 14 26C14 34 18 40 21 42" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
    <path d="M24 8C24 8 34 14 34 26C34 32 31 37 28 40" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
    <path d="M24 13C24 13 19 17 19 26C19 31 21 35 22.5 37" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
    <path d="M24 13C24 13 29 17 29 26C29 31 27 35 25.5 37" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
    <path d="M24 18C24 18 21 20 21 26C21 29 22 31 22.5 32.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M24 18C24 18 27 20 27 26C27 29 26 31 25.5 32.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M24 22C24 22 22.5 23.5 22.5 26C22.5 27.5 22.8 28.5 23 29" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
    <path d="M24 22C24 22 25.5 23.5 25.5 26C25.5 27.5 25.2 28.5 25 29" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
    <path d="M18 21C18 21 15.5 23.5 15 28C15 34 17 39 19.5 41" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
    <path d="M30 21C30 21 32.5 23.5 33 28C33 34 31 39 28.5 41" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
  </svg>
);

const apps = [
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
  {
    id: 'inspection',
    name: '华成攒碳安环巡检',
    icon: <FingerprintIcon />,
    color: '#5BBDBF',
  },
];

export default function MyApps({ onSelectApp }: { onSelectApp: (appId: string) => void }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ padding: isMobile ? 12 : 24, background: '#f5f5f5', minHeight: 'calc(100vh - 50px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 16 : 24 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 500 }}>我的应用</h2>
        <AppstoreOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: isMobile ? 12 : 24 }}>
        {apps.map((app) => (
          <Card
            key={app.id}
            hoverable
            onClick={() => onSelectApp(app.id)}
            style={{ cursor: 'pointer', borderRadius: 8, textAlign: 'center', transition: 'all 0.3s' }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <div style={{
              width: isMobile ? 64 : 80,
              height: isMobile ? 64 : 80,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${app.color} 0%, ${app.color}cc 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: `0 4px 12px ${app.color}40`,
              overflow: 'hidden',
            }}>
              {app.icon}
            </div>
            <div style={{ fontSize: isMobile ? 13 : 14, color: '#333', fontWeight: 500 }}>{app.name}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}