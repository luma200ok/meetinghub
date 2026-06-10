"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { minutesApi } from "@/lib/api/minutes";
import { createClient } from "@/lib/supabase/client";
import type { ApiReservation, Minute } from "@/types";
import MinuteEditor from "@/components/minutes/MinuteEditor";
import MinuteViewer from "@/components/minutes/MinuteViewer";

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

const STATUS_LABEL: Record<string, string> = {
  RESERVED: "예약됨",
  IN_PROGRESS: "진행 중",
  DONE: "완료",
  CANCELLED: "취소됨",
};

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [companyId] = useState(() => getStored("meetinghubCompanyId"));

  const [reservation, setReservation] = useState<ApiReservation | null>(null);
  const [minute, setMinute] = useState<Minute | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken || !companyId) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const headers = authHeaders(accessToken, companyId);
    Promise.all([
      api.get<ApiReservation>(`${ENDPOINTS.RESERVATIONS}/${id}`, { headers }),
      minutesApi.getByReservation(id, accessToken, companyId),
      supabase.auth.getUser(),
    ])
      .then(([res, min, { data }]) => {
        setReservation(res);
        setMinute(min);
        setCurrentUserId(data.user?.id ?? "");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, accessToken, companyId]);

  // 현재 사용자가 주최자 또는 참석자인지 확인
  const isParticipant =
    !!currentUserId &&
    !!reservation &&
    (reservation.organizer_id === currentUserId ||
      (reservation.attendees ?? []).some((a) => a.user_id === currentUserId));

  async function handleAnalyze() {
    if (!minute) return;
    setAiLoading(true);
    try {
      const res = await api.post<{ result?: string }>(
        ENDPOINTS.AI_ANALYZE,
        { minute_id: minute.id },
        { headers: authHeaders(accessToken, companyId) },
      );
      setAiResult(res.result ?? JSON.stringify(res));
    } catch (e: unknown) {
      setAiResult(e instanceof Error ? e.message : "분석 오류");
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-slate-400">불러오는 중...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!reservation) return null;

  const attendees = reservation.attendees ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-2">

      {/* 회의 정보 카드 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">회의 상세</p>
        <h1 className="text-2xl font-bold text-slate-900">{reservation.title}</h1>

        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">시작</dt>
            <dd className="mt-0.5 text-slate-700">{new Date(reservation.start_at).toLocaleString("ko-KR")}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">종료</dt>
            <dd className="mt-0.5 text-slate-700">{new Date(reservation.end_at).toLocaleString("ko-KR")}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">상태</dt>
            <dd className="mt-0.5">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                reservation.status === "IN_PROGRESS"
                  ? "bg-emerald-100 text-emerald-700"
                  : reservation.status === "CANCELLED"
                  ? "bg-red-100 text-red-600"
                  : reservation.status === "DONE"
                  ? "bg-slate-100 text-slate-500"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {STATUS_LABEL[reservation.status] ?? reservation.status}
              </span>
            </dd>
          </div>
        </dl>

        {/* 참석자 목록 */}
        {attendees.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">참석자</p>
            <div className="flex flex-wrap gap-2">
              {attendees.map((a) => (
                <span
                  key={a.user_id}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                    a.user_id === currentUserId
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">person</span>
                  {a.users?.name ?? a.user_id.slice(0, 8)}
                  {a.user_id === currentUserId && (
                    <span className="text-[10px] font-bold opacity-60">(나)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 회의록 섹션 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">description</span>
          <h2 className="text-lg font-bold text-slate-800">회의록</h2>
        </div>

        {minute ? (
          <MinuteViewer
            minute={minute}
            currentUserId={currentUserId}
            token={accessToken}
            companyId={companyId}
            onUpdated={setMinute}
            onDeleted={() => setMinute(null)}
          />
        ) : isParticipant ? (
          <MinuteEditor
            reservationId={id}
            token={accessToken}
            companyId={companyId}
            onSaved={setMinute}
          />
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <span className="material-symbols-outlined text-amber-500 text-lg">lock</span>
            회의 참석자 및 주최자만 회의록을 작성할 수 있습니다.
          </div>
        )}
      </div>

      {/* AI 분석 섹션 */}
      {minute && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-600">auto_awesome</span>
              <h2 className="text-lg font-bold text-slate-800">AI 분석</h2>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">psychology</span>
              {aiLoading ? "분석 중..." : "AI 분석 요청"}
            </button>
          </div>
          {aiResult ? (
            <div className="rounded-xl bg-white border border-violet-200 p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {aiResult}
            </div>
          ) : (
            <p className="text-xs text-slate-400">회의록 저장 후 AI 분석을 요청할 수 있습니다.</p>
          )}
        </div>
      )}

    </div>
  );
}
