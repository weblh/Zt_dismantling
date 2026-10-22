/** 详情/表单底部：提交人、提交时间、更新时间（对齐业务结账） */
export default function BizFormMetaFooter({
  submitter = '-',
  submitTime = '-',
  updateTime = '-',
}: {
  submitter?: string;
  submitTime?: string;
  updateTime?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
        padding: '12px 0 20px',
        borderTop: '1px solid #f0f0f0',
        color: '#666',
        fontSize: 13,
      }}
    >
      <span>
        <span style={{ color: '#999' }}>提交人</span>
        <span style={{ marginLeft: 8, color: '#1890ff' }}>{submitter || '-'}</span>
      </span>
      <span>
        <span style={{ color: '#999' }}>提交时间</span>
        <span style={{ marginLeft: 8 }}>{submitTime || '-'}</span>
      </span>
      <span>
        <span style={{ color: '#999' }}>更新时间</span>
        <span style={{ marginLeft: 8 }}>{updateTime || '-'}</span>
      </span>
    </div>
  );
}

export function bizRecordKey(
  record: { id?: number | string; dataId?: string } | null | undefined,
) {
  if (!record) return undefined;
  if (record.dataId) return String(record.dataId);
  if (record.id != null) return String(record.id);
  return undefined;
}
