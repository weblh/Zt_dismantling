import { useEffect, useState } from 'react';
import { Image, Modal, Space, Typography, message } from 'antd';
import { FileOutlined, PaperClipOutlined } from '@ant-design/icons';
import type { AttachmentFile } from '@/api/expense-reimbursement';
import { apiUrl } from '@/config/api';

interface AttachmentPreviewListProps {
  itemId: number;
  attachments?: AttachmentFile[];
  fallbackText?: string;
}

export default function AttachmentPreviewList({
  itemId,
  attachments,
  fallbackText,
}: AttachmentPreviewListProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'download'>('download');
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchPreviewBlob = async (fileId: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(
      apiUrl(`/business/expense-reimbursement/items/${itemId}/attachments/${encodeURIComponent(fileId)}/preview`),
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || '附件预览失败');
    }
    return response.blob();
  };

  const openPreview = async (file: AttachmentFile) => {
    setLoadingFileId(file.fileId);
    try {
      const blob = await fetchPreviewBlob(file.fileId);
      const url = URL.createObjectURL(blob);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const fileType = (file.fileType || '').toLowerCase();
      if (fileType === 'pdf') {
        setPreviewType('pdf');
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileType)) {
        setPreviewType('image');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = file.fileName || 'attachment';
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      setPreviewUrl(url);
      setPreviewTitle(file.fileName || '附件预览');
      setPreviewOpen(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '附件预览失败');
    } finally {
      setLoadingFileId(null);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (!attachments || attachments.length === 0) {
    return <span>{fallbackText || '-'}</span>;
  }

  const uniqueAttachments = attachments.filter(
    (file, index, list) => list.findIndex((item) => item.fileId === file.fileId) === index,
  );

  return (
    <>
      <Space direction="vertical" size={4}>
        {uniqueAttachments.map((file) => (
          <Typography.Link
            key={file.fileId}
            onClick={() => openPreview(file)}
            disabled={loadingFileId === file.fileId}
          >
            {file.previewable ? <PaperClipOutlined /> : <FileOutlined />}{' '}
            {file.fileName || file.fileId}
          </Typography.Link>
        ))}
      </Space>

      <Modal
        title={previewTitle}
        open={previewOpen}
        onCancel={closePreview}
        footer={null}
        width={previewType === 'pdf' ? 900 : 760}
        destroyOnClose
      >
        {previewType === 'image' && previewUrl && (
          <Image src={previewUrl} alt={previewTitle} style={{ width: '100%' }} preview={false} />
        )}
        {previewType === 'pdf' && previewUrl && (
          <iframe
            src={previewUrl}
            title={previewTitle}
            style={{ width: '100%', height: '70vh', border: 'none' }}
          />
        )}
      </Modal>
    </>
  );
}
