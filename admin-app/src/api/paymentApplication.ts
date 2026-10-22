import request from '@/utils/request';

export interface ProcessNode {
  id: number;
  nodeKey: string;
  nodeName: string;
  nodeType: string;
  sortOrder: number;
  branch: string;
  description?: string;
}

export interface ProcessTimelineItem {
  id: number;
  recordKey: string;
  nodeKey?: string;
  nodeName?: string;
  action?: string;
  operatorName?: string;
  remark?: string;
  createdAt?: string;
}

export interface RecordComment {
  id: number;
  recordKey: string;
  content: string;
  authorName?: string;
  createdAt?: string;
}

export interface DataLogItem {
  id: number;
  recordKey: string;
  action?: string;
  operatorName?: string;
  summary?: string;
  createdAt?: string;
}

/** 本系统本地提交并启动流程（不向简道云发送） */
export function submitPaymentApplication(data: Record<string, unknown>) {
  return request<Record<string, unknown>>({
    url: '/business/payment-application/submit',
    method: 'post',
    data,
    timeout: 60000,
  });
}

export function getPaymentProcessNodes() {
  return request<ProcessNode[]>({
    url: '/business/payment-application/process-nodes',
    method: 'get',
  });
}

export function getPaymentTimeline(recordKey: string) {
  return request<ProcessTimelineItem[]>({
    url: `/business/payment-application/${encodeURIComponent(recordKey)}/timeline`,
    method: 'get',
  });
}

export function getPaymentComments(recordKey: string) {
  return request<RecordComment[]>({
    url: `/business/payment-application/${encodeURIComponent(recordKey)}/comments`,
    method: 'get',
  });
}

export function addPaymentComment(recordKey: string, content: string, authorName?: string) {
  return request<RecordComment>({
    url: `/business/payment-application/${encodeURIComponent(recordKey)}/comments`,
    method: 'post',
    data: { content, authorName },
  });
}

export function getPaymentDataLogs(recordKey: string) {
  return request<DataLogItem[]>({
    url: `/business/payment-application/${encodeURIComponent(recordKey)}/logs`,
    method: 'get',
  });
}
