"use client";

import NotificationBell from "@/components/notifications/NotificationBell";

export default function Header() {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-10 z-40">
      <div className="flex items-center gap-8 flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 transition-all"
            placeholder="회의록, 리포트, 팀원 검색..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer">
            AI 채팅
          </button>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center rounded-xl hover:bg-surface-container">
              <span className="material-symbols-outlined text-[24px]">history</span>
            </button>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-outline-variant"></div>

        <button className="flex items-center gap-3 group text-left cursor-pointer">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant transition-transform group-hover:scale-105">
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTyxNbtW0m31PPxE-WLF7CI5U7rFj_3Rj794hxS3OUQt-P5byj9uddh1D5tHcZKXYBMlBz2kn8lZj-9ZhfzqQQWltPRqoa2PJ5y-t_SRJQFk5CEuORbkegATF3tw5_zOuxsDEzSu12gczdtSnV4V1ik3w5GlmIFVNpW_1K10CBAtHHxwjfk3EFToXijUJj7Dt_U5pzRfqjT-LnrReyIIj8PiXbksmbHvqlphppI5d0N80mVJDkNdm6_jKj5Yx62pOxwjRz77XqhBdZ"
            />
          </div>
          <div className="text-left hidden lg:block">
            <span className="text-sm font-semibold text-on-surface block leading-none">
              마커스 첸
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tight">
              팀 리더
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
