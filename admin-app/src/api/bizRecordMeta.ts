import request from '@/utils/request';

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

export function getBizProcessNodes(bizKey: string) {
  return request<ProcessNode[]>({
    url: `/business/process/${encodeURIComponent(bizKey)}/nodes`,
    method: 'get',
  });
}

export function getBizTimeline(bizKey: string, recordKey: string) {
  return request<ProcessTimelineItem[]>({
    url: `/business/record/${encodeURIComponent(bizKey)}/${encodeURIComponent(recordKey)}/timeline`,
    method: 'get',
  });
}

export function getBizComments(bizKey: string, recordKey: string) {
  return request<RecordComment[]>({
    url: `/business/record/${encodeURIComponent(bizKey)}/${encodeURIComponent(recordKey)}/comments`,
    method: 'get',
  });
}

export function addBizComment(bizKey: string, recordKey: string, content: string, authorName?: string) {
  return request<RecordComment>({
    url: `/business/record/${encodeURIComponent(bizKey)}/${encodeURIComponent(recordKey)}/comments`,
    method: 'post',
    data: { content, authorName },
  });
}

export function getBizDataLogs(bizKey: string, recordKey: string) {
  return request<DataLogItem[]>({
    url: `/business/record/${encodeURIComponent(bizKey)}/${encodeURIComponent(recordKey)}/logs`,
    method: 'get',
  });
}

export function appendBizDataLog(
  bizKey: string,
  recordKey: string,
  payload: { action?: string; summary?: string; operatorName?: string },
) {
  return request<void>({
    url: `/business/record/${encodeURIComponent(bizKey)}/${encodeURIComponent(recordKey)}/logs`,
    method: 'post',
    data: payload,
  });
}
