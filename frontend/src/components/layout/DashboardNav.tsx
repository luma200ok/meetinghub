"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };

// 대시보드 영역 기능 페이지 (세로 사이드바 순서)
const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: "dashboard" },
  { href: "/meeting-rooms", label: "회의실", icon: "meeting_room" },
  { href: "/minutes", label: "회의록", icon: "description" },
  { href: "/tasks", label: "업무", icon: "task_alt" },
  { href: "/search", label: "검색", icon: "search" },
  { href: "/organization", label: "조직도", icon: "groups" },
  { href: "/notifications", label: "알림", icon: "notifications" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-200",
              active
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-high",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
