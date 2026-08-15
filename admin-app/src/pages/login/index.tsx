import { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { login } from '@/api/auth';
import { canAccessApp } from '@/config/apps';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const res = await login(values);
      if (!canAccessApp('receipt', res.data.user)) {
        message.error('当前账号无权访问「汽车拆解-收车」');
        return;
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      message.success('登录成功');
      navigate('/home');
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img className="login-logo" src="/favicon.svg" alt="logo" />
          <h1>汽车拆解-收车</h1>
          <p style={{ color: '#999', marginTop: 8 }}>管理后台登录</p>
        </div>
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" size="large" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
        <p style={{ textAlign: 'center', color: '#bbb', fontSize: 12 }}>
          默认账号：admin / admin123
        </p>
      </div>
    </div>
  );
}
