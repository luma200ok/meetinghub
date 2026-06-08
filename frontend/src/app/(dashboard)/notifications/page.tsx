"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/notifications", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    if (!res.ok) {
      console.error("알림 조회 실패");
      return;
    }

    const data = await res.json();
    setNotifications(data);
  };

  const markRead = async (notificationId: string) => {
    const res = await fetch(
      `http://127.0.0.1:5000/api/notifications/${notificationId}/read`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      }
    );

    if (res.ok) {
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/notifications/read-all", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    if (res.ok) {
      fetchNotifications();
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      <h1>알림 목록</h1>

      <button onClick={markAllRead} style={{ marginBottom: "16px" }}>
        모두 읽음
      </button>

      {notifications.length === 0 ? (
        <p>알림이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {notifications.map((notification) => (
            <li
              key={notification.id}
              onClick={() => markRead(notification.id)}
              style={{
                padding: "12px",
                marginBottom: "8px",
                border: "1px solid #ddd",
                cursor: "pointer",
                backgroundColor: notification.is_read ? "#f5f5f5" : "#fff8e1",
              }}
            >
              <div>{notification.message}</div>
              <small>{notification.created_at}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}