import { Grid } from 'antd';

const { useBreakpoint } = Grid;

/** 与 MOBILE.md 约定一致：< md(768px) 视为移动端 */
export function useIsMobile() {
  const screens = useBreakpoint();
  return !screens.md;
}
