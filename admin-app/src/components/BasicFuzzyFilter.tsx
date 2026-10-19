import { useMemo, useState } from 'react';
import { Button, Input, Popover, Space } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

export interface FuzzyField {
  key: string;
  label: string;
}

const META_FIELDS: FuzzyField[] = [
  { key: 'submitter', label: '提交人' },
  { key: 'submitTime', label: '提交时间' },
  { key: 'updateTime', label: '更新时间' },
];

function normalize(value: unknown) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, '');
}

function fuzzyIncludes(value: unknown, keyword: string) {
  const needle = normalize(keyword);
  if (!needle) return true;
  return normalize(value).includes(needle);
}

/** 关键字命中任意字段，筛选条件按字段模糊匹配后同时满足 */
export function filterBasicRows<T extends object>(
  rows: T[],
  keyword: string,
  fieldFilters: Record<string, string>,
): T[] {
  const activeFilters = Object.entries(fieldFilters).filter(([, value]) => value.trim());
  const needle = keyword.trim();
  if (!needle && activeFilters.length === 0) return rows;
  return rows.filter((row) => {
    const record = row as Record<string, unknown>;
    if (needle) {
      const hit = Object.entries(record).some(([key, value]) => {
        if (key === 'id' || key === 'key') return false;
        return fuzzyIncludes(value, needle);
      });
      if (!hit) return false;
    }
    return activeFilters.every(([key, value]) => fuzzyIncludes(record[key], value));
  });
}

interface BasicFuzzyFilterProps {
  fields: FuzzyField[];
  keyword: string;
  onKeywordChange: (value: string) => void;
  filters: Record<string, string>;
  onFiltersChange: (filters: Record<string, string>) => void;
  inputWidth?: number | string;
}

/** 基础资料列表右上角：搜索框与筛选都按包含关系模糊匹配 */
export default function BasicFuzzyFilter({
  fields,
  keyword,
  onKeywordChange,
  filters,
  onFiltersChange,
  inputWidth = 200,
}: BasicFuzzyFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const allFields = useMemo(() => [...fields, ...META_FIELDS], [fields]);

  return (
    <Space wrap style={{ width: inputWidth === '100%' ? '100%' : undefined }}>
      <Input
        placeholder="模糊搜索"
        value={keyword}
        allowClear
        style={{ width: inputWidth }}
        onChange={(e) => onKeywordChange(e.target.value)}
      />
      <Popover
        trigger="click"
        open={open}
        placement="bottomRight"
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setDraft(filters);
        }}
        content={(
          <div style={{ width: 280 }}>
            {allFields.map((field) => (
              <div key={field.key} style={{ marginBottom: 8 }}>
                <div style={{ marginBottom: 4, color: '#666' }}>{field.label}</div>
                <Input
                  allowClear
                  placeholder="模糊匹配"
                  value={draft[field.key] || ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setDraft({});
                  onFiltersChange({});
                  setOpen(false);
                }}
              >
                清空
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  onFiltersChange(draft);
                  setOpen(false);
                }}
              >
                筛选
              </Button>
            </Space>
          </div>
        )}
      >
        <Button
          icon={<FilterOutlined />}
          style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
        >
          筛选
        </Button>
      </Popover>
    </Space>
  );
}
