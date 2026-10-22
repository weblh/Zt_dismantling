import { useEffect, useState } from 'react';
import { Tabs, Timeline, Empty, Input, Button, Space, Spin, message } from 'antd';
import { getStoredUser } from '@/config/apps';
import {
  addBizComment,
  getBizComments,
  getBizDataLogs,
  type DataLogItem,
  type RecordComment,
} from '@/api/bizRecordMeta';

interface Props {
  bizKey: string;
  recordKey?: string;
  /** 新建未落库时仅展示提示 */
  emptyHint?: string;
  height?: number | string;
}

/** 右侧数据日志 + 评论（简道云风格） */
export default function BizRecordSidePanel({
  bizKey,
  recordKey,
  emptyHint = '保存后可查看数据日志与评论',
  height = 420,
}: Props) {
  const [tab, setTab] = useState('logs');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<DataLogItem[]>([]);
  const [comments, setComments] = useState<RecordComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    if (!recordKey) {
      setLogs([]);
      setComments([]);
      return;
    }
    setLoading(true);
    try {
      const [l, c] = await Promise.all([
        getBizDataLogs(bizKey, recordKey),
        getBizComments(bizKey, recordKey),
      ]);
      setLogs(l.data || []);
      setComments(c.data || []);
    } catch {
      setLogs([]);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTab('logs');
    setCommentText('');
    load();
  }, [bizKey, recordKey]);

  const handlePostComment = async () => {
    const text = commentText.trim();
    if (!text) {
      message.warning('请输入评论内容');
      return;
    }
    if (!recordKey) {
      message.warning(emptyHint);
      return;
    }
    setPosting(true);
    try {
      const user = getStoredUser();
      await addBizComment(bizKey, recordKey, text, user.nickname || user.username || '系统');
      setCommentText('');
      message.success('评论已发表');
      const res = await getBizComments(bizKey, recordKey);
      setComments(res.data || []);
    } catch {
      // interceptor
    } finally {
      setPosting(false);
    }
  };

  if (!recordKey) {
    return (
      <div
        style={{
          height,
          borderLeft: '1px solid #f0f0f0',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Empty description={emptyHint} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div style={{ height, borderLeft: '1px solid #f0f0f0', padding: '0 12px 12px', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        size="small"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        items={[
          {
            key: 'logs',
            label: '数据日志',
            children: loading ? (
              <Spin />
            ) : logs.length === 0 ? (
              <Empty description="暂无数据日志" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ maxHeight: typeof height === 'number' ? height - 80 : 340, overflow: 'auto' }}>
                <Timeline
                  items={logs.map((item) => ({
                    children: (
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {item.operatorName || '-'} · {item.action || '变更'}
                        </div>
                        <div style={{ color: '#666', fontSize: 12 }}>{item.createdAt || ''}</div>
                        {item.summary ? (
                          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{item.summary}</div>
                        ) : null}
                      </div>
                    ),
                  }))}
                />
              </div>
            ),
          },
          {
            key: 'comments',
            label: '评论',
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 280 }}>
                <div style={{ flex: 1, marginBottom: 12, maxHeight: 280, overflow: 'auto' }}>
                  {loading ? (
                    <Spin />
                  ) : comments.length === 0 ? (
                    <Empty description="暂无评论" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <Timeline
                      items={comments.map((c) => ({
                        children: (
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>
                              {c.authorName || '-'} · {c.createdAt || ''}
                            </div>
                            <div style={{ marginTop: 4 }}>{c.content}</div>
                          </div>
                        ),
                      }))}
                    />
                  )}
                </div>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="发表评论"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onPressEnter={handlePostComment}
                  />
                  <Button type="primary" loading={posting} onClick={handlePostComment}>
                    发送
                  </Button>
                </Space.Compact>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
