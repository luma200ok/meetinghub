"use client";

import { useEffect, useState } from "react";

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

            const response = await fetch("http://127.0.0.1:5000/api/notifications/", {
                method: "GET",
                headers,
            });

            if (!response.ok) {
                console.error("알림 목록 조회 실패", response.status);
                setNotifications([]);
                return;
            }

            const data = await response.json();
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

            const response = await fetch(
                `http://127.0.0.1:5000/api/notifications/${notificationId}/read`,
                {
                    method: "PATCH",
                    headers,
                }
            );

            if (!response.ok) {
                console.error("알림 읽음 처리 실패", response.status);
                return;
            }

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
        <div style={{ position: "relative" }}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                style={{
                    position: "relative",
                    padding: "8px 10px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    fontSize: "18px",
                }}
            >
                🔔

                {unreadCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            minWidth: "18px",
                            height: "18px",
                            padding: "0 5px",
                            borderRadius: "999px",
                            backgroundColor: "red",
                            color: "white",
                            fontSize: "12px",
                            lineHeight: "18px",
                            textAlign: "center",
                        }}
                    >
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "44px",
                        right: 0,
                        width: "320px",
                        maxHeight: "400px",
                        overflowY: "auto",
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                        backgroundColor: "#fff",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            marginBottom: "12px",
                            fontWeight: 700,
                            fontSize: "16px",
                        }}
                    >
                        알림
                    </div>

                    {notifications.length === 0 ? (
                        <div style={{ color: "#777", fontSize: "14px" }}>
                            알림이 없습니다.
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => markRead(notification.id)}
                                style={{
                                    padding: "10px",
                                    marginBottom: "8px",
                                    borderRadius: "8px",
                                    border: "1px solid #eee",
                                    backgroundColor: notification.is_read ? "#f5f5f5" : "#fff8e1",
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: notification.is_read ? 400 : 700,
                                        marginBottom: "4px",
                                    }}
                                >
                                    {notification.message}
                                </div>

                                <div style={{ fontSize: "12px", color: "#777" }}>
                                    {new Date(notification.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}