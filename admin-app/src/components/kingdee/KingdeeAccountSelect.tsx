import { Alert, Descriptions, Form, Select } from 'antd';
import { Link } from 'react-router-dom';
import type { KingdeeAccountConfig } from '@/api/kingdee';

interface KingdeeAccountSelectProps {
  accounts: KingdeeAccountConfig[];
  loading?: boolean;
  onChange?: (accountId: number, account?: KingdeeAccountConfig) => void;
}

export default function KingdeeAccountSelect({
  accounts,
  loading,
  onChange,
}: KingdeeAccountSelectProps) {
  const accountId = Form.useWatch('accountId') as number | undefined;
  const selected = accounts.find((item) => item.id === accountId);

  if (!loading && accounts.length === 0) {
    return (
      <Alert
        type="warning"
        showIcon
        message="暂无可用金蝶账号"
        description={
          <>
            请先在 <Link to="/kingdee/account">金蝶账号管理</Link> 中添加并启用账号。
          </>
        }
      />
    );
  }

  return (
    <>
      <Form.Item
        label="金蝶账号"
        name="accountId"
        rules={[{ required: true, message: '请选择金蝶账号' }]}
      >
        <Select
          loading={loading}
          placeholder="请选择金蝶账号"
          options={accounts.map((item) => ({
            value: item.id,
            label: item.isDefault === 1 ? `${item.accountName}（默认）` : item.accountName,
          }))}
          onChange={(id) => {
            const account = accounts.find((item) => item.id === id);
            onChange?.(id, account);
          }}
        />
      </Form.Item>
      {selected && (
        <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="金蝶地址">{selected.kingdeeUrl}</Descriptions.Item>
          <Descriptions.Item label="账套ID">{selected.dbId}</Descriptions.Item>
          <Descriptions.Item label="用户名">{selected.username}</Descriptions.Item>
          <Descriptions.Item label="账簿编码">{selected.orgCompanyCode || '-'}</Descriptions.Item>
        </Descriptions>
      )}
    </>
  );
}
