import { useState, useRef } from 'react';
import { Form, Input, DatePicker, Button, Radio, message, Image } from 'antd';
import { CameraOutlined, PictureOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/date-picker/locale/zh_CN';

const { TextArea } = Input;

const statusOptions = [
  { value: 'normal', label: '正常' },
  { value: 'abnormal', label: '异常' },
];

export default function InspectionFormPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      setLoading(true);
      setTimeout(() => {
        console.log('表单数据:', values);
        console.log('图片:', images);
        message.success('提交成功！');
        form.resetFields();
        setImages([]);
        setLoading(false);
      }, 1000);
    }).catch((errorInfo) => {
      console.log('表单验证失败:', errorInfo);
    });
  };

  const handlePhoto = (type: 'camera' | 'gallery') => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = type === 'camera' ? 'environment' : undefined as unknown as string;
      input.multiple = true;
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        if (files) {
          Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
              setImages(prev => [...prev, event.target?.result as string]);
            };
            reader.readAsDataURL(file);
          });
        }
      };
      fileInputRef.current = input;
    }
    fileInputRef.current.capture = type === 'camera' ? 'environment' : undefined as unknown as string;
    fileInputRef.current.click();
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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
          }}>巡检表单</h1>
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
            }}>一、巡检信息</h2>

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
              label="巡检时间"
              name="inspectionTime"
              rules={[{ required: true, message: '请选择巡检时间' }]}
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
                placeholder="请选择巡检时间"
              />
            </Form.Item>

            <Form.Item
              label="巡检状态"
              name="status"
              rules={[{ required: true, message: '请选择巡检状态' }]}
              labelCol={{ style: { marginBottom: '8px' } }}
            >
              <Radio.Group
                options={statusOptions}
                buttonStyle="solid"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              />
            </Form.Item>

            <Form.Item
              label="巡检内容"
              name="inspectionContent"
              rules={[{ required: true, message: '请输入巡检内容' }]}
              labelCol={{ style: { marginBottom: '8px' } }}
            >
              <TextArea
                placeholder="请描述巡检的具体内容、发现的问题等"
                rows={4}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #B8E4F7',
                  color: '#333333',
                  borderRadius: '8px',
                }}
              />
            </Form.Item>
          </div>

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
            }}>二、现场照片</h2>

            {/* 图片上传区域 */}
            <div style={{
              background: '#F0F9FF',
              border: '1px dashed #B8E4F7',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  onClick={() => handlePhoto('camera')}
                  style={{
                    background: 'linear-gradient(90deg, #0984e3 0%, #00d9ff 100%)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                >
                  拍照
                </Button>
                <Button
                  icon={<PictureOutlined />}
                  onClick={() => handlePhoto('gallery')}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #B8E4F7',
                    color: '#0984e3',
                    borderRadius: '8px',
                  }}
                >
                  相册
                </Button>
              </div>
              <p style={{ color: '#666666', fontSize: '14px', margin: 0 }}>
                支持拍照或从相册选择图片
              </p>
            </div>

            {/* 已上传图片展示 */}
            {images.length > 0 && (
              <div style={{
                marginTop: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                {images.map((img, index) => (
                  <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <Image
                      src={img}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <button
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        background: '#ff4d4f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#0984e3',
              marginBottom: '16px',
            }}>三、备注信息</h2>

            <Form.Item
              label="备注"
              name="remarks"
              labelCol={{ style: { marginBottom: '8px' } }}
            >
              <TextArea
                placeholder="请输入其他备注信息"
                rows={3}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #B8E4F7',
                  color: '#333333',
                  borderRadius: '8px',
                }}
              />
            </Form.Item>
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
              提交巡检
            </Button>
          </Form.Item>
        </Form>

        <style>{`
          .ant-form-item-label > label {
            color: #333333 !important;
            font-weight: 500;
          }
          .ant-select-item-option-content {
            color: #333333 !important;
          }
          .ant-radio-wrapper {
            color: #333333 !important;
          }
          *::placeholder,
          *::-webkit-input-placeholder,
          *::-moz-placeholder,
          *:-ms-input-placeholder {
            color: #999999 !important;
            opacity: 1 !important;
          }
          .ant-select-selection-placeholder,
          .ant-select-placeholder,
          .ant-input-placeholder,
          .ant-picker-placeholder {
            color: #999999 !important;
            opacity: 1 !important;
          }
          .ant-select-selector {
            color: #333333 !important;
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
          .ant-radio-button-wrapper-checked {
            background-color: #0984e3 !important;
            color: #fff !important;
            border-color: #0984e3 !important;
          }
        `}</style>
      </div>
    </div>
  );
}
