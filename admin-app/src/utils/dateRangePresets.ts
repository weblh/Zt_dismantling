import dayjs, { type Dayjs } from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(quarterOfYear);

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'custom'
  | 'all';

export interface DateRangeValue {
  preset: DateRangePreset;
  start: string;
  end: string;
  label: string;
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: '今日',
  yesterday: '昨天',
  last7: '近7天',
  last30: '近30天',
  thisWeek: '本周',
  lastWeek: '上周',
  thisMonth: '本月',
  lastMonth: '上月',
  thisQuarter: '本季度',
  lastQuarter: '上季度',
  thisYear: '今年',
  lastYear: '去年',
  custom: '自定义区间',
  all: '全部',
};

/** 大屏筛选：日 / 月 / 年 / 区间 / 全部 */
export const DASHBOARD_DATE_PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: 'thisMonth', label: '本月' },
  { value: 'thisYear', label: '今年' },
  { value: 'custom', label: '自定义区间' },
  { value: 'all', label: '全部' },
];

export const DATE_RANGE_PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = (
  Object.keys(PRESET_LABELS) as DateRangePreset[]
).map((value) => ({ value, label: PRESET_LABELS[value] }));

function fmt(d: Dayjs) {
  return d.format('YYYY-MM-DD');
}

export function resolveDateRange(
  preset: DateRangePreset,
  custom?: [Dayjs, Dayjs] | null,
): DateRangeValue {
  const now = dayjs();
  let start = now.startOf('day');
  let end = now.endOf('day');
  let label = PRESET_LABELS.today;

  switch (preset) {
    case 'all':
      return { preset, start: 'all', end: 'all', label: PRESET_LABELS.all };
    case 'today':
      break;
    case 'yesterday':
      start = now.subtract(1, 'day').startOf('day');
      end = now.subtract(1, 'day').endOf('day');
      label = PRESET_LABELS.yesterday;
      break;
    case 'last7':
      start = now.subtract(6, 'day').startOf('day');
      label = PRESET_LABELS.last7;
      break;
    case 'last30':
      start = now.subtract(29, 'day').startOf('day');
      label = PRESET_LABELS.last30;
      break;
    case 'thisWeek':
      start = now.startOf('week');
      end = now.endOf('week');
      label = PRESET_LABELS.thisWeek;
      break;
    case 'lastWeek':
      start = now.subtract(1, 'week').startOf('week');
      end = now.subtract(1, 'week').endOf('week');
      label = PRESET_LABELS.lastWeek;
      break;
    case 'thisMonth':
      start = now.startOf('month');
      end = now.endOf('month');
      label = PRESET_LABELS.thisMonth;
      break;
    case 'lastMonth':
      start = now.subtract(1, 'month').startOf('month');
      end = now.subtract(1, 'month').endOf('month');
      label = PRESET_LABELS.lastMonth;
      break;
    case 'thisQuarter':
      start = now.startOf('quarter');
      end = now.endOf('quarter');
      label = PRESET_LABELS.thisQuarter;
      break;
    case 'lastQuarter':
      start = now.subtract(1, 'quarter').startOf('quarter');
      end = now.subtract(1, 'quarter').endOf('quarter');
      label = PRESET_LABELS.lastQuarter;
      break;
    case 'thisYear':
      start = now.startOf('year');
      end = now.endOf('year');
      label = PRESET_LABELS.thisYear;
      break;
    case 'lastYear':
      start = now.subtract(1, 'year').startOf('year');
      end = now.subtract(1, 'year').endOf('year');
      label = PRESET_LABELS.lastYear;
      break;
    case 'custom':
      if (custom?.[0] && custom?.[1]) {
        start = custom[0].startOf('day');
        end = custom[1].endOf('day');
        label = `${fmt(start)} ~ ${fmt(end)}`;
      } else {
        label = PRESET_LABELS.custom;
      }
      break;
  }

  return {
    preset,
    start: fmt(start),
    end: fmt(end),
    label,
  };
}

/** 下方「主值 / 次值」文案，随筛选变化 */
export function periodCompareLabels(preset: DateRangePreset): {
  head: string;
  primary: string;
  secondary: string;
  showSecondary: boolean;
  staffPrimary: string;
  staffSecondary: string;
} {
  switch (preset) {
    case 'today':
      return {
        head: '今日 · 本年',
        primary: '今日',
        secondary: '本年',
        showSecondary: true,
        staffPrimary: '今日',
        staffSecondary: '本年',
      };
    case 'thisMonth':
      return {
        head: '本月 · 本年',
        primary: '本月',
        secondary: '本年',
        showSecondary: true,
        staffPrimary: '本月',
        staffSecondary: '本年',
      };
    case 'thisYear':
      return {
        head: '本月 · 本年',
        primary: '本月',
        secondary: '本年',
        showSecondary: true,
        staffPrimary: '本月',
        staffSecondary: '本年',
      };
    case 'all':
      return {
        head: '全部',
        primary: '全部',
        secondary: '',
        showSecondary: false,
        staffPrimary: '全部',
        staffSecondary: '全部',
      };
    case 'custom':
      return {
        head: '区间 · 本年',
        primary: '区间',
        secondary: '本年',
        showSecondary: true,
        staffPrimary: '区间',
        staffSecondary: '本年',
      };
    default:
      return {
        head: '期间 · 本年',
        primary: '期间',
        secondary: '本年',
        showSecondary: true,
        staffPrimary: '期间',
        staffSecondary: '本年',
      };
  }
}
