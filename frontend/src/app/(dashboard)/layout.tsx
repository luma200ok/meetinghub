import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import DashboardNav from "@/components/layout/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      {/* 세로 사이드바: 로고 → 네비 → (하단) 알림벨 */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-6 border-r border-outline-variant bg-surface px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-2 px-1">
          <span
            className="material-symbols-outlined text-2xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            meeting_room
          </span>
          <span className="text-lg font-black tracking-tight text-primary">
            MeetingHub
          </span>
        </Link>

        <DashboardNav />

        <div className="mt-auto border-t border-outline-variant pt-4">
          <NotificationBell />
        </div>
      </aside>

      {/* 콘텐츠: 각 페이지가 자체 <main> 을 렌더(중첩 <main> 방지, #6) */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
