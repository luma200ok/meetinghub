/**
 * actionItems.ts
 * Action Items CRUD API 클라이언트
 */
import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiActionItem } from "@/types";

export const actionItemsApi = {
  /** 특정 회의록의 Action Items 목록 조회 */
  listByMinute: (minuteId: string, token: string, companyId: string) =>
    api.get<ApiActionItem[]>(
      `${ENDPOINTS.ACTION_ITEMS}?minute_id=${minuteId}`,
      { headers: authHeaders(token, companyId) },
    ),

  /** 회사 전체 Action Items 목록 */
  listByCompany: (token: string, companyId: string) =>
    api.get<ApiActionItem[]>(ENDPOINTS.ACTION_ITEMS, {
      headers: authHeaders(token, companyId),
    }),

  /** Action Item 수동 생성 */
  create: (
    body: {
      minute_id: string;
      task: string;
      assignee_id?: string;
      due_date?: string;
      status?: string;
    },
    token: string,
    companyId: string,
  ) =>
    api.post<ApiActionItem>(ENDPOINTS.ACTION_ITEMS, body, {
      headers: authHeaders(token, companyId),
    }),

  /** 상태 / 내용 / 담당자 / 기한 업데이트 */
  update: (
    id: string,
    body: { task?: string; status?: string; assignee_id?: string; due_date?: string },
    token: string,
    companyId: string,
  ) =>
    api.put<ApiActionItem>(`${ENDPOINTS.ACTION_ITEMS}/${id}`, body, {
      headers: authHeaders(token, companyId),
    }),

  /** 상태 토글 헬퍼 (체크박스 단순 토글용) */
  toggleStatus: (
    id: string,
    currentStatus: string,
    token: string,
    companyId: string,
  ) => {
    const nextStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    return api.put<ApiActionItem>(
      `${ENDPOINTS.ACTION_ITEMS}/${id}`,
      { status: nextStatus },
      { headers: authHeaders(token, companyId) },
    );
  },

  /** Action Item 삭제 */
  delete: (id: string, token: string, companyId: string) =>
    api.delete<void>(`${ENDPOINTS.ACTION_ITEMS}/${id}`, {
      headers: authHeaders(token, companyId),
    }),
};
