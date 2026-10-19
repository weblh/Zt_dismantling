import type { TablePaginationConfig } from 'antd/es/table';

/** 合并移动端分页默认行为，业务页可继续覆盖 */
export function withMobilePagination(
  isMobile: boolean,
  config: TablePaginationConfig = {},
): TablePaginationConfig {
  return {
    ...config,
    size: isMobile ? 'small' : config.size,
    simple: isMobile ? true : config.simple,
    showSizeChanger: isMobile ? false : config.showSizeChanger ?? true,
  };
}
