import { useState } from 'react';
import { Button, Modal, message } from 'antd';
import { CloudSyncOutlined, ReloadOutlined } from '@ant-design/icons';
import type { JdyBusinessSyncMode, JdySyncResult } from '@/api/jdy';

type SyncResponse = { data?: JdySyncResult };

type Props = {
  /** 调用对应业务的同步 API：auto=有本地数据则增量、无数据则全量；full=强制全量（仅当前菜单表单） */
  syncFn: (mode?: JdyBusinessSyncMode) => Promise<SyncResponse>;
  onSynced?: () => void;
  /** 全量同步成功后的提示文案后缀 */
  successExtra?: string;
};

/** 业务列表：同步（增量/空库全量）+ 重新同步所有（强制全量，仅本菜单） */
export default function BusinessJdySyncButtons({ syncFn, onSynced, successExtra }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [fullSyncing, setFullSyncing] = useState(false);

  const run = async (mode: JdyBusinessSyncMode) => {
    const loading = mode === 'full' ? setFullSyncing : setSyncing;
    loading(true);
    try {
      const res = await syncFn(mode);
      const fallback = `${mode === 'full' ? '全量同步成功' : '同步成功'}${successExtra || ''}`;
      message.success(res.data?.message || fallback);
      onSynced?.();
    } catch {
      // interceptor
    } finally {
      loading(false);
    }
  };

  const handleFullSync = () => {
    Modal.confirm({
      title: '重新同步本菜单全部数据？',
      content:
        '仅从简道云重新拉取当前菜单对应表单的全部数据，与本地无数据时点「同步」效果相同。日常有数据时请用「同步」做增量更新。',
      okText: '开始同步',
      cancelText: '取消',
      onOk: () => run('full'),
    });
  };

  return (
    <>
      <Button
        icon={<CloudSyncOutlined />}
        loading={syncing}
        disabled={fullSyncing}
        onClick={() => run('auto')}
      >
        同步
      </Button>
      <Button
        icon={<ReloadOutlined />}
        loading={fullSyncing}
        disabled={syncing}
        onClick={handleFullSync}
      >
        重新同步所有
      </Button>
    </>
  );
}
