"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

type Notification = {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("meetinghubAccessToken");
    const companyId = localStorage.getItem("meetinghubCompanyId");

    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
      "X-Company-Id": companyId || "",
    };
  };

  // 알림 목록 조회
  const fetchNotifications = async () => {
    try {
      const headers = getAuthHeaders();

      if (!headers) {
        console.warn("로그인 토큰이 없어 알림을 조회할 수 없습니다.");
        setNotifications([]);
        return;
      }

      const data = await api.get<Notification[]>(ENDPOINTS.NOTIFICATIONS, { headers });
      setNotifications(data);
    } catch (error) {
      console.error("알림 목록 fetch 실패", error);
      setNotifications([]);
    }
  };

  // 특정 알림 읽음 처리
  const markRead = async (notificationId: string) => {
    try {
      const headers = getAuthHeaders();

      if (!headers) {
        console.warn("로그인 토큰이 없어 읽음 처리할 수 없습니다.");
        return;
      }

      await api.patch(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`, {}, { headers });

      // 읽음 처리 후 알림 목록 다시 조회
      await fetchNotifications();
    } catch (error) {
      console.error("알림 읽음 처리 fetch 실패", error);
    }
  };

  // 안 읽은 알림 개수
  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-xl transition-all flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>

        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto p-4 border border-outline-variant rounded-2xl bg-white shadow-xl z-50 flex flex-col">
          <div className="mb-3 font-bold text-sm text-on-surface">
            알림
          </div>

          {notifications.length === 0 ? (
            <div className="text-xs text-on-surface-variant/60 py-4 text-center">
              알림이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markRead(notification.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    notification.is_read
                      ? "bg-slate-50 border-slate-100 text-slate-500/80"
                      : "bg-primary/5 border-primary/10 text-on-surface hover:bg-primary/10"
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 leading-normal">
                    {notification.message}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(notification.created_at).toLocaleString("ko-KR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}