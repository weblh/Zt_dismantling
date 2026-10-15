import type { MenuProps } from 'antd';
import type { MenuNode } from '@/api/menus';
import { resolveMenuIcon } from '@/utils/menuIcons';

type MenuItem = NonNullable<MenuProps['items']>[number];

export function menusToAntdItems(nodes: MenuNode[]): MenuItem[] {
  return nodes.map((n) => {
    const children = n.children?.length ? menusToAntdItems(n.children) : undefined;
    return {
      key: n.path || `menu-${n.id}`,
      icon: resolveMenuIcon(n.icon),
      label: n.name,
      children,
    } as MenuItem;
  });
}

export function collectOpenKeys(nodes: MenuNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    if (n.children?.length) {
      if (n.path) acc.push(n.path);
      collectOpenKeys(n.children, acc);
    }
  }
  return acc;
}

export function flattenMenuIds(nodes: MenuNode[], acc: number[] = []): number[] {
  for (const n of nodes) {
    acc.push(n.id);
    if (n.children?.length) flattenMenuIds(n.children, acc);
  }
  return acc;
}

export function menusToTreeData(nodes: MenuNode[]): { title: string; key: number; children?: ReturnType<typeof menusToTreeData> }[] {
  return nodes.map((n) => ({
    title: n.name,
    key: n.id,
    children: n.children?.length ? menusToTreeData(n.children) : undefined,
  }));
}
