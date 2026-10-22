import { Modal } from 'antd';
import type { SourceBreakdownItem } from '@/api/dashboard';

interface Props {
  open: boolean;
  title: string;
  total: number;
  unit?: string;
  bySource?: SourceBreakdownItem[];
  onClose: () => void;
}

export default function SourceBreakdownModal({
  open,
  title,
  total,
  unit = '辆',
  bySource = [],
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      title={`${title} · 来源明细 Source Breakdown`}
      onCancel={onClose}
      footer={null}
      width={420}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
        汇总为「收车」与「议价」两个简道云应用数据之和。Totals combine Receipt and Pricing apps.
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '12px 14px',
        marginBottom: 12,
        background: '#f5f9ff',
        border: '1px solid #91d5ff',
        borderRadius: 8,
      }}>
        <span style={{ fontSize: 15, color: '#1a3a5c', fontWeight: 600 }}>合计 Total</span>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#1890ff', fontFamily: 'DIN, Arial, sans-serif' }}>
          {total.toLocaleString()}
          <span style={{ fontSize: 13, color: '#999', marginLeft: 4, fontWeight: 400 }}>{unit}</span>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(bySource.length ? bySource : [
          { source: '收车', value: 0 },
          { source: '议价', value: 0 },
        ]).map((item) => (
          <div
            key={item.source}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              border: '1px solid #e6eef8',
              borderRadius: 8,
              background: '#fff',
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a3a5c' }}>
                {item.source === '议价' ? '议价系统 Pricing' : item.source === '收车' ? '收车系统 Receipt' : `${item.source}系统`}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                {item.source === '议价' ? '汽车拆解_收车议价' : '汽车拆解-收车'}
              </div>
            </div>
            <div style={{
              fontSize: 26,
              fontWeight: 700,
              color: item.source === '议价' ? '#fa8c16' : '#00b894',
              fontFamily: 'DIN, Arial, sans-serif',
            }}>
              {(item.value ?? 0).toLocaleString()}
              <span style={{ fontSize: 13, color: '#999', marginLeft: 4, fontWeight: 400 }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
