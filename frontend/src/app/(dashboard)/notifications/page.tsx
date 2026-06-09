"use client";

import { useCallback, useEffect, useState } from "react";
import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

type Notification = {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export default function NotificationsPage() {
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError("");
    setIsLoading(true);
    try {
      const data = await api.get<Notification[]>(ENDPOINTS.NOTIFICATIONS, {
        headers: authHeaders(accessToken),
      });
      setNotifications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    try {
      await api.patch(`${ENDPOINTS.NOTIFICATIONS}/${id}/read`, {}, { headers: authHeaders(accessToken) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "읽음 처리에 실패했습니다.");
    }
  }

  async function markAllRead() {
    try {
      await api.patch(`${ENDPOINTS.NOTIFICATIONS}/read-all`, {}, { headers: authHeaders(accessToken) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "모두 읽음 처리에 실패했습니다.");
    }
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50 px-6 py-8 text-slate-950">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">Notifications</p>
            <h1 className="mt-1 text-3xl font-semibold">알림 목록</h1>
          </div>
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            onClick={() => void markAllRead()}
            disabled={isLoading || notifications.length === 0}
          >
            모두 읽음
          </button>
        </div>

        {!accessToken && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            로그인 후 인증 토큰이 있어야 알림을 볼 수 있습니다.
          </div>
        )}
        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {notifications.length === 0 && !isLoading && !error && accessToken && (
          <p className="text-sm text-slate-400">알림이 없습니다.</p>
        )}

        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => void markRead(n.id)}
              className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                n.is_read ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50"
              }`}
            >
              <p className="text-sm text-slate-800">{n.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(n.created_at).toLocaleString("ko-KR")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
