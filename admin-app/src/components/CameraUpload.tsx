import { useRef } from 'react';
import { Button, Space } from 'antd';
import { CameraOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';

interface CameraUploadProps {
  onFiles: (files: UploadFile[]) => void;
  fileList: UploadFile[];
  label?: string;
}

export default function CameraUpload({ onFiles, fileList, label = '拍照上传' }: CameraUploadProps) {
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
    <Space>
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
      <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>
        选择图片
      </Button>
    </Space>
  );
}
