import { useState } from 'react';
import { Form, Input, DatePicker, Button, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/date-picker/locale/zh_CN';

const { TextArea } = Input;

interface RepairItem {
  id: number;
  equipmentName: string;
  remarks: string;
}

export default function MobileFormPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [repairItems, setRepairItems] = useState<RepairItem[]>([]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      setLoading(true);
      setTimeout(() => {
        console.log('表单数据:', values);
        console.log('维修项:', repairItems);
        message.success('提交成功！');
        form.resetFields();
        setRepairItems([]);
        setLoading(false);
      }, 1000);
    }).catch((errorInfo) => {
      console.log('表单验证失败:', errorInfo);
    });
  };

  const addRepairItem = () => {
    setRepairItems(prev => [...prev, { id: Date.now(), equipmentName: '', remarks: '' }]);
  };

  const removeRepairItem = (id: number) => {
    setRepairItems(prev => prev.filter(item => item.id !== id));
  };

  const updateRepairItem = (id: number, field: 'equipmentName' | 'remarks', value: string) => {
    setRepairItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E0F4FF 0%, #B8E4F7 50%, #87CEEB 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'visible',
    }}>
      {/* 背景装饰元素 */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(9, 132, 227, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-80px',
        left: '-80px',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(91, 184, 232, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
      }}></div>
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid rgba(9, 132, 227, 0.15)',
        boxShadow: '0 4px 24px rgba(9, 132, 227, 0.12)',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #E0F4FF',
        }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#0984e3',
            margin: 0,
          }}>维修保养表单</h1>
        </div>

        <Form
          form={form}
          layout="vertical"
          style={{
            color: '#999999',
          }}
        >
          <div style={{
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px dashed #E0F4FF',
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#0984e3',
              marginBottom: '16px',
            }}>一、维修信息</h2>

            <Form.Item
              label="负责人"
              name="responsiblePerson"
              rules={[{ required: true, message: '请输入负责人' }]}
              labelCol={{ style: { marginBottom: '8px' } }}
            >
              <Input
                placeholder="请输入负责人姓名"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #B8E4F7',
                  color: '#333333',
                  borderRadius: '8px',
                }}
              />
            </Form.Item>

            <Form.Item
              label="联系电话"
              name="phone"
              rules={[{ required: true, message: '请输入联系电话' }]}
              labelCol={{ style: { marginBottom: '8px' } }}
            >
              <Input
                placeholder="请输入联系电话"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #B8E4F7',
                  color: '#333333',
                  borderRadius: '8px',
                }}
              />
            </Form.Item>

            <Form.Item
              label="维修时间"
              name="repairTime"
              rules={[{ required: true, message: '请选择维修时间' }]}
              labelCol={{ style: { marginBottom: '8px' } }}
            >
              <DatePicker
                locale={zhCN}
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #B8E4F7',
                  color: '#333333',
                  borderRadius: '8px',
                }}
                placeholder="请选择维修时间"
              />
            </Form.Item>

            {/* 添加选项区域 */}
            <div style={{ marginBottom: '16px' }}>
              <Button
                icon={<PlusOutlined />}
                onClick={addRepairItem}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #B8E4F7',
                  color: '#0984e3',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}
              >
                添加选项
              </Button>
              <div style={{ background: '#F0F9FF', borderRadius: '8px', padding: '12px' }}>
                {repairItems.map((item, index) => (
                  <div key={item.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed #B8E4F7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 500, color: '#0984e3' }}>{index + 1}.</span>
                      <span style={{ flex: 1 }}>设备信息</span>
                      <Button
                        icon={<DeleteOutlined />}
                        onClick={() => removeRepairItem(item.id)}
                        danger
                        size="small"
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <Input
                      value={item.equipmentName}
                      onChange={(e) => updateRepairItem(item.id, 'equipmentName', e.target.value)}
                      placeholder="请输入设备名称"
                      style={{
                        marginBottom: '12px',
                        background: '#FFFFFF',
                        border: '1px solid #B8E4F7',
                        color: '#333333',
                        borderRadius: '8px',
                      }}
                    />
                    <TextArea
                      value={item.remarks}
                      onChange={(e) => updateRepairItem(item.id, 'remarks', e.target.value)}
                      placeholder="请输入备注信息"
                      rows={2}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #B8E4F7',
                        color: '#333333',
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                ))}
                {repairItems.length === 0 && (
                  <p style={{ color: '#999', fontSize: '14px', margin: 0, textAlign: 'center' }}>
                    点击上方按钮添加维修项
                  </p>
                )}
              </div>
            </div>
          </div>



          <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleSubmit}
              loading={loading}
              style={{
                background: 'linear-gradient(90deg, #0984e3 0%, #00d9ff 100%)',
                border: 'none',
                borderRadius: '8px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)',
              }}
            >
              提交维修
            </Button>
          </Form.Item>
        </Form>

        <style>{`
          .ant-form-item-label > label {
            color: #333333 !important;
            font-weight: 500;
          }
          *::placeholder,
          *::-webkit-input-placeholder,
          *::-moz-placeholder,
          *:-ms-input-placeholder {
            color: #999999 !important;
            opacity: 1 !important;
          }
          .ant-input-placeholder,
          .ant-picker-placeholder {
            color: #999999 !important;
            opacity: 1 !important;
          }
          .ant-picker-input > input {
            color: #333333 !important;
          }
          .ant-input {
            color: #333333 !important;
          }
          .ant-input-textarea {
            color: #333333 !important;
          }
        `}</style>
      </div>
    </div>
  );
}
