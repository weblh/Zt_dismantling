import { useState } from 'react';
import { useBizDataWithLocal } from '@/hooks/useBizDataWithLocal';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  message,
  Modal,
  Form,
  Select,
  Upload,
  Image,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  FilterOutlined,
  PictureOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd';
import CameraUpload from '@/components/CameraUpload';
import DataScopeDropdown from '@/components/DataScopeDropdown';
import BizLinkDataModal, { mapLinkedRowToFormValues, PRODUCTION_LINK_SOURCES } from '@/components/BizLinkDataModal';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface PickTopPhotoItem {
  id: number;
  entryCode: string;
  pickTopPhotos: string[];
  inspectionPhotos: string[];
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const PhotoThumbnails = ({ photos }: { photos?: string[] | null }) => (
  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
    {(photos || []).map((url, index) => (
      <div
        key={index}
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          overflow: 'hidden',
          background: '#f0f0f0',
        }}
      >
        {url ? (
          <Image src={url} width={36} height={36} style={{ objectFit: 'cover' }} />
        ) : (
          <PictureOutlined style={{ color: '#999', fontSize: 14, margin: 11 }} />
        )}
      </div>
    ))}
  </div>
);

const entryCodeOptions = [
  { value: '6G0439', label: '6G0439' },
  { value: '6G0438', label: '6G0438' },
  { value: '6G0437', label: '6G0437' },
  { value: '6G0436', label: '6G0436' },
  { value: '6G0435', label: '6G0435' },
];

const columns: ColumnsType<PickTopPhotoItem> = [
  { title: '入场编号', dataIndex: 'entryCode', width: 100 },
  {
    title: '挑顶照片',
    dataIndex: 'pickTopPhotos',
    width: 140,
    render: (photos: string[]) => <PhotoThumbnails photos={photos} />,
  },
  {
    title: '查验照片',
    dataIndex: 'inspectionPhotos',
    width: 140,
    render: (photos: string[]) => <PhotoThumbnails photos={photos} />,
  },
  {
    title: '提交人',
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => <span style={{ color: '#1890ff' }}>{val}</span>,
  },
  { title: '提交时间', dataIndex: 'submitTime', width: 170 },
  { title: '更新时间', dataIndex: 'updateTime', width: 170 },
];

export default function PickTopPhoto() {
  const isMobile = useIsMobile();
  const {
    dataSource,
    total,
    pageNo,
    pageSize,
    loading,
    searchValue,
    setSearchValue,
    setPageNo,
    setPageSize,
    onSearch,
    appendLocal,
    removeLocal,
    setDataScope,
  } = useBizDataWithLocal<PickTopPhotoItem>('pick-top-photo');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [pickTopFileList, setPickTopFileList] = useState<UploadFile[]>([]);
  const [inspectionFileList, setInspectionFileList] = useState<UploadFile[]>([]);
  const [selectedData, setSelectedData] = useState<PickTopPhotoItem | null>(null);
  const [selectDataModalOpen, setSelectDataModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const handleAdd = () => {
    setAddModalOpen(true);
    form.resetFields();
    setPickTopFileList([]);
    setInspectionFileList([]);
    setSelectedData(null);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      appendLocal({
        entryCode: values.entryCode,
        pickTopPhotos: pickTopFileList.map((f) => f.url || f.thumbUrl || '').filter(Boolean),
        inspectionPhotos: inspectionFileList.map((f) => f.url || f.thumbUrl || '').filter(Boolean),
      } as Omit<PickTopPhotoItem, 'id'>);
      message.success('挑顶完成');
      setAddModalOpen(false);
      form.resetFields();
      setPickTopFileList([]);
      setInspectionFileList([]);
      setSelectedData(null);
    } catch {
      message.error('请填写完整信息');
    }
  };

  const pickTopUploadProps: UploadProps = {
    multiple: true,
    listType: 'picture',
    fileList: pickTopFileList,
    beforeUpload: () => false,
    onChange: ({ fileList: newFileList }) => setPickTopFileList(newFileList),
  };

  const inspectionUploadProps: UploadProps = {
    multiple: true,
    listType: 'picture',
    fileList: inspectionFileList,
    beforeUpload: () => false,
    onChange: ({ fileList: newFileList }) => setInspectionFileList(newFileList),
  };

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space wrap>
            <DataScopeDropdown onChange={setDataScope} />
            <Button type="text" onClick={() => setLinkModalOpen(true)}>联动结账/划价/扣杂</Button>
          </Space>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <Button icon={<ImportOutlined />} onClick={() => message.info('导入功能开发中')}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={() => message.success('导出成功')}>导出</Button>
            <Button
              icon={<DeleteOutlined />}
              onClick={() => {
                if (!selectedRowKeys.length) {
                  message.warning('请先选择要删除的数据');
                  return;
                }
                removeLocal(selectedRowKeys.map(Number));
                setSelectedRowKeys([]);
                message.success('删除成功');
              }}
            >
              删除
            </Button>
          </Space>
          <Space wrap>
            <Input.Search
              placeholder="搜索数据"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={onSearch}
              style={{ width: isMobile ? '100%' : 200 }}
              allowClear
            />
            <Button icon={<FilterOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}            >
              筛选
            </Button>
          </Space>
        </div>

        <div style={{ padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            scroll={{ x: 800 }}
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            pagination={withMobilePagination(isMobile, {
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
            })}
          />
        </div>
      </Card>

      <Modal title="5.挑顶照片" open={addModalOpen} onCancel={() => setAddModalOpen(false)} width={720} footer={null}>
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="入场编号" name="entryCode" rules={[{ required: true, message: '请选择入场编号' }]}>
            <Select placeholder="请选择" options={entryCodeOptions} showSearch optionFilterProp="label" />
          </Form.Item>

          <Form.Item label="挑顶照片（支持拍照）" required>
            <Space direction="vertical" style={{ width: '100%' }}>
              <CameraUpload fileList={pickTopFileList} onFiles={setPickTopFileList} label="拍照上传挑顶照片" />
              <Upload {...pickTopUploadProps} accept="image/*">
                <Button icon={<PictureOutlined />}>从相册选择</Button>
              </Upload>
            </Space>
          </Form.Item>

          <Form.Item label="选择关联数据" name="selectedData">
            <div
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: '8px 12px',
                cursor: 'pointer',
                background: '#fafafa',
                textAlign: 'center',
              }}
              onClick={() => setSelectDataModalOpen(true)}
            >
              <SelectOutlined style={{ color: '#1890ff', marginRight: 4 }} />
              <span style={{ color: '#1890ff' }}>选择过磅/结账数据</span>
            </div>
          </Form.Item>

          {selectedData && (
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 12, marginBottom: 16, background: '#fafafa' }}>
              <div>入场编号：{selectedData.entryCode}</div>
              <div>提交人：{selectedData.submitter}</div>
            </div>
          )}

          <Form.Item label="查验照片（支持拍照）">
            <Space direction="vertical" style={{ width: '100%' }}>
              <CameraUpload fileList={inspectionFileList} onFiles={setInspectionFileList} label="拍照上传查验照片" />
              <Upload {...inspectionUploadProps} accept="image/*">
                <Button icon={<PictureOutlined />}>从相册选择</Button>
              </Upload>
            </Space>
          </Form.Item>

          <Button
            type="primary"
            size="large"
            block={isMobile}
            onClick={handleAddSubmit}
            style={{
              width: isMobile ? '100%' : 160,
              background: '#52c41a',
              borderColor: '#52c41a',
              height: 48,
            }}
          >
            挑顶完成
          </Button>
        </Form>
      </Modal>

      <Modal
        title="选择数据"
        open={selectDataModalOpen}
        onCancel={() => setSelectDataModalOpen(false)}
        onOk={() => setSelectDataModalOpen(false)}
        width={800}
      >
        <Table
          rowKey="id"
          columns={[
            { title: '入场编号', dataIndex: 'entryCode', width: 120 },
            { title: '提交人', dataIndex: 'submitter', width: 100 },
            { title: '提交时间', dataIndex: 'submitTime', width: 170 },
          ]}
          dataSource={dataSource.slice(0, 20)}
          pagination={false}
          scroll={{ x: 600 }}
          size={isMobile ? 'small' : 'middle'}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedData ? [selectedData.id] : [],
            onChange: (_keys, rows) => {
              if (rows[0]) {
                setSelectedData(rows[0]);
                form.setFieldsValue({ selectedData: rows[0].entryCode, entryCode: rows[0].entryCode });
              }
            },
          }}
        />
      </Modal>

      <BizLinkDataModal
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        sources={PRODUCTION_LINK_SOURCES}
        onSelect={(row) => {
          form.setFieldsValue({
            entryCode: row.code || form.getFieldValue('entryCode'),
            ...mapLinkedRowToFormValues(row),
          });
          setLinkModalOpen(false);
          setAddModalOpen(true);
        }}
      />
    </div>
  );
}
