import { useState } from 'react';
import { Button, message } from 'antd';
import { CloudSyncOutlined } from '@ant-design/icons';
import { syncDictsFromJdy } from '@/api/dicts';
import { BIZ_KEY_TO_DICT_TYPE, hydrateBizFromDictServer } from '@/utils/dictHydrate';

/** 基础资料页：从简道云拉取主数据并刷新本地缓存 */
export default function BasicJdySyncButton({ onSynced }: { onSynced?: () => void }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncDictsFromJdy();
      await Promise.all(Object.keys(BIZ_KEY_TO_DICT_TYPE).map((key) => hydrateBizFromDictServer(key)));
      message.success(res.data?.message || '已从简道云同步基础资料');
      onSynced?.();
    } catch {
      // interceptor
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button icon={<CloudSyncOutlined />} loading={syncing} onClick={handleSync}>
      同步简道云
    </Button>
  );
}
