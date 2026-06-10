import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { Minute } from "@/types";

export const minutesApi = {
  list: (token: string, companyId: string) =>
    api.get<Minute[]>(ENDPOINTS.MINUTES, { headers: authHeaders(token, companyId) }),

  get: (id: string, token: string, companyId: string) =>
    api.get<Minute>(`${ENDPOINTS.MINUTES}/${id}`, { headers: authHeaders(token, companyId) }),

  getByReservation: async (
    reservationId: string,
    token: string,
    companyId: string,
  ): Promise<Minute | null> => {
    try {
      return await api.get<Minute>(
        `${ENDPOINTS.MINUTES}/by-reservation/${reservationId}`,
        { headers: authHeaders(token, companyId) },
      );
    } catch (e: unknown) {
      // 회의록 미존재(404)만 null 로 처리. 401/403(인증·권한 실패)은 그대로 던져
      // '회의록 없음'으로 조용히 묻히지 않게 한다. (메시지 문자열 "없습니다" 매칭은
      // 401 "인증된 사용자를 확인할 수 없습니다." 까지 삼켜 버그였음)
      if ((e as { status?: number })?.status === 404) return null;
      throw e;
    }
  },

  create: (reservationId: string, content: string, token: string, companyId: string) =>
    api.post<Minute>(
      ENDPOINTS.MINUTES,
      { reservation_id: reservationId, content },
      { headers: authHeaders(token, companyId) },
    ),

  update: (id: string, content: string, token: string, companyId: string) =>
    api.put<Minute>(
      `${ENDPOINTS.MINUTES}/${id}`,
      { content },
      { headers: authHeaders(token, companyId) },
    ),

  delete: (id: string, token: string, companyId: string) =>
    api.delete<void>(`${ENDPOINTS.MINUTES}/${id}`, { headers: authHeaders(token, companyId) }),
};
