"use client";

import { useCallback, useEffect, useState } from "react";
import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

type Task = {
  id: string;
  task: string;
  status: TaskStatus;
  due_date?: string | null;
  assignee?: { email?: string; name?: string | null } | null;
};

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "TODO", label: "할 일" },
  { key: "IN_PROGRESS", label: "진행 중" },
  { key: "DONE", label: "완료" },
  { key: "BLOCKED", label: "차단됨" },
];

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export default function TasksPage() {
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [companyId] = useState(() => getStored("meetinghubCompanyId"));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !companyId) return;
    setError("");
    setIsLoading(true);
    try {
      const data = await api.get<Task[]>(ENDPOINTS.TASKS, { headers: authHeaders(accessToken, companyId) });
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "업무를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    const text = newTask.trim();
    if (!text || isCreating) return;
    setError("");
    setIsCreating(true);
    try {
      await api.post(
        ENDPOINTS.TASKS,
        { task: text, due_date: newDueDate || undefined },
        { headers: authHeaders(accessToken, companyId) },
      );
      setNewTask("");
      setNewDueDate("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "업무 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  }

  async function changeStatus(taskId: string, status: TaskStatus) {
    try {
      await api.patch(`${ENDPOINTS.TASKS}/${taskId}/status`, { status }, { headers: authHeaders(accessToken, companyId) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "상태 변경에 실패했습니다.");
    }
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50 px-6 py-8 text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">Tasks</p>
            <h1 className="mt-1 text-3xl font-semibold">업무 관리</h1>
          </div>
          <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium" onClick={() => void load()} disabled={isLoading}>
            {isLoading ? "불러오는 중" : "새로고침"}
          </button>
        </div>

        {(!accessToken || !companyId) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            로그인 후 인증 토큰과 회사 ID가 있어야 업무를 볼 수 있습니다.
          </div>
        )}
        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {accessToken && companyId && (
          <form onSubmit={createTask} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="새 업무 내용을 입력하세요"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              maxLength={500}
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              aria-label="마감일"
            />
            <button
              type="submit"
              disabled={isCreating || !newTask.trim()}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-300"
            >
              {isCreating ? "추가 중" : "업무 추가"}
            </button>
          </form>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{items.length}</span>
                </div>
                {items.length === 0 && <p className="text-xs text-slate-400">없음</p>}
                {items.map((t) => (
                  <div key={t.id} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm">{t.task}</p>
                    {t.due_date && <p className="text-xs text-slate-500">마감 {t.due_date}</p>}
                    {t.assignee?.email && <p className="text-xs text-slate-500">{t.assignee.name ?? t.assignee.email}</p>}
                    <select
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                      value={t.status}
                      onChange={(e) => void changeStatus(t.id, e.target.value as TaskStatus)}
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
