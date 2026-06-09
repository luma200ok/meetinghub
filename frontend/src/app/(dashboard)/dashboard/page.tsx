"use client";

import { useEffect, useState } from "react";
import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

type Meeting = { id: string; title: string; start_at?: string; status?: string };
type Task = { id: string; task: string; status: string; due_date?: string | null };

type Summary = {
  today_meetings: Meeting[];
  my_tasks: Task[];
  recent_meetings: Meeting[];
  meeting_stats: { total: number; this_week: number };
  task_stats: { todo: number; in_progress: number; done: number; blocked: number };
};

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export default function DashboardPage() {
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [companyId] = useState(() => getStored("meetinghubCompanyId"));
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!accessToken || !companyId) return;
    api
      .get<Summary>(ENDPOINTS.DASHBOARD, { headers: authHeaders(accessToken, companyId) })
      .then((d) => mounted && setData(d))
      .catch((e) => mounted && setError(e instanceof Error ? e.message : "대시보드를 불러오지 못했습니다."));
    return () => {
      mounted = false;
    };
  }, [accessToken, companyId]);

  return (
    <div className="flex flex-col gap-6 text-on-surface">
      <div className="border-b border-outline-variant pb-5">
        <p className="text-sm font-semibold text-primary">Dashboard</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-on-background">대시보드</h1>
      </div>

        {(!accessToken || !companyId) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            로그인 후 인증 토큰과 회사 ID가 있어야 대시보드를 볼 수 있습니다.
          </div>
        )}
        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {data && (
          <>
            {/* 통계 카드 */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="전체 회의" value={data.meeting_stats.total} />
              <StatCard label="이번 주 회의" value={data.meeting_stats.this_week} />
              <StatCard label="할 일" value={data.task_stats.todo} />
              <StatCard label="진행 중" value={data.task_stats.in_progress} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="오늘 회의">
                {data.today_meetings.length === 0 ? (
                  <Empty>오늘 예정된 회의가 없습니다.</Empty>
                ) : (
                  data.today_meetings.map((m) => <Row key={m.id} title={m.title} sub={m.status} />)
                )}
              </Panel>

              <Panel title="내 업무">
                {data.my_tasks.length === 0 ? (
                  <Empty>담당 업무가 없습니다.</Empty>
                ) : (
                  data.my_tasks.map((t) => <Row key={t.id} title={t.task} sub={t.status} />)
                )}
              </Panel>

              <Panel title="최근 회의">
                {data.recent_meetings.length === 0 ? (
                  <Empty>회의 기록이 없습니다.</Empty>
                ) : (
                  data.recent_meetings.map((m) => <Row key={m.id} title={m.title} sub={m.status} />)
                )}
              </Panel>
            </div>
          </>
        )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
      <span className="truncate">{title}</span>
      {sub && <span className="ml-2 shrink-0 text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}
