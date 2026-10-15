import { useEffect, useState } from 'react';
import { listDeptOptions, type DeptOption } from '@/api/depts';

/** 本地兜底（未同步钉钉前仍可用） */
export const FALLBACK_DEPARTMENT_OPTIONS: DeptOption[] = [
  { value: '财经运营部', label: '财经运营部' },
  { value: '生产部', label: '生产部' },
  { value: '仓储部', label: '仓储部' },
  { value: '维修部', label: '维修部' },
  { value: '车队', label: '车队' },
  { value: '查验部', label: '查验部' },
];

/** @deprecated 请优先使用 useDepartmentOptions；保留导出兼容旧页面 */
export const DEPARTMENT_OPTIONS = FALLBACK_DEPARTMENT_OPTIONS;

export function getDepartmentLabel(value?: string) {
  return (
    FALLBACK_DEPARTMENT_OPTIONS.find((d) => d.value === value)?.label || value || ''
  );
}

/** 优先用本地 sys_dept（钉钉同步），失败则回退硬编码 */
export function useDepartmentOptions() {
  const [options, setOptions] = useState<DeptOption[]>(FALLBACK_DEPARTMENT_OPTIONS);

  useEffect(() => {
    let cancelled = false;
    listDeptOptions()
      .then((res) => {
        if (!cancelled && res.data?.length) {
          setOptions(res.data);
        }
      })
      .catch(() => {
        /* 保持兜底 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return options;
}
