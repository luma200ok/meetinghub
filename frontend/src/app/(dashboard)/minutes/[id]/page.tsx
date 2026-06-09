"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { minutesApi } from "@/lib/api/minutes";
import { createClient } from "@/lib/supabase/client";
import type { Minute } from "@/types";
import MinuteViewer from "@/components/minutes/MinuteViewer";

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export default function MinuteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [companyId] = useState(() => getStored("meetinghubCompanyId"));
  const [minute, setMinute] = useState<Minute | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken || !companyId) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    Promise.all([
      minutesApi.get(id, accessToken, companyId),
      supabase.auth.getUser(),
    ])
      .then(([m, { data }]) => {
        setMinute(m);
        setCurrentUserId(data.user?.id ?? "");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, accessToken, companyId]);

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
  if (!minute) return null;

  return (
    <main className="min-h-screen flex-1 bg-slate-50 px-6 py-8 text-slate-950">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="border-b border-slate-200 pb-5">
          <p className="text-sm font-medium text-emerald-700">Minutes</p>
          <h1 className="mt-1 text-3xl font-semibold">
            {minute.reservation?.title ?? `회의 #${minute.reservation_id.slice(0, 8)}`}
          </h1>
          {minute.reservation?.start_at && (
            <p className="mt-1 text-sm text-slate-500">
              {new Date(minute.reservation.start_at).toLocaleString("ko-KR")}
            </p>
          )}
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold">회의록</h2>
          <MinuteViewer
            minute={minute}
            currentUserId={currentUserId}
            token={accessToken}
            companyId={companyId}
            onUpdated={setMinute}
            onDeleted={() => window.history.back()}
          />
        </section>
      </section>
    </main>
  );
}
