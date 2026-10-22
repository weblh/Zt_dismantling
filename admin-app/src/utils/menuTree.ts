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

/** Flatten menu tree to path → title map (prefer leaf menu names). */
export function buildMenuPathTitleMap(nodes: MenuNode[], acc: Record<string, string> = {}): Record<string, string> {
  for (const n of nodes) {
    if (n.path?.startsWith('/') && n.name) {
      if (!n.children?.length) {
        acc[n.path] = n.name;
      } else if (!(n.path in acc)) {
        acc[n.path] = n.name;
      }
    }
    if (n.children?.length) {
      buildMenuPathTitleMap(n.children, acc);
    }
  }
  return acc;
}

/** Parent submenu keys that should stay open for the current path. */
export function findMenuOpenKeys(nodes: MenuNode[], pathname: string, parents: string[] = []): string[] {
  for (const n of nodes) {
    const key = n.path || `menu-${n.id}`;
    if (n.path === pathname) return parents;
    if (n.children?.length) {
      const found = findMenuOpenKeys(n.children, pathname, [...parents, key]);
      if (found.length || n.children.some((c) => c.path === pathname)) {
        return found.length ? found : [...parents, key];
      }
      // continue search in siblings after checking this branch
      const deep = findMenuOpenKeys(n.children, pathname, [...parents, key]);
      if (deep.length) return deep;
    }
  }
  return [];
}

export function findMenuTitleByKey(nodes: MenuNode[], key: string): string | undefined {
  for (const n of nodes) {
    const itemKey = n.path || `menu-${n.id}`;
    if (itemKey === key || n.path === key) return n.name;
    if (n.children?.length) {
      const found = findMenuTitleByKey(n.children, key);
      if (found) return found;
    }
  }
  return undefined;
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
