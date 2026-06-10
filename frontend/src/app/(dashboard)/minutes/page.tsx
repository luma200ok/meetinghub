"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { minutesApi } from "@/lib/api/minutes";
import type { Minute } from "@/types";

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export default function MinutesListPage() {
  const router = useRouter();
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [companyId] = useState(() => getStored("meetinghubCompanyId"));
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredMinutes = minutes.filter(
    (m) =>
      m.reservation?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen flex flex-col mt-4 overflow-y-auto px-8 pt-8 pb-12 bg-background">
      <div className="flex justify-between items-end mb-8">
        <div>
          <nav className="flex gap-2 text-on-surface-variant font-label-sm text-label-sm mb-2">
            <span>MeetingHub</span>
            <span className="opacity-40">/</span>
            <span className="text-primary font-bold">회의록</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">AI 회의록 목록</h2>
          <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
            모든 회의 내용을 한눈에 확인하고 AI 분석을 통해 인사이트를 얻어보세요.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void load()}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-surface-container-high text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-highest transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span> 
            {isLoading ? "불러오는 중..." : "새로고침"}
          </button>
          <button 
            onClick={() => router.push('/reservations')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-on-primary font-label-md text-label-md shadow-md shadow-primary/20 hover:opacity-90 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> 새 분석 시작
          </button>
        </div>
      </div>

      {(!accessToken || !companyId) && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          로그인 후 인증 토큰과 회사 ID가 있어야 회의록을 볼 수 있습니다.
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-2xl bg-error-container px-5 py-4 text-sm text-on-error-container shadow-sm border border-error-container/50">
          {error}
        </div>
      )}

      <div className="mb-6 relative max-w-md">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70">search</span>
        <input
          type="text"
          placeholder="회의록 제목 또는 내용 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 transition-all shadow-sm"
        />
      </div>

      {filteredMinutes.length === 0 && !isLoading && !error && accessToken && companyId && (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-outline-variant/50 bg-surface-container-lowest/50">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">folder_open</span>
          <p className="text-on-surface-variant font-medium">검색된 회의록이 없습니다.</p>
          <button 
            onClick={() => router.push('/reservations')}
            className="mt-4 px-6 py-2 rounded-xl bg-primary-container text-on-primary-container font-medium hover:bg-primary-container/80 transition-colors"
          >
            예약 목록으로 이동
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMinutes.map((m) => (
          <Link
            key={m.id}
            href={`/minutes/${m.id}`}
            className="group flex flex-col justify-between rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="px-3 py-1 bg-secondary-container/30 text-secondary text-xs font-bold rounded-lg border border-secondary-container/50">
                  AI 회의록
                </div>
                <span className="text-xs text-on-surface-variant/60 font-medium">
                  {m.reservation?.start_at 
                    ? new Date(m.reservation.start_at).toLocaleDateString("ko-KR", { month: 'long', day: 'numeric' })
                    : "날짜 미정"}
                </span>
              </div>
              
              <h3 className="font-headline-md text-lg text-on-surface font-bold line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                {m.reservation?.title ?? `회의 #${m.reservation_id.slice(0, 8)}`}
              </h3>
              
              <p className="text-sm text-on-surface-variant/80 line-clamp-3 mb-6 leading-relaxed min-h-[60px]">
                {m.content}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20 relative z-10 mt-auto">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold">
                  {(m.author_name ?? m.created_by).slice(0, 1).toUpperCase()}
                </div>
                <span className="text-xs text-on-surface-variant font-medium">
                  {m.author_name ?? m.created_by.slice(0, 8)}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
