"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { api, authHeaders } from "@/lib/api/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("로그인 처리 중입니다...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();
        
        // Supabase JS가 URL의 hash/PKCE를 자동으로 처리해 세션을 맺어줍니다.
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (!session?.access_token) throw new Error("세션 정보를 찾을 수 없습니다.");

        // 1. 토큰을 localStorage에 저장 (기존 로그인 방식 호환)
        localStorage.setItem("meetinghubAccessToken", session.access_token);
        setStatus("사용자 프로필을 동기화 중입니다...");

        // 2. 백엔드에 사용자 정보 동기화 요청 (DB의 users 테이블 업데이트)
        await api.post(
          '/api/auth/oauth-sync',
          {}, // body
          { headers: authHeaders(session.access_token) }
        );
        
        setStatus("로그인 성공! 이동 중...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
        
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("로그인 처리에 실패했습니다. 잠시 후 다시 로그인해주세요.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-surface-bright flex-col">
      <div className="mb-8">
        <span className="material-symbols-outlined text-primary text-6xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
      </div>
      <h2 className="text-xl font-bold text-on-surface mb-2">인증 확인 중</h2>
      <p className="text-on-surface-variant text-sm">{status}</p>
    </div>
  );
}
