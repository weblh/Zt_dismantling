import { useEffect, useState } from 'react';
import { Button, Divider, Form, Input, Tabs, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dingtalkFreeLogin, dingtalkQrCallback, getDingtalkQrConfig, login } from '@/api/auth';
import { canAccessApp } from '@/config/apps';
import { isDingTalkEnv, requestDingTalkAuthCode } from '@/utils/dingtalk';
import { getToken, setAuth } from '@/utils/authStorage';

function persistLogin(token: string, user: unknown) {
  setAuth(token, user);
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [freeLoading, setFreeLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (getToken()) {
      navigate('/app', { replace: true });
      return;
    }
    const code = params.get('code');
    const state = params.get('state');
    if (code) {
      void handleOauthCallback(code, state || '');
      return;
    }
    void loadQr();
    if (isDingTalkEnv()) {
      void tryFreeLogin();
    }
  }, [navigate, params]);

  const loadQr = async () => {
    try {
      setQrLoading(true);
      const res = await getDingtalkQrConfig();
      setAuthUrl(res.data.authUrl);
    } catch {
      // ignore
    } finally {
      setQrLoading(false);
    }
  };

  const handleOauthCallback = async (code: string, state: string) => {
    try {
      setQrLoading(true);
      const res = await dingtalkQrCallback({ code, state });
      persistLogin(res.data.token, res.data.user);
      message.success('钉钉登录成功');
      navigate('/app', { replace: true });
    } catch {
      // handled
    } finally {
      setQrLoading(false);
    }
  };

  const tryFreeLogin = async () => {
    try {
      setFreeLoading(true);
      const authCode = await requestDingTalkAuthCode();
      const res = await dingtalkFreeLogin({ authCode });
      persistLogin(res.data.token, res.data.user);
      message.success('钉钉免登成功');
      navigate('/app', { replace: true });
    } catch (e) {
      console.warn('钉钉免登未完成', e);
    } finally {
      setFreeLoading(false);
    }
  };

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const res = await login(values);
      if (!canAccessApp('receipt', res.data.user)) {
        message.error('当前账号无权访问「汽车拆解-收车」');
        return;
      }
      persistLogin(res.data.token, res.data.user);
      message.success('登录成功');
      navigate('/app');
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
          <p style={{ color: '#999', marginTop: 8 }}>自建平台 · 钉钉账号登录</p>
        </div>
        <Tabs
          items={[
            {
              key: 'dingtalk',
              label: '钉钉登录',
              children: (
                <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={qrLoading}
                    disabled={!authUrl}
                    onClick={() => {
                      if (authUrl) window.location.href = authUrl;
                    }}
                  >
                    钉钉扫码 / 授权登录
                  </Button>
                  <Divider plain>或</Divider>
                  <Button block loading={freeLoading} onClick={() => void tryFreeLogin()}>
                    钉钉工作台免登
                  </Button>
                  <p style={{ color: '#bbb', fontSize: 12, marginTop: 12 }}>
                    钉钉开放平台回调需配置为：
                    {`${window.location.origin}${String(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')}login`}
                  </p>
                </div>
              ),
            },
            {
              key: 'password',
              label: '账号密码',
              children: (
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
                  <p style={{ textAlign: 'center', color: '#bbb', fontSize: 12 }}>
                    默认账号：admin / admin123（运维兜底）
                  </p>
                </Form>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
