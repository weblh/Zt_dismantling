import { useRef, type ReactNode } from 'react';
import { Button, Space } from 'antd';
import { CameraOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';

interface CameraUploadProps {
  onFiles: (files: UploadFile[]) => void;
  fileList: UploadFile[];
  label?: string;
  /** 是否显示「选择图片」按钮，默认 true */
  showSelect?: boolean;
  /** 追加到同一行的额外操作（如「从相册选择」） */
  extra?: ReactNode;
}

export default function CameraUpload({
  onFiles,
  fileList,
  label = '拍照上传',
  showSelect = true,
  extra,
}: CameraUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mergeFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const next: UploadFile[] = [...fileList];
    Array.from(incoming).forEach((file, index) => {
      next.push({
        uid: `${Date.now()}-${index}`,
        name: file.name,
        status: 'done',
        originFileObj: file as UploadFile['originFileObj'],
        url: URL.createObjectURL(file),
      });
    });
    onFiles(next);
  };

  return (
    <Space wrap size={[8, 8]} style={{ width: '100%' }}>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          mergeFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          mergeFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <Button icon={<CameraOutlined />} onClick={() => cameraRef.current?.click()}>
        {label}
      </Button>
      {showSelect && (
        <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>
          选择图片
        </Button>
      )}
      {extra}
    </Space>
  );
}
