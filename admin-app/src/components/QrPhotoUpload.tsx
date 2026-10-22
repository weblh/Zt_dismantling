import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Popover, QRCode, Typography, Upload, message } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import CameraUpload from '@/components/CameraUpload';
import {
  clearQrPhotoSessionApi,
  createQrPhotoSession,
  getQrPhotoSession,
} from '@/api/qrPhoto';
import {
  buildQrPhotoUploadUrl,
  createQrPhotoSessionId,
  getQrPhotoPublicOrigin,
  resolveQrPhotoUrl,
  urlsToUploadFiles,
} from '@/utils/qrPhotoSession';

interface Props {
  fileList: UploadFile[];
  onFiles: (files: UploadFile[]) => void;
  label?: string;
  /** 关闭弹窗时传入 false，会清理服务端会话 */
  active?: boolean;
  /** 扫码页标题，各业务不同 */
  title?: string;
  /** 业务标识，写入扫码 URL 参数 biz= */
  bizKey?: string;
}

/** 拍照 / 选图 / 扫码上传（手机相册先写入服务端会话缓存，提交时再落库） */
export default function QrPhotoUpload({
  fileList,
  onFiles,
  label = '拍照上传',
  active = true,
  title = '手机相册上传',
  bizKey = '',
}: Props) {
  const [sessionId, setSessionId] = useState(() => createQrPhotoSessionId());
  const [qrOpen, setQrOpen] = useState(false);
  const knownUrlsRef = useRef<Set<string>>(new Set());
  const onFilesRef = useRef(onFiles);
  onFilesRef.current = onFiles;
  const fileListRef = useRef(fileList);
  fileListRef.current = fileList;

  useEffect(() => {
    if (!active) return;
    const nextId = createQrPhotoSessionId();
    setSessionId(nextId);
    knownUrlsRef.current = new Set();
    void createQrPhotoSession(nextId, { title, bizKey }).catch(() => {
      message.warning('扫码上传会话创建失败，仍可本机拍照/选图');
    });
  }, [active, title, bizKey]);

  useEffect(() => {
    if (!active || !sessionId) return undefined;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await getQrPhotoSession(sessionId);
        if (cancelled) return;
        const urls = (res.data?.urls || []).map(resolveQrPhotoUrl).filter(Boolean);
        const fresh = urls.filter((u) => !knownUrlsRef.current.has(u));
        if (fresh.length === 0) return;
        fresh.forEach((u) => knownUrlsRef.current.add(u));
        const incoming = urlsToUploadFiles(fresh);
        const map = new Map(fileListRef.current.map((f) => [f.uid, f]));
        // 也按 url 去重
        const byUrl = new Set(
          fileListRef.current.map((f) => f.url || f.thumbUrl || '').filter(Boolean),
        );
        incoming.forEach((f) => {
          const u = f.url || '';
          if (u && byUrl.has(u)) return;
          map.set(f.uid, f);
        });
        onFilesRef.current(Array.from(map.values()));
      } catch {
        // 会话未就绪时忽略
      }
    };

    void poll();
    const timer = window.setInterval(poll, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active, sessionId]);

  useEffect(() => {
    if (active) return;
    if (!sessionId) return;
    void clearQrPhotoSessionApi(sessionId).catch(() => {});
  }, [active, sessionId]);

  const uploadUrl = useMemo(
    () => buildQrPhotoUploadUrl({ sessionId, title, bizKey }),
    [sessionId, title, bizKey],
  );

  const publicOrigin = getQrPhotoPublicOrigin();
  const isLocalhost =
    typeof window !== 'undefined'
    && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    && !String(import.meta.env.VITE_PUBLIC_HOST || '').trim();

  return (
    <div>
      <CameraUpload
        fileList={fileList}
        onFiles={onFiles}
        label={label}
        extra={(
          <Popover
            trigger="click"
            open={qrOpen}
            onOpenChange={setQrOpen}
            placement="bottom"
            content={(
              <div style={{ textAlign: 'center', width: 200 }}>
                <QRCode value={uploadUrl} size={160} />
                <div style={{ marginTop: 8, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                  扫描二维码，在手机上
                  <br />
                  选择相册上传
                </div>
                {isLocalhost && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#fa541c', lineHeight: 1.4 }}>
                    当前是 localhost，手机可能打不开。
                    <br />
                    请在 .env.development 配置
                    <br />
                    VITE_PUBLIC_HOST=http://局域网IP:5173
                  </div>
                )}
                <Typography.Paragraph
                  copyable
                  style={{ marginTop: 8, marginBottom: 0, fontSize: 11, wordBreak: 'break-all' }}
                >
                  {uploadUrl}
                </Typography.Paragraph>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  访问根：{publicOrigin}
                </div>
              </div>
            )}
          >
            <Button icon={<QrcodeOutlined />}>扫码上传</Button>
          </Popover>
        )}
      />
      {fileList.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList: next }) => onFiles(next)}
            beforeUpload={() => false}
            onPreview={(file) => {
              const url = file.url || file.thumbUrl;
              if (url) window.open(url, '_blank');
            }}
          />
        </div>
      )}
      <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
        扫码上传仅缓存到本页，点击提交后才会写入记录
      </div>
    </div>
  );
}
