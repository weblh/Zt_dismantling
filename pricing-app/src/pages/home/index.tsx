import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginTop: 0 }}>
          汽车拆解_收货议价
        </Title>
        <Paragraph type="secondary">
          本应用为独立前端壳，后续用于收货议价相关业务逻辑。当前可登录并通过顶部 Tab 在新窗口切换到其他系统。
        </Paragraph>
      </Card>
    </div>
  );
}
