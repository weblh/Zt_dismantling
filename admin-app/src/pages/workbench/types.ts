/** 工作台聚合的审批流程类型 */

export type WorkbenchBizKey =
  | 'payment-application'
  | 'finished-product-approval'
  | 'part-approval';

export type FlowTabKey = 'todo' | 'initiated' | 'processed' | 'cc' | 'launch' | 'delegate';

export interface WorkbenchFlowItem {
  id: string;
  bizKey: WorkbenchBizKey;
  formName: string;
  dataId?: string;
  title: string;
  statusLabel: string;
  processStatus: string;
  currentNode: string;
  currentHandler: string;
  submitter: string;
  applicant: string;
  submitTime: string;
  updateTime: string;
  /** 卡片摘要字段 */
  fields: { label: string; value: string }[];
  /** 原始行，供详情抽屉使用 */
  raw: Record<string, unknown>;
}

/** 聚合拉取用的审批表单（去重） */
export const FLOW_FORMS: {
  bizKey: WorkbenchBizKey;
  formName: string;
  launchPath: string;
  color: string;
  group: string;
}[] = [
  {
    bizKey: 'payment-application',
    formName: '业务结账付款申请',
    launchPath: '/business/payment-application',
    color: '#722ed1',
    group: '汽车拆解_收车',
  },
  {
    bizKey: 'finished-product-approval',
    formName: '成品销售审批单',
    launchPath: '/sales/finished-product-approval',
    color: '#1677ff',
    group: '汽车拆解_收车',
  },
  {
    bizKey: 'part-approval',
    formName: '配件销售审批单',
    launchPath: '/sales/part-approval',
    color: '#13c2c2',
    group: '汽车拆解_收车',
  },
];

/** 发起流程卡片（按业务应用分组展示，跳转同一套本系统审批页） */
export const LAUNCH_CARDS: {
  id: string;
  formName: string;
  launchPath: string;
  color: string;
  group: string;
}[] = [
  {
    id: 'receipt-payment',
    formName: '业务结账付款申请',
    launchPath: '/business/payment-application',
    color: '#722ed1',
    group: '汽车拆解_收车',
  },
  {
    id: 'receipt-finished',
    formName: '成品销售审批单',
    launchPath: '/sales/finished-product-approval',
    color: '#1677ff',
    group: '汽车拆解_收车',
  },
  {
    id: 'receipt-part',
    formName: '配件销售审批单',
    launchPath: '/sales/part-approval',
    color: '#13c2c2',
    group: '汽车拆解_收车',
  },
  {
    id: 'pricing-payment',
    formName: '业务结账付款申请',
    launchPath: '/business/payment-application',
    color: '#52c41a',
    group: '汽车拆解_收货议价',
  },
  {
    id: 'pricing-finished',
    formName: '成品销售审批单',
    launchPath: '/sales/finished-product-approval',
    color: '#73d13d',
    group: '汽车拆解_收货议价',
  },
  {
    id: 'pricing-part',
    formName: '配件销售审批单',
    launchPath: '/sales/part-approval',
    color: '#95de64',
    group: '汽车拆解_收货议价',
  },
];

export function isCompletedStatus(status: string) {
  const s = (status || '').trim().toLowerCase();
  return (
    s === 'completed' ||
    s === '流转完成' ||
    status.includes('已通过') ||
    status.includes('已完成') ||
    status.includes('手动结束') ||
    status.includes('流转完成')
  );
}

export function isRejectedStatus(status: string) {
  const s = (status || '').trim();
  return s.includes('否决') || s.includes('驳回') || s.toLowerCase() === 'rejected';
}

export function isProcessingStatus(status: string) {
  return !isCompletedStatus(status) && !isRejectedStatus(status);
}

export function statusDisplay(status: string, currentNode?: string) {
  if (isRejectedStatus(status)) return status.includes('否决') ? '否决' : '已驳回';
  if (isCompletedStatus(status)) {
    if (status.includes('手动结束')) return '手动结束';
    return '已完成';
  }
  return currentNode || '进行中';
}
