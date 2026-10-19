import { useState } from 'react';
import { useBizDataWithLocal } from '@/hooks/useBizDataWithLocal';
import DataScopeDropdown from '@/components/DataScopeDropdown';
import BizLinkDataModal, { mapLinkedRowToFormValues, PRODUCTION_LINK_SOURCES } from '@/components/BizLinkDataModal';
import DictSelect from '@/components/DictSelect';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Dropdown,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Upload,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  FilterOutlined,
  MoreOutlined,
  DownOutlined,
  SyncOutlined,
  PictureOutlined,
  UserOutlined,
  InboxOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '@/hooks/useIsMobile';
import { withMobilePagination } from '@/utils/mobileUi';

interface DisassemblyItem {
  id: number;
  entryCode: string;
  weighDate: string;
  netWeight: number;
  weighmaster: string;
  operation: string;
  bLevel: string;
  flatten: string;
  iron: number;
  aluminum: number;
  ternary: number;
  battery: number;
  tire: number;
  disassemblyDate: string;
  vehicleType: string;
  vehicleModel: string;
  photos: string[];
  disassembler: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}


const PhotoThumbnails = ({ photos }: { photos?: string[] | null }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {(photos || []).map((_, index) => (
      <div
        key={index}
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${
            ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'][index % 6]
          } 0%, ${['#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#667eea'][index % 6]} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PictureOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }} />
      </div>
    ))}
  </div>
);

const columns: ColumnsType<DisassemblyItem> = [
  { title: <span style={{ whiteSpace: 'nowrap' }}>入场编号</span>, dataIndex: 'entryCode', width: 100, fixed: 'left' },
  { title: <span style={{ whiteSpace: 'nowrap' }}>过磅日期</span>, dataIndex: 'weighDate', width: 120, fixed: 'left' },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>净重</span>,
    dataIndex: 'netWeight',
    width: 90,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>司磅员</span>,
    dataIndex: 'weighmaster',
    width: 100,
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>
    ),
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>营运</span>,
    dataIndex: 'operation',
    width: 70,
    render: (val: string) => val === '是' ? '是' : '',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>B级</span>,
    dataIndex: 'bLevel',
    width: 70,
    render: (val: string) => val === '是' ? '是' : '',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>压扁</span>,
    dataIndex: 'flatten',
    width: 70,
    render: (val: string) => val === '是' ? '是' : '',
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>铁</span>,
    dataIndex: 'iron',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>铝</span>,
    dataIndex: 'aluminum',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>三元</span>,
    dataIndex: 'ternary',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>电瓶</span>,
    dataIndex: 'battery',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>轮胎</span>,
    dataIndex: 'tire',
    width: 80,
    render: (val: number) => <span style={{ textAlign: 'right', display: 'block' }}>{val.toFixed(2)}</span>,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>拆解日期</span>, dataIndex: 'disassemblyDate', width: 120 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆类型</span>, dataIndex: 'vehicleType', width: 110 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>车辆型号</span>, dataIndex: 'vehicleModel', width: 100 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>照片</span>,
    dataIndex: 'photos',
    width: 120,
    render: (photos: string[]) => <PhotoThumbnails photos={photos} />,
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>拆解人员</span>, dataIndex: 'disassembler', width: 100 },
  {
    title: <span style={{ whiteSpace: 'nowrap' }}>提交人</span>,
    dataIndex: 'submitter',
    width: 100,
    render: (val: string) => (
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>{val}</span>
    ),
  },
  { title: <span style={{ whiteSpace: 'nowrap' }}>提交时间</span>, dataIndex: 'submitTime', width: 170 },
  { title: <span style={{ whiteSpace: 'nowrap' }}>更新时间</span>, dataIndex: 'updateTime', width: 170 },
];

export default function Disassembly() {
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
  } = useBizDataWithLocal<DisassemblyItem>('disassembly');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [linkModalOpen, setLinkModalOpen] = useState(false);


  const handleAdd = () => {
    form.resetFields();
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      appendLocal({
        ...values,
        entryCode: values.entryCode || `CJ${Date.now()}`,
        disassembler: Array.isArray(values.disassembler)
          ? values.disassembler.join('、')
          : values.disassembler,
      } as Omit<DisassemblyItem, 'id'>);
      message.success('拆解完成，已写入列表');
      setAddModalOpen(false);
    } catch {
      message.error('请填写完整信息');
    }
  };

  const handleImport = () => {
    message.info('导入功能开发中');
  };

  const handleExport = () => {
    message.success('导出成功');
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    removeLocal(selectedRowKeys.map(Number));
    setSelectedRowKeys([]);
    message.success(`已删除 ${selectedRowKeys.length} 条数据`);
  };

  const moreMenuItems = [
    { key: 'batchUpdate', label: '批量更新' },
    { key: 'batchDelete', label: '批量删除' },
    { key: 'exportAll', label: '导出全部' },
  ];

  const entryCodeOptions = dataSource.map((item) => item.entryCode);

  return (
    <div className="page-container">
      <Card styles={{ body: { padding: 0 } }}>
        {/* 顶部工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space wrap>
            <DataScopeDropdown onChange={setDataScope} />
            <Button type="text" onClick={() => setLinkModalOpen(true)}>联动结账/划价/扣杂</Button>
          </Space>
        </div>

        {/* 操作工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
            {!isMobile && (
              <Dropdown menu={{ items: moreMenuItems }}>
                <Button>
                  <MoreOutlined />
                </Button>
              </Dropdown>
            )}
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
            <Button
              icon={<FilterOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
            >
              筛选
            </Button>
          </Space>
        </div>

        {/* 数据表格 */}
        <div style={{ background: '#fff', padding: '0 16px' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            scroll={{ x: 3200 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={withMobilePagination(isMobile, {
              current: pageNo,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
              onShowSizeChange: (page, size) => {
                setPageNo(page);
                setPageSize(size);
              },
            })}
          />
        </div>
      </Card>

      {/* 添加表单弹窗 */}
      <Modal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        width={800}
        title={<span style={{ fontSize: 18, fontWeight: 500 }}>6.拆解</span>}
        closable
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark
          initialValues={{
            disassembler: [],
            photos: [],
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '0 16px' }}>
            <Form.Item
              label={<span style={{ fontWeight: 500 }}>入场编号</span>}
              name="entryCode"
              rules={[{ required: true, message: '请选择入场编号' }]}
            >
              <Select
                placeholder="请选择"
                showSearch
                optionFilterProp="value"
                suffixIcon={<DownOutlined style={{ fontSize: 10 }} />}
                options={entryCodeOptions.map((code) => ({ value: code, label: code }))}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>过磅日期</span>}
              name="weighDate"
              rules={[{ required: true, message: '请选择过磅日期' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>净重</span>}
              name="netWeight"
              rules={[{ required: true, message: '请填写净重' }]}
            >
              <InputNumber
                placeholder="请填写数值"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                step={0.01}
              />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>司磅员</span>} name="weighmaster">
              <DictSelect dict="staff" placeholder="请选择司磅员（基础资料）" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>营运</span>} name="operation">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>B级</span>} name="bLevel">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>压扁</span>} name="flatten">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>铁</span>} name="iron">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>铝</span>} name="aluminum">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>三元</span>} name="ternary">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>电瓶</span>} name="battery">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>轮胎</span>} name="tire">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>拆解日期</span>} name="disassemblyDate">
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>车辆类型</span>} name="vehicleType">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500 }}>车辆型号</span>} name="vehicleModel">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>照片</span>}
              name="photos"
              rules={[{ required: true, message: '请上传照片' }]}
            >
              <Upload
                listType="picture"
                multiple
                accept="image/*"
                fileList={[]}
                beforeUpload={() => false}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1890ff', fontSize: 14, cursor: 'pointer' }}>
                  <span style={{ color: '#1890ff' }}>选择</span>
                  <span style={{ color: '#999' }}>拖拽或单...</span>
                </div>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item label={<span style={{ fontWeight: 500 }}>拆解人员</span>} name="disassembler">
            <DictSelect dict="staff" mode="multiple" placeholder="请选择拆解人员（基础资料）" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleAddSubmit}
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                color: '#fff',
                width: 160,
                height: 48,
                fontSize: 16,
                borderRadius: 8,
              }}
            >
              拆解完成
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <BizLinkDataModal
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        sources={PRODUCTION_LINK_SOURCES}
        onSelect={(row) => {
          form.setFieldsValue(mapLinkedRowToFormValues(row));
          setLinkModalOpen(false);
          setAddModalOpen(true);
        }}
      />
    </div>
  );
}
