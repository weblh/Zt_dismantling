import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Image, Space, message } from 'antd';
import {
  CheckCircleFilled,
  CloudUploadOutlined,
  DeleteOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import {
  createQrPhotoSession,
  getQrPhotoSession,
  uploadQrPhotoFiles,
} from '@/api/qrPhoto';
import { resolveQrPhotoUrl } from '@/utils/qrPhotoSession';

type LocalPick = {
  id: string;
  file: File;
  preview: string;
};

/**
 * 公用移动端扫码上传页：
 * 1）点「选择图片」从相册选图（仅本地预览）
 * 2）点「上传」才调用接口传到电脑端会话
 */
export default function MobilePhotoUploadPage() {
  const [params] = useSearchParams();
  const sessionId = (params.get('session') || '').trim();
  const titleFromQuery = (params.get('title') || '').trim();
  const bizKey = (params.get('biz') || '').trim();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title] = useState(titleFromQuery || '手机相册上传');
  const [picks, setPicks] = useState<LocalPick[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState('');

  const ensureSession = useCallback(async () => {
    if (!sessionId) throw new Error('缺少上传会话，请重新扫码');
    try {
      const res = await getQrPhotoSession(sessionId);
      setUploadedUrls((res.data?.urls || []).map(resolveQrPhotoUrl));
      return;
    } catch {
      // ignore
    }
    await createQrPhotoSession(sessionId, {
      title: titleFromQuery || undefined,
      bizKey: bizKey || undefined,
    });
    const res = await getQrPhotoSession(sessionId);
    setUploadedUrls((res.data?.urls || []).map(resolveQrPhotoUrl));
  }, [sessionId, titleFromQuery, bizKey]);

  useEffect(() => {
    if (!sessionId) return;
    void ensureSession()
      .then(() => setHint(''))
      .catch((e) => {
        setHint(
          e instanceof Error
            ? `提示：${e.message}（仍可先选图，点上传时会重试）`
            : '提示：暂未连上服务器，仍可先选图',
        );
      });
  }, [sessionId, ensureSession]);

  useEffect(() => {
    return () => {
      picks.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [picks]);

  if (!sessionId) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>无效链接</h1>
          <p style={descStyle}>请重新扫描电脑端「扫码上传」二维码。</p>
        </div>
      </div>
    );
  }

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const next: LocalPick[] = [...picks];
    Array.from(fileList).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      next.push({
        id: `${Date.now()}-${index}-${file.name}`,
        file,
        preview: URL.createObjectURL(file),
      });
    });
    if (next.length > 20) {
      message.warning('最多选择 20 张图片');
      setPicks(next.slice(0, 20));
      return;
    }
    setPicks(next);
    setDone(false);
  };

  const removePick = (id: string) => {
    setPicks((prev) => {
      const hit = prev.find((p) => p.id === id);
      if (hit) URL.revokeObjectURL(hit.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  /** 单独的上传按钮：点击后调用接口 */
  const handleUpload = async () => {
    if (picks.length === 0) {
      message.warning('请先选择图片');
      return;
    }
    setUploading(true);
    try {
      await ensureSession();
      const files = picks.map((p) => p.file);
      const res = await uploadQrPhotoFiles(sessionId, files);
      const urls = (res.data?.urls || []).map(resolveQrPhotoUrl);
      setUploadedUrls(urls);
      picks.forEach((p) => URL.revokeObjectURL(p.preview));
      setPicks([]);
      setDone(true);
      setHint('');
      message.success(`上传成功 ${res.data?.added?.length || files.length} 张，请回电脑端查看`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '上传失败';
      message.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>{title}</h1>
        <p style={descStyle}>
          先点「选择图片」从相册选图，再点「上传」提交到电脑端。
          <br />
          电脑端点「提交」后才会写入业务记录。
        </p>
        {bizKey ? (
          <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>业务：{bizKey}</div>
        ) : null}
        {hint ? (
          <div style={{ fontSize: 12, color: '#fa8c16', marginBottom: 12, lineHeight: 1.5 }}>{hint}</div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            onPickFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* 选择图片：只选本地，不调接口 */}
        <Button
          block
          size="large"
          icon={<PictureOutlined />}
          onClick={() => fileInputRef.current?.click()}
          style={{ height: 48, marginBottom: 12 }}
        >
          选择图片
        </Button>

        {picks.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
              已选择 {picks.length} 张（未上传）
            </div>
            <Space wrap size={[8, 8]}>
              {picks.map((p) => (
                <div key={p.id} style={{ position: 'relative', width: 72, height: 72 }}>
                  <img
                    src={p.preview}
                    alt=""
                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6 }}
                  />
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removePick(p.id)}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 22,
                      height: 22,
                      minWidth: 22,
                      padding: 0,
                      borderRadius: '50%',
                    }}
                  />
                </div>
              ))}
            </Space>
          </div>
        )}

        {/* 单独上传按钮：点击后才调用接口 */}
        <Button
          type="primary"
          block
          size="large"
          icon={<CloudUploadOutlined />}
          loading={uploading}
          disabled={picks.length === 0}
          onClick={handleUpload}
          style={{ height: 48, fontSize: 16 }}
        >
          上传
        </Button>

        {uploadedUrls.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
              已上传到电脑端 {uploadedUrls.length} 张
            </div>
            <Image.PreviewGroup>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {uploadedUrls.map((url) => (
                  <Image
                    key={url}
                    src={url}
                    width={72}
                    height={72}
                    style={{ objectFit: 'cover', borderRadius: 6 }}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          </div>
        )}

        {done && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: '#f6ffed',
              borderRadius: 8,
              color: '#389e0d',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircleFilled />
            <span>上传成功，请返回电脑端表单查看</span>
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #e8f4ff 0%, #f5f7fa 40%)',
  padding: 16,
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  maxWidth: 480,
  margin: '0 auto',
};

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  margin: '0 0 8px',
  color: '#1677ff',
  fontWeight: 600,
};

const descStyle: React.CSSProperties = {
  color: '#666',
  fontSize: 13,
  marginBottom: 16,
  lineHeight: 1.7,
};
