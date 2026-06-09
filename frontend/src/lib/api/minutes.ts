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
      // 회의록 미존재(404) 또는 한국어 에러 메시지 모두 null로 처리
      if (e instanceof Error && (e.message.includes("404") || e.message.includes("없습니다"))) return null;
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
