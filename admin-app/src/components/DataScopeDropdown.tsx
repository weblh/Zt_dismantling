import { useEffect, useState } from 'react';
import { Dropdown, Button, Tooltip } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { getStoredUser } from '@/config/apps';

export type DataScope = 'all' | 'dept' | 'self';

const SCOPE_LABELS: Record<DataScope, string> = {
  all: '查看所有数据',
  dept: '本部门数据',
  self: '仅本人数据',
};

/**
 * 查验模块权限分类：
 * - 查验员(INSPECTOR)：可切换权限分类，默认仅本人
 * - 超管：可切换全部范围
 * - 普通用户：仅可查看，不可更改（文档：仅查验员更改）
 */
export default function DataScopeDropdown({
  onChange,
}: {
  onChange?: (scope: DataScope) => void;
}) {
  const user = getStoredUser();
  const isInspector = user.role === 'INSPECTOR';
  const isAdmin = user.role === 'SUPER_ADMIN';
  const canChange = isInspector || isAdmin;
  const [scope, setScope] = useState<DataScope>(isInspector ? 'self' : 'all');

  useEffect(() => {
    onChange?.(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: MenuProps['items'] = isInspector
    ? [
        { key: 'self', label: SCOPE_LABELS.self },
        { key: 'dept', label: SCOPE_LABELS.dept },
      ]
    : [
        { key: 'all', label: SCOPE_LABELS.all },
        { key: 'dept', label: SCOPE_LABELS.dept },
        { key: 'self', label: SCOPE_LABELS.self },
      ];

  const button = (
    <Button disabled={!canChange}>
      {SCOPE_LABELS[scope]} <DownOutlined />
    </Button>
  );

  if (!canChange) {
    return <Tooltip title="仅查验员或管理员可更改权限分类">{button}</Tooltip>;
  }

  return (
    <Dropdown
      menu={{
        items,
        selectedKeys: [scope],
        onClick: ({ key }) => {
          const next = key as DataScope;
          setScope(next);
          onChange?.(next);
        },
      }}
    >
      {button}
    </Dropdown>
  );
}
