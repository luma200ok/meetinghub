"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { minutesApi } from "@/lib/api/minutes";
import type { Minute } from "@/types";

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export default function MinutesListPage() {
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [companyId] = useState(() => getStored("meetinghubCompanyId"));
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !companyId) return;
    setError("");
    setIsLoading(true);
    try {
      const data = await minutesApi.list(accessToken, companyId);
      setMinutes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "회의록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6 text-on-surface">
      <div className="flex items-end justify-between border-b border-outline-variant pb-5">
        <div>
          <p className="text-sm font-semibold text-primary">Minutes</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-on-background">회의록 목록</h1>
        </div>
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            onClick={() => void load()}
            disabled={isLoading}
          >
            {isLoading ? "불러오는 중" : "새로고침"}
          </button>
        </div>

        {(!accessToken || !companyId) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            로그인 후 인증 토큰과 회사 ID가 있어야 회의록을 볼 수 있습니다.
          </div>
        )}
        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {minutes.length === 0 && !isLoading && !error && accessToken && companyId && (
          <p className="text-sm text-slate-400">작성된 회의록이 없습니다.</p>
        )}

        <ul className="flex flex-col gap-3">
          {minutes.map((m) => (
            <li key={m.id}>
              <Link
                href={`/minutes/${m.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <p className="font-semibold text-slate-800">
                  {m.reservation?.title ?? `회의 #${m.reservation_id.slice(0, 8)}`}
                </p>
                {m.reservation?.start_at && (
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(m.reservation.start_at).toLocaleString("ko-KR")}
                  </p>
                )}
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{m.content}</p>
                <p className="text-xs text-slate-400 mt-1">
                  작성자: {m.author_name ?? m.created_by}
                </p>
              </Link>
            </li>
          ))}
        </ul>
    </div>
  );
}
