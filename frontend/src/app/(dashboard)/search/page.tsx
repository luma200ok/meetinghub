"use client";

import { FormEvent, useState } from "react";
import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

type SearchResult = {
  reservations: { id: string; title: string; status?: string }[];
  minutes: { id: string; content: string; reservation_id?: string }[];
  tasks: { id: string; task: string; status?: string }[];
};

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export default function SearchPage() {
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [companyId] = useState(() => getStored("meetinghubCompanyId"));
  const [q, setQ] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !companyId) return;
    setError("");
    setIsLoading(true);
    try {
      const data = await api.get<SearchResult>(
        `${ENDPOINTS.SEARCH}?q=${encodeURIComponent(q)}`,
        { headers: authHeaders(accessToken, companyId) }
      );
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50 px-6 py-8 text-slate-950">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="border-b border-slate-200 pb-5">
          <p className="text-sm font-medium text-emerald-700">Search</p>
          <h1 className="mt-1 text-3xl font-semibold">통합 검색</h1>
        </div>

        {(!accessToken || !companyId) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            로그인 후 인증 토큰과 회사 ID가 있어야 검색할 수 있습니다.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="회의 제목 / 회의록 / 업무 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:bg-slate-400" disabled={isLoading}>
            {isLoading ? "검색 중" : "검색"}
          </button>
        </form>

        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {result && (
          <div className="flex flex-col gap-5">
            <Group title="회의" count={result.reservations.length}>
              {result.reservations.map((r) => (
                <Item key={r.id} title={r.title} sub={r.status} />
              ))}
            </Group>
            <Group title="회의록" count={result.minutes.length}>
              {result.minutes.map((m) => (
                <Item key={m.id} title={m.content.slice(0, 80)} />
              ))}
            </Group>
            <Group title="업무" count={result.tasks.length}>
              {result.tasks.map((t) => (
                <Item key={t.id} title={t.task} sub={t.status} />
              ))}
            </Group>
          </div>
        )}
      </section>
    </main>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold">
        {title} <span className="text-sm font-normal text-slate-500">({count})</span>
      </h2>
      {count === 0 ? <p className="text-sm text-slate-400">결과 없음</p> : <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}

function Item({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
      <span className="truncate">{title}</span>
      {sub && <span className="ml-2 shrink-0 text-xs text-slate-500">{sub}</span>}
    </div>
  );
}
