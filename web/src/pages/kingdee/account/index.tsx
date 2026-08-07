import { useState } from 'react';
import { Table, Input, InputNumber, Button, Select, message, Modal, Tag } from 'antd';
import { UserAddOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface DismantlePerson {
  id: string;
  name: string;
}

interface AccountRow {
  key: string;
  machineNumber: string;
  source: string;
  type: string;
  tonnage: number | null;
  unitPrice: number | null;
  amount: number | null;
}

const machineNumberOptions = [
  { value: 'NJ-001', label: 'NJ-001' },
  { value: 'NJ-002', label: 'NJ-002' },
  { value: 'NJ-003', label: 'NJ-003' },
];

export default function KingdeeAccountPage() {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<AccountRow[]>([
    {
      key: '1',
      machineNumber: '',
      source: '',
      type: '',
      tonnage: null,
      unitPrice: null,
      amount: null,
    },
  ]);
  const [dismantlePersons, setDismantlePersons] = useState<DismantlePerson[]>([]);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const handleAddRow = () => {
    const newKey = (dataSource.length + 1).toString();
    setDataSource([
      ...dataSource,
      {
        key: newKey,
        machineNumber: '',
        source: '',
        type: '',
        tonnage: null,
        unitPrice: null,
        amount: null,
      },
    ]);
  };

  const handleDeleteRow = (key: string) => {
    setDataSource(dataSource.filter((row) => row.key !== key));
  };

  const handleRowChange = (key: string, field: keyof AccountRow, value: any) => {
    setDataSource(
      dataSource.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  const handleOpenSelectMember = () => {
    setSelectModalVisible(true);
  };

  const handleConfirmSelect = () => {
    if (selectedMember) {
      const newPerson: DismantlePerson = {
        id: Date.now().toString(),
        name: selectedMember,
      };
      setDismantlePersons([...dismantlePersons, newPerson]);
      setSelectedMember(null);
    }
    setSelectModalVisible(false);
  };

  const handleRemovePerson = (id: string) => {
    setDismantlePersons(dismantlePersons.filter((p) => p.id !== id));
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      console.log('表单数据:', { dataSource, dismantlePersons });
      message.success('提交成功！');
      setLoading(false);
    }, 1000);
  };

  const handleSaveDraft = () => {
    console.log('草稿数据:', { dataSource, dismantlePersons });
    message.success('保存草稿成功！');
  };

  const columns: ColumnsType<AccountRow> = [
    {
      title: '农机编号',
      dataIndex: 'machineNumber',
      width: 150,
      render: (value: string, record) => (
        <Select
          placeholder="请选择"
          value={value || undefined}
          onChange={(val) => handleRowChange(record.key, 'machineNumber', val)}
          options={machineNumberOptions}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 150,
      render: (value: string, record) => (
        <Input
          placeholder="请输入"
          value={value}
          onChange={(e) => handleRowChange(record.key, 'source', e.target.value)}
        />
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 150,
      render: (value: string, record) => (
        <Input
          placeholder="请输入"
          value={value}
          onChange={(e) => handleRowChange(record.key, 'type', e.target.value)}
        />
      ),
    },
    {
      title: '吨位（净重）',
      dataIndex: 'tonnage',
      width: 140,
      render: (value: number | null, record) => (
        <InputNumber
          placeholder="请输入"
          min={0}
          step={0.01}
          value={value}
          onChange={(val) => handleRowChange(record.key, 'tonnage', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      width: 140,
      render: (value: number | null, record) => (
        <InputNumber
          placeholder="请输入"
          min={0}
          step={0.01}
          value={value}
          onChange={(val) => handleRowChange(record.key, 'unitPrice', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 140,
      render: (value: number | null, record) => (
        <InputNumber
          placeholder="请输入"
          min={0}
          step={0.01}
          value={value}
          onChange={(val) => handleRowChange(record.key, 'amount', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteRow(record.key)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '24px',
        }}>仅添加数据</h1>

        {/* 数据表格 */}
        <div style={{ marginBottom: '24px' }}>
          <Table
            rowKey="key"
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            bordered
          />
          <Button
            type="dashed"
            block
            style={{ marginTop: '8px' }}
            onClick={handleAddRow}
          >
            + 添加行
          </Button>
        </div>

        {/* 拆解人 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontWeight: 500, color: '#333' }}>拆解人</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {dismantlePersons.map((person) => (
              <Tag
                key={person.id}
                closable
                onClose={() => handleRemovePerson(person.id)}
                style={{ padding: '4px 8px', fontSize: '14px' }}
              >
                {person.name}
              </Tag>
            ))}
            <Button
              icon={<UserAddOutlined />}
              onClick={handleOpenSelectMember}
              style={{
                borderStyle: 'dashed',
                color: '#0984e3',
              }}
            >
              + 选择成员
            </Button>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            loading={loading}
            style={{ flex: 1 }}
          >
            提交
          </Button>
          <Button
            size="large"
            onClick={handleSaveDraft}
            style={{ flex: 1 }}
          >
            保存草稿
          </Button>
        </div>
      </div>

      {/* 选择成员弹窗 */}
      <Modal
        title="选择拆解人"
        open={selectModalVisible}
        onOk={handleConfirmSelect}
        onCancel={() => setSelectModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Select
          placeholder="请选择成员"
          value={selectedMember}
          onChange={setSelectedMember}
          style={{ width: '100%' }}
          options={[
            { value: '张三', label: '张三' },
            { value: '李四', label: '李四' },
            { value: '王五', label: '王五' },
            { value: '赵六', label: '赵六' },
          ]}
        />
      </Modal>
    </div>
  );
}
