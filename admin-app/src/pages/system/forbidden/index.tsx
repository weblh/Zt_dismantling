import { Button, Result } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="403"
        title="403"
        subTitle={from ? `无权访问页面：${from}` : '无权访问该页面，请联系管理员开通菜单权限'}
        extra={
          <Button type="primary" onClick={() => navigate('/home', { replace: true })}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}
