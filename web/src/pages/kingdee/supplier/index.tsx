import { useState } from 'react';
import { Form, Input, InputNumber, Button, message } from 'antd';

interface SupplierForm {
  machineNumber: string;
  source: string;
  type: string;
  tonnage: number | null;
  unitPrice: number | null;
  amount: number | null;
}

export default function KingdeeSupplierPage() {
  const [form] = Form.useForm<SupplierForm>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setTimeout(() => {
        console.log('表单数据:', values);
        message.success('提交成功！');
        setLoading(false);
      }, 500);
    } catch {
      // validation failed
    }
  };

  const handleSaveDraft = async () => {
    const values = form.getFieldsValue();
    console.log('草稿数据:', values);
    message.success('保存草稿成功！');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '8px',
          padding: '24px',
          minHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '32px',
          }}
        >
          仅添加数据
        </h1>

        <Form
          form={form}
          layout="vertical"
          requiredMark
          initialValues={{
            machineNumber: '',
            source: '',
            type: '',
            tonnage: null,
            unitPrice: null,
            amount: null,
          }}
          style={{ flex: 1 }}
        >
          <Form.Item
            label="农机编号"
            name="machineNumber"
            rules={[{ required: true, message: '请输入农机编号' }]}
          >
            <Input placeholder="请输入" />
          </Form.Item>

          <Form.Item
            label="来源"
            name="source"
            rules={[{ required: true, message: '请输入来源' }]}
          >
            <Input placeholder="请输入" />
          </Form.Item>

          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请输入类型' }]}
          >
            <Input placeholder="请输入" />
          </Form.Item>

          <Form.Item
            label="吨位（净重）"
            name="tonnage"
            rules={[{ required: true, message: '请输入吨位' }]}
          >
            <InputNumber
              placeholder="请输入"
              min={0}
              step={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="单价"
            name="unitPrice"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber
              placeholder="请输入"
              min={0}
              step={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="金额"
            name="amount"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              placeholder="请输入"
              min={0}
              step={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>

        <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', paddingTop: '24px' }}>
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
    </div>
  );
}
