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
  | 'custom';

export interface DateRangeValue {
  preset: DateRangePreset;
  start: string;
  end: string;
  label: string;
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: '今天 Today',
  yesterday: '昨天 Yesterday',
  last7: '近7天 Last 7 Days',
  last30: '近30天 Last 30 Days',
  thisWeek: '本周 This Week',
  lastWeek: '上周 Last Week',
  thisMonth: '本月 This Month',
  lastMonth: '上月 Last Month',
  thisQuarter: '本季度 This Quarter',
  lastQuarter: '上季度 Last Quarter',
  thisYear: '今年 This Year',
  lastYear: '去年 Last Year',
  custom: '自定义 Custom',
};

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
