import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Form,
  Popconfirm,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import {
  createFormData,
  deleteFormData,
  flowSubmit,
  getForm,
  listFormData,
  listPrintTemplates,
  parseSchema,
  renderPrint,
  updateFormData,
} from '@/api/platform';
import type { BizForm, BizFormData } from '@/api/platform';
import { DynamicFormFields } from '@/components/DynamicFormFields';

export default function FormRuntimePage() {
  const { formId } = useParams();
  const id = Number(formId);
  const [formMeta, setFormMeta] = useState<BizForm | null>(null);
  const [rows, setRows] = useState<BizFormData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BizFormData | null>(null);
  const [antdForm] = Form.useForm();

  const fields = useMemo(() => parseSchema(formMeta?.schemaJson), [formMeta]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [f, d] = await Promise.all([getForm(id), listFormData(id, page, 20)]);
      setFormMeta(f.data);
      setRows(d.data.records || []);
      setTotal(d.data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id, page]);

  const openCreate = () => {
    setEditing(null);
    antdForm.resetFields();
    setOpen(true);
  };

  const openEdit = (row: BizFormData) => {
    setEditing(row);
    try {
      antdForm.setFieldsValue(JSON.parse(row.dataJson || '{}'));
    } catch {
      antdForm.resetFields();
    }
    setOpen(true);
  };

  const onSave = async (startFlow = false) => {
    const values = await antdForm.validateFields();
    const dataJson = JSON.stringify(values);
    if (editing) {
      await updateFormData(editing.id, dataJson);
      message.success('已保存');
    } else {
      const res = await createFormData(id, dataJson, startFlow);
      message.success(startFlow ? '已提交审批' : '已创建');
      if (!startFlow && formMeta?.flowEnabled === 1) {
        // optional
      }
      void res;
    }
    setOpen(false);
    void load();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '创建人', dataIndex: 'creatorName', width: 120 },
    {
      title: '流程',
      dataIndex: 'flowState',
      width: 100,
      render: (v: string) => <Tag>{v || 'none'}</Tag>,
    },
    {
      title: '摘要',
      dataIndex: 'dataJson',
      ellipsis: true,
      render: (v: string) => {
        try {
          const o = JSON.parse(v || '{}');
          const keys = Object.keys(o).slice(0, 3);
          return keys.map((k) => `${k}:${o[k]}`).join(' · ');
        } catch {
          return v;
        }
      },
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 180 },
    {
      title: '操作',
      width: 260,
      render: (_: unknown, row: BizFormData) => (
        <Space>
          <Button type="link" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button
            type="link"
            onClick={async () => {
              await flowSubmit(row.id);
              message.success('已提交审批');
              void load();
            }}
          >
            提交审批
          </Button>
          <Button
            type="link"
            onClick={async () => {
              const tpls = await listPrintTemplates(id);
              const list = (tpls.data as { id: number }[]) || [];
              if (!list.length) {
                message.warning('请先在设计器/打印配置中创建模板');
                return;
              }
              const htmlRes = await renderPrint(row.id, list[0].id);
              const w = window.open('', '_blank');
              if (w) {
                w.document.write(htmlRes.data.html);
                w.document.close();
                w.print();
              }
            }}
          >
            打印
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteFormData(row.id).then(load)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={formMeta?.name || '表单数据'}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
        }}
      />
      <Drawer
        title={editing ? '编辑数据' : '新建数据'}
        width={560}
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => void onSave(false)}>保存</Button>
            <Button type="primary" onClick={() => void onSave(true)}>
              保存并提交
            </Button>
          </Space>
        }
      >
        <Form form={antdForm} layout="vertical">
          <DynamicFormFields fields={fields} />
        </Form>
      </Drawer>
    </Card>
  );
}
