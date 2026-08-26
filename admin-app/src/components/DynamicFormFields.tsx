import type { FormField } from '@/api/platform';
import { Form, Input, InputNumber, DatePicker, Select, Switch } from 'antd';
import dayjs from 'dayjs';

interface Props {
  fields: FormField[];
  initialValues?: Record<string, unknown>;
  disabled?: boolean;
}

export function DynamicFormFields({ fields, initialValues, disabled }: Props) {
  return (
    <>
      {fields.map((f) => {
        const common = {
          key: f.key,
          name: f.key,
          label: f.label,
          rules: f.required ? [{ required: true, message: `请填写${f.label}` }] : undefined,
          initialValue: initialValues?.[f.key],
        };
        switch (f.type) {
          case 'number':
            return (
              <Form.Item {...common}>
                <InputNumber style={{ width: '100%' }} disabled={disabled} />
              </Form.Item>
            );
          case 'textarea':
            return (
              <Form.Item {...common}>
                <Input.TextArea rows={3} disabled={disabled} />
              </Form.Item>
            );
          case 'date':
            return (
              <Form.Item
                {...common}
                getValueProps={(v) => ({ value: v ? dayjs(v as string) : undefined })}
                normalize={(v) => (v ? dayjs(v).format('YYYY-MM-DD') : undefined)}
              >
                <DatePicker style={{ width: '100%' }} disabled={disabled} />
              </Form.Item>
            );
          case 'select':
          case 'multiselect':
            return (
              <Form.Item {...common}>
                <Select
                  mode={f.type === 'multiselect' ? 'multiple' : undefined}
                  disabled={disabled}
                  options={(f.options || []).map((o: unknown) => {
                    if (typeof o === 'string') return { label: o, value: o };
                    const obj = o as { label?: string; value?: string; text?: string; name?: string };
                    return {
                      label: obj.label || obj.text || obj.name || String(obj.value),
                      value: obj.value ?? obj.name ?? obj.text,
                    };
                  })}
                />
              </Form.Item>
            );
          case 'switch':
            return (
              <Form.Item {...common} valuePropName="checked">
                <Switch disabled={disabled} />
              </Form.Item>
            );
          default:
            return (
              <Form.Item {...common}>
                <Input disabled={disabled} />
              </Form.Item>
            );
        }
      })}
    </>
  );
}
