import { useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Typography, message } from 'antd';
import {
  ExportOutlined,
  ReloadOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';

const { Text } = Typography;

const JDY_APP_ID = '65c1cb717f6b878acaadd2ab';
const JDY_BASE =
  (import.meta.env.VITE_JDY_APP_BASE as string | undefined)?.replace(/\/$/, '') ||
  'https://dingtalk.jiandaoyun.com/dashboard';

/** 简道云表单 / 流程页 */
export const JDY_FORM_LINKS: Record<string, { name: string; entryId?: string; flow?: string }> = {
  receipt: { name: '1.业务收货', entryId: '662dc1c2e0555ac4e79278c3' },
  'weighing-inspection': { name: '2.过磅查验', entryId: '662dc4486b4c3bc965464bae' },
  'inspection-photo': { name: '3.查验照片', entryId: '663b1e88ba845cf48827ee01' },
  'scrapped-vehicle': { name: '4.报废车入库', entryId: '662dc901bcd3aaaab61ba2c5' },
  'pick-top-photo': { name: '5.挑顶照片', entryId: '662df863bf6b4a2bd11c9bc1' },
  disassembly: { name: '6.拆解', entryId: '662df865bf6b4a2bd11c9d6e' },
  'comprehensive-disassembly': { name: '7.综合拆解', entryId: '662df8672ff334b695e36ea7' },
  settlement: { name: '业务结账', entryId: '663b3f2ee0b00783765247b2' },
  'payment-application': { name: '业务结账付款申请', entryId: '66f8e827c75fa95816c2bef3' },
  'price-change': { name: '修改价格', entryId: '66a1feb91fcd7c001cc5682f' },
  'weighing-sync': { name: '1、过磅同步数据', entryId: '66a20b980183b692cab589c9' },
  'vehicle-photo': { name: '异地车回车照片', entryId: '663b2edc056afeba75ade772' },
  salesman: { name: '业务员', entryId: '662df42caac7fa9673a158e7' },
  supplier: { name: '供应商基础资料', entryId: '6617543cbad6f2f89103bc62' },
  'vehicle-model': { name: '车辆型号', entryId: '663b1d28e70ddd5951d36e4b' },
  warehouse: { name: '仓库', entryId: '66f8b152abee705881eec3a5' },
  'product-name': { name: '产品名称', entryId: '66f8b2fcb00b52e5eb7841ed' },
  'payee-info': { name: '收款人信息', entryId: '672f20b05a9cca282dabcf68' },
  vin: { name: 'VIN识别', entryId: '662862b4b50583466d931c7a' },
  'vehicle-archive': { name: '车辆档案识别', entryId: '65fa3de0ece826d5a80f29f5' },
  todo: { name: '我的待办', flow: 'todo' },
  initiated: { name: '我发起的', flow: 'create' },
  processed: { name: '我处理的', flow: 'handle' },
  copied: { name: '抄送我的', flow: 'cc' },
};

export function buildJdyUrl(options?: { entryId?: string; flow?: string }) {
  if (options?.flow) {
    return `${JDY_BASE}#/app/${JDY_APP_ID}/flow/${options.flow}`;
  }
  if (options?.entryId) {
    return `${JDY_BASE}#/app/${JDY_APP_ID}/form/${options.entryId}`;
  }
  return `${JDY_BASE}#/app/${JDY_APP_ID}`;
}

export default function JdyEmbedPage() {
  const [params] = useSearchParams();
  const formKey = params.get('form') || '';
  const [reloadKey, setReloadKey] = useState(0);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  const link = formKey ? JDY_FORM_LINKS[formKey] : undefined;
  const src = useMemo(() => {
    if (link?.flow) {
      return buildJdyUrl({ flow: link.flow });
    }
    if (link?.entryId) {
      return buildJdyUrl({ entryId: link.entryId });
    }
    return buildJdyUrl();
  }, [link]);

  const title = link?.name || '汽车拆解-收车（简道云整站）';

  const openExternal = () => {
    window.open(src, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ height: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>{title}</Text>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setIframeBlocked(false);
                setReloadKey((k) => k + 1);
              }}
            >
              刷新
            </Button>
            <Button icon={<ExportOutlined />} type="primary" onClick={openExternal}>
              在简道云中打开（完整功能）
            </Button>
            <Button
              icon={<FullscreenOutlined />}
              onClick={() => {
                const el = document.getElementById('jdy-embed-frame');
                if (el && el.requestFullscreen) {
                  el.requestFullscreen().catch(() => message.warning('无法全屏'));
                }
              }}
            >
              全屏
            </Button>
          </Space>
        </Space>
        <Alert
          style={{ marginTop: 8 }}
          type={iframeBlocked ? 'warning' : 'info'}
          showIcon
          message={
            iframeBlocked
              ? '内嵌被拦截：请点「在简道云中打开」使用完整功能'
              : '侧栏菜单已直连简道云「汽车拆解-收车」：表单、流程、待办与现网一致'
          }
          description="本地列表页无法 1:1 复刻简道云（权限/流程/附件/打印等）。此处打开的是简道云真实页面；若下方空白，用外开按钮。"
          action={
            <Button size="small" type="primary" onClick={openExternal}>
              立即打开
            </Button>
          }
        />
      </Card>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <iframe
          id="jdy-embed-frame"
          key={`${src}-${reloadKey}`}
          title={title}
          src={src}
          style={{ width: '100%', height: '100%', border: 'none' }}
          referrerPolicy="no-referrer-when-downgrade"
          onError={() => setIframeBlocked(true)}
        />
      </div>
    </div>
  );
}
