import request from '@/utils/request';

export interface PageResult<T> {
  total: number;
  records: T;
}

export type InquiryStatus = 'NEW' | 'HANDLED';
export type InquiryCategory = 'VEHICLE' | 'PARTS' | 'MATERIAL' | 'OTHER';

export interface WebsiteInquiryItem {
  id: number;
  contactName: string;
  phone: string;
  email?: string;
  company?: string;
  category: InquiryCategory | string;
  content: string;
  status: InquiryStatus | string;
  clientIp?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function listWebsiteInquiries(params: {
  pageNo?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
}) {
  return request<PageResult<WebsiteInquiryItem[]>>({
    url: '/website/inquiry/items',
    method: 'GET',
    params,
  });
}

export function markWebsiteInquiryHandled(id: number, remark?: string) {
  return request<void>({
    url: `/website/inquiry/${id}/handled`,
    method: 'PUT',
    data: { remark },
  });
}
