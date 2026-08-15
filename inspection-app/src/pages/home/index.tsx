import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginTop: 0 }}>
          华成攒碳安环巡检
        </Title>
        <Paragraph type="secondary">
          本应用为独立前端壳，后续用于安环巡检相关业务逻辑。当前可登录并通过顶部 Tab 在新窗口切换到其他系统。
        </Paragraph>
      </Card>
    </div>
  );
}
