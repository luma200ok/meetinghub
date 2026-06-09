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
      <main className="min-h-screen flex-1 bg-slate-50 px-6 py-8">
        <p className="text-sm text-slate-500">불러오는 중...</p>
      </main>
    );
  }
  if (error) {
    return (
      <main className="min-h-screen flex-1 bg-slate-50 px-6 py-8">
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </main>
    );
  }
  if (!reservation) return null;

  return (
    <main className="min-h-screen flex-1 bg-slate-50 px-6 py-8 text-slate-950">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        {/* 회의 정보 */}
        <div className="border-b border-slate-200 pb-5">
          <p className="text-sm font-medium text-emerald-700">Reservation</p>
          <h1 className="mt-1 text-3xl font-semibold">{reservation.title}</h1>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-700">
            <dt className="font-medium text-slate-500">시작</dt>
            <dd>{new Date(reservation.start_at).toLocaleString("ko-KR")}</dd>
            <dt className="font-medium text-slate-500">종료</dt>
            <dd>{new Date(reservation.end_at).toLocaleString("ko-KR")}</dd>
            <dt className="font-medium text-slate-500">상태</dt>
            <dd>{reservation.status}</dd>
          </dl>
        </div>

        {/* 회의록 */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">회의록</h2>
          {minute ? (
            <MinuteViewer
              minute={minute}
              currentUserId={currentUserId}
              token={accessToken}
              companyId={companyId}
              onUpdated={setMinute}
              onDeleted={() => setMinute(null)}
            />
          ) : (
            <MinuteEditor
              reservationId={id}
              token={accessToken}
              companyId={companyId}
              onSaved={setMinute}
            />
          )}
        </section>

        {/* AI 분석 (이은석 파트 연결점) */}
        {minute && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">AI 분석</h2>
              <button
                onClick={handleAnalyze}
                disabled={aiLoading}
                className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {aiLoading ? "분석 중..." : "AI 분석 요청"}
              </button>
            </div>
            {aiResult && (
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-sm whitespace-pre-wrap">
                {aiResult}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
