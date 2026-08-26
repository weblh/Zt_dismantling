/** 部门选项（本部门权限过滤、付款申请等共用） */
export const DEPARTMENT_OPTIONS = [
  { value: '财经运营部', label: '财经运营部' },
  { value: '生产部', label: '生产部' },
  { value: '仓储部', label: '仓储部' },
  { value: '维修部', label: '维修部' },
  { value: '车队', label: '车队' },
  { value: '查验部', label: '查验部' },
];

export function getDepartmentLabel(value?: string) {
  return DEPARTMENT_OPTIONS.find((d) => d.value === value)?.label || value || '';
}
