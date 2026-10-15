import { Card, Typography, Button } from 'antd';
import { CloudSyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginTop: 0 }}>
          汽车拆解_收货议价
        </Title>
        <Paragraph type="secondary">
          与收车后台共用同一账号。本应用仅拉取「收货议价」简道云数据，请进入「经营看板」同步查看。
        </Paragraph>
        <Button
          type="primary"
          icon={<CloudSyncOutlined />}
          size="large"
          onClick={() => navigate('/inventory/dashboard')}
        >
          去经营看板同步议价数据
        </Button>
      </Card>
    </div>
  );
}
