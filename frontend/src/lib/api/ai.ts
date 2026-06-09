/**
 * ai.ts
 * AI 분석 및 Action Items 자동 생성 API 클라이언트
 */
import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiAiSummary, ApiActionItem } from "@/types";

export const aiApi = {
  /** 회의록 AI 분석 실행 (요약 / 핵심 / 결정 / 위험) */
  analyze: (minuteId: string, token: string, companyId: string) =>
    api.post<ApiAiSummary>(
      ENDPOINTS.AI_ANALYZE,
      { minute_id: minuteId },
      { headers: authHeaders(token, companyId) },
    ),

  /** 회의록 기반 Action Item 자동 생성 */
  generateActionItems: (minuteId: string, token: string, companyId: string) =>
    api.post<ApiActionItem[]>(
      ENDPOINTS.AI_ACTION_ITEMS,
      { minute_id: minuteId },
      { headers: authHeaders(token, companyId) },
    ),

  /** 기존에 생성된 AI 분석 결과 조회 */
  getSummary: async (minuteId: string, token: string, companyId: string) => {
    try {
      return await api.get<ApiAiSummary | null>(
        `${ENDPOINTS.AI_SUMMARIES}/${minuteId}`,
        { headers: authHeaders(token, companyId) },
      );
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("404")) return null;
      throw e;
    }
  },
};
