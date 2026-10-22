import { useMemo, useState } from 'react';
import { Button, Checkbox, Input, Popover, Space } from 'antd';
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

/**
 * 勾选字段后，用单个关键字在选中字段上做模糊匹配（任一字段命中即可）。
 * selectedFields 为空时，在除 id/key 外的全部字段上搜索。
 */
export function filterBasicRows<T extends object>(
  rows: T[],
  keyword: string,
  selectedFields: string[] = [],
): T[] {
  const needle = keyword.trim();
  if (!needle) return rows;
  return rows.filter((row) => {
    const record = row as Record<string, unknown>;
    const keys =
      selectedFields.length > 0
        ? selectedFields
        : Object.keys(record).filter((key) => key !== 'id' && key !== 'key');
    return keys.some((key) => fuzzyIncludes(record[key], needle));
  });
}

interface BasicFuzzyFilterProps {
  fields: FuzzyField[];
  keyword: string;
  onKeywordChange: (value: string) => void;
  /** 勾选的列表字段 key；空数组表示搜索全部字段 */
  selectedFields: string[];
  onSelectedFieldsChange: (fields: string[]) => void;
  inputWidth?: number | string;
  /** 为 false 时不自动追加提交人/提交时间/更新时间 */
  includeMetaFields?: boolean;
}

/** 列表右上角：勾选字段 + 单个模糊搜索输入框 */
export default function BasicFuzzyFilter({
  fields,
  keyword,
  onKeywordChange,
  selectedFields,
  onSelectedFieldsChange,
  inputWidth = 200,
  includeMetaFields = true,
}: BasicFuzzyFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftKeys, setDraftKeys] = useState<string[]>([]);
  const allFields = useMemo(
    () => (includeMetaFields ? [...fields, ...META_FIELDS] : fields),
    [fields, includeMetaFields],
  );

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
          if (next) {
            setDraftKeys(
              selectedFields.length > 0
                ? [...selectedFields]
                : allFields.map((f) => f.key),
            );
          }
        }}
        content={(
          <div style={{ width: 260 }}>
            <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
              勾选字段后，在输入框中模糊搜索
            </div>
            <Checkbox.Group
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              value={draftKeys}
              options={allFields.map((f) => ({ label: f.label, value: f.key }))}
              onChange={(vals) => setDraftKeys(vals as string[])}
            />
            <Space style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <Button
                onClick={() => {
                  setDraftKeys(allFields.map((f) => f.key));
                  onSelectedFieldsChange([]);
                  setOpen(false);
                }}
              >
                清空
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  const allSelected =
                    draftKeys.length === 0 || draftKeys.length === allFields.length;
                  onSelectedFieldsChange(allSelected ? [] : draftKeys);
                  setOpen(false);
                }}
              >
                确定
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
          {selectedFields.length > 0 ? `(${selectedFields.length})` : ''}
        </Button>
      </Popover>
    </Space>
  );
}
