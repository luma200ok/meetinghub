"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
        <span className="text-on-surface-variant font-medium">대시보드로 이동 중...</span>
      </div>
    </div>
  );
}

