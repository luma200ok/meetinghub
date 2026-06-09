"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "대시보드", href: "/dashboard", icon: "dashboard" },
  { label: "회의실 예약", href: "/meeting-rooms", icon: "forum" },
  { label: "AI 회의록", href: "/minutes", icon: "description" },
  { label: "워크플로우", href: "/tasks", icon: "assignment" },
  { label: "기업·조직 관리", href: "/organization", icon: "corporate_fare" },
  { label: "통계", href: "#", icon: "monitoring" },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "설정", href: "#", icon: "settings" },
  { label: "도움말", href: "#", icon: "help_center" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-surface flex flex-col py-8 px-6 z-50">
      <div className="mb-10 px-2 flex items-center space-x-2">
        <span
          className="material-symbols-outlined text-primary text-[32px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          hub
        </span>
        <span className="font-headline-md text-headline-md font-black text-primary tracking-tight">
          MeetingHub
        </span>
      </div>

      <div className="space-y-1.5 flex-grow">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "#" && item.href !== "/" && pathname.startsWith(item.href + "/")) ||
            (item.href === "/meeting-rooms" && pathname.startsWith("/reservations"));

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (item.href === "#") {
                  e.preventDefault();
                }
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? "bg-primary-container text-on-primary-container font-semibold shadow-sm transition-transform active:scale-95"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span
                className={`material-symbols-outlined ${
                  isActive ? "" : "text-outline group-hover:text-primary"
                }`}
              >
                {item.icon}
              </span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="pt-6 border-t border-outline-variant space-y-1.5">
        {BOTTOM_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={(e) => {
              if (item.href === "#") {
                e.preventDefault();
              }
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
