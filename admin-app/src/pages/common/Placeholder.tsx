import React from 'react';
import { Result, Button } from 'antd';

interface PlaceholderProps {
  title: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Result
        status="info"
        title={title}
        subTitle="此页面正在开发中..."
        extra={[
          <Button type="primary" key="console">
            开始使用
          </Button>,
        ]}
      />
    </div>
  );
};

export default Placeholder;
