import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Table,
  message,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getForm,
  listForms,
  parseSchema,
  publishForm,
  saveDraft,
  saveForm,
  savePrintTemplate,
  saveAcl,
} from '@/api/platform';
import type { BizForm, FormField } from '@/api/platform';

const FIELD_TYPES = [
  { value: 'text', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'select', label: '下拉' },
  { value: 'switch', label: '开关' },
  { value: 'user', label: '成员' },
  { value: 'file', label: '附件' },
];

export default function FormDesignerPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [forms, setForms] = useState<BizForm[]>([]);
  const [current, setCurrent] = useState<BizForm | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selected, setSelected] = useState<number>(-1);
  const [metaForm] = Form.useForm();

  const loadForms = async () => {
    const res = await listForms();
    setForms(res.data || []);
  };

  useEffect(() => {
    void loadForms();
  }, []);

  useEffect(() => {
    if (!formId) return;
    void getForm(Number(formId)).then((res) => {
      setCurrent(res.data);
      const schema = res.data.draftSchemaJson || res.data.schemaJson;
      setFields(parseSchema(schema));
      metaForm.setFieldsValue({
        name: res.data.name,
        flowEnabled: res.data.flowEnabled === 1,
        menuGroup: res.data.menuGroup,
      });
    });
  }, [formId, metaForm]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { key: `field_${Date.now()}`, label: '新字段', type: 'text', required: false },
    ]);
  };

  const save = async () => {
    if (!current) return;
    const meta = await metaForm.validateFields();
    const schemaJson = JSON.stringify({ fields });
    await saveDraft(current.id, schemaJson);
    await saveForm({
      ...current,
      name: meta.name,
      menuGroup: meta.menuGroup,
      flowEnabled: meta.flowEnabled ? 1 : 0,
      draftSchemaJson: schemaJson,
    });
    message.success('草稿已保存');
    void loadForms();
  };

  const publish = async () => {
    if (!current) return;
    await save();
    await publishForm(current.id);
    message.success('已发布');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 300px', gap: 12 }}>
      <Card title="表单列表" size="small" style={{ maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}>
        <Button
          block
          type="dashed"
          style={{ marginBottom: 8 }}
          onClick={async () => {
            const res = await saveForm({
              name: '新表单',
              code: `form_${Date.now()}`,
              schemaJson: '{"fields":[]}',
              draftSchemaJson: '{"fields":[]}',
              menuGroup: '其他',
              status: 1,
            });
            message.success('已创建');
            navigate(`/platform/designer/${res.data.id}`);
            void loadForms();
          }}
        >
          新建表单
        </Button>
        {forms.map((f) => (
          <div
            key={f.id}
            onClick={() => navigate(`/platform/designer/${f.id}`)}
            style={{
              padding: '8px 10px',
              cursor: 'pointer',
              background: current?.id === f.id ? '#e6f4ff' : undefined,
              borderRadius: 6,
            }}
          >
            {f.name}
          </div>
        ))}
      </Card>

      <Card
        title={current ? `设计：${current.name}` : '请选择表单'}
        extra={
          current && (
            <Space>
              <Button onClick={() => void save()}>保存草稿</Button>
              <Button type="primary" onClick={() => void publish()}>
                发布
              </Button>
              <Button onClick={() => navigate(`/app/form/${current.id}`)}>预览数据</Button>
            </Space>
          )
        }
      >
        {!current ? (
          <div style={{ color: '#999' }}>从左侧选择或新建表单</div>
        ) : (
          <>
            <Form form={metaForm} layout="inline" style={{ marginBottom: 16 }}>
              <Form.Item name="name" label="名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="menuGroup" label="菜单分组">
                <Input placeholder="业务/生产/基础" />
              </Form.Item>
              <Form.Item name="flowEnabled" label="启用审批" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Form>
            <Space style={{ marginBottom: 12 }}>
              <Button onClick={addField}>添加字段</Button>
              <Button
                onClick={async () => {
                  await savePrintTemplate({
                    formId: current.id,
                    name: '默认打印',
                    htmlTemplate: `<h2>${current.name}</h2><pre>{{_json}}</pre><p>创建人：{{_creator}}</p>`,
                  });
                  message.success('已创建默认打印模板');
                }}
              >
                创建打印模板
              </Button>
              <Button
                onClick={async () => {
                  await saveAcl(current.id, {
                    principalType: 'all',
                    principalId: '*',
                    perm: 'write',
                    dataScope: 'all',
                  });
                  message.success('已设置全员可写 ACL');
                }}
              >
                默认权限
              </Button>
            </Space>
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              dataSource={fields}
              onRow={(_, index) => ({
                onClick: () => setSelected(index ?? -1),
              })}
              columns={[
                { title: '标识', dataIndex: 'key' },
                { title: '标题', dataIndex: 'label' },
                { title: '类型', dataIndex: 'type' },
                {
                  title: '必填',
                  dataIndex: 'required',
                  render: (v: boolean) => (v ? '是' : '否'),
                },
                {
                  title: '操作',
                  render: (_: unknown, __: FormField, index: number) => (
                    <Button
                      type="link"
                      danger
                      onClick={() => setFields((prev) => prev.filter((_, i) => i !== index))}
                    >
                      删除
                    </Button>
                  ),
                },
              ]}
            />
          </>
        )}
      </Card>

      <Card title="字段属性" size="small">
        {selected >= 0 && fields[selected] ? (
          <Form
            layout="vertical"
            key={fields[selected].key}
            initialValues={fields[selected]}
            onValuesChange={(_, all) => {
              setFields((prev) => prev.map((f, i) => (i === selected ? { ...f, ...all } : f)));
            }}
          >
            <Form.Item name="key" label="字段名" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="label" label="显示名" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="type" label="类型">
              <Select options={FIELD_TYPES} />
            </Form.Item>
            <Form.Item name="required" label="必填" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        ) : (
          <div style={{ color: '#999' }}>点击表格行编辑字段</div>
        )}
      </Card>
    </div>
  );
}
