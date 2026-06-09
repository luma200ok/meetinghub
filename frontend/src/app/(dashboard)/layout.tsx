import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import DashboardNav from "@/components/layout/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-outline-variant bg-surface/95 px-4 py-2.5 backdrop-blur md:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span
            className="material-symbols-outlined text-2xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            meeting_room
          </span>
          <span className="hidden text-lg font-black tracking-tight text-primary sm:inline">
            MeetingHub
          </span>
        </Link>

        <DashboardNav />

        <div className="shrink-0">
          <NotificationBell />
        </div>
      </header>

      {/* 각 페이지가 자체 <main> 을 렌더하므로 레이아웃은 래퍼 div 만 둔다 (중첩 <main> 방지, #6) */}
      <div>{children}</div>
    </div>
  );
}
