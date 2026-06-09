"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

type SignupResponse = {
  session?: { access_token?: string | null } | null;
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const signup = await api.post<SignupResponse>(ENDPOINTS.AUTH_SIGNUP, {
        email,
        password,
      });
      const token = signup.session?.access_token;

      if (!token) {
        // Supabase 설정상 이메일 확인이 켜져 있는 경우, verify 페이지로 안내
        router.push(`/signup/verify?email=${encodeURIComponent(email)}`);
        return;
      }

      localStorage.setItem("meetinghubAccessToken", token);
      setMessage("회원가입에 성공했습니다! 온보딩 페이지로 이동합니다.");

      setTimeout(() => {
        router.push("/onboarding");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center p-margin-mobile md:p-margin-desktop w-full relative">
      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary-container blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-tertiary-fixed blur-[120px] opacity-30"></div>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-[480px] flex flex-col items-center text-center space-y-stack-lg mb-stack-lg flex-1 pt-16">
        {/* Logo Section */}
        <div className="mb-stack-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-4xl icon-fill" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
          <span className="font-black text-3xl text-primary tracking-tight">MeetingHub</span>
        </div>

        {/* Headline & Subtext */}
        <div className="space-y-stack-sm">
          <h1 className="text-4xl text-on-surface tracking-tight font-extrabold">MeetingHub 시작하기</h1>
          <p className="text-lg text-on-surface-variant max-w-[400px] mx-auto leading-relaxed">
            개인 사용자를 위한 최적의 협업 도구로 생산성을 높여보세요.
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="w-full glass-card p-stack-lg rounded-xl shadow-sm flex flex-col space-y-stack-md border border-white/30 backdrop-blur-md">
          {/* Social Login Buttons */}
          <div className="flex flex-col space-y-3">
            <button type="button" className="flex items-center justify-center gap-3 w-full py-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span>Google로 계속하기</span>
            </button>
            <button type="button" className="flex items-center justify-center gap-3 w-full py-4 bg-black text-white rounded-lg text-sm font-semibold hover:bg-zinc-900 transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-sm">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.97.08 2.07-.42 2.82-1.33z"></path>
              </svg>
              <span>Apple로 계속하기</span>
            </button>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-outline-variant opacity-30"></div>
            <span className="text-xs font-bold text-outline">또는 이메일로 가입</span>
            <div className="h-[1px] flex-1 bg-outline-variant opacity-30"></div>
          </div>

          {/* Email Signup Form */}
          <form className="space-y-stack-md text-left" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">이메일 주소</label>
              <input
                className="w-full px-4 py-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-base text-on-surface"
                id="email"
                placeholder="name@company.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="password">비밀번호</label>
              <input
                className="w-full px-4 py-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-base text-on-surface"
                id="password"
                placeholder="최소 6자 이상"
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="w-full py-4 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md cursor-pointer disabled:bg-slate-400" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "가입 처리 중..." : "이메일로 시작하기"}
            </button>
          </form>

          {message && <p className="text-sm text-center text-emerald-700 mt-2">{message}</p>}
          {error && <p className="text-sm text-center text-red-600 mt-2">{error}</p>}

          <p className="text-xs text-on-surface-variant pt-2 leading-relaxed">
            가입 시 <a className="text-primary hover:underline font-semibold" href="#">이용 약관</a> 및 <a className="text-primary hover:underline font-semibold" href="#">개인정보 처리방침</a>에 동의하게 됩니다.
          </p>
        </div>

        {/* Footer Help */}
        <div className="pt-stack-md flex items-center justify-center gap-2">
          <span className="text-base text-on-surface-variant">이미 계정이 있으신가요?</span>
          <Link className="text-base font-bold text-primary hover:underline" href="/login">로그인</Link>
        </div>
      </main>

      <footer className="w-full py-24 bg-surface-container-low border-t border-outline-variant mt-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-stack-lg px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-stack-md">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
              <span className="font-extrabold text-2xl text-primary tracking-tight">MeetingHub</span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-stack-lg text-left">모던 워크플레이스를 위한 최적의 회의 협업 솔루션. 더 스마트하게 소통하세요.</p>
            <div className="flex gap-stack-md">
              <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
              <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">chat</span></a>
              <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">language</span></a>
            </div>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold mb-stack-md text-on-surface uppercase tracking-widest">기능</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">스마트 요약</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">일정 관리</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">연동 서비스</a></li>
            </ul>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold mb-stack-md text-on-surface uppercase tracking-widest">지원</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">도움말 센터</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">커뮤니티</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">문의하기</a></li>
            </ul>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold mb-stack-md text-on-surface uppercase tracking-widest">법적 고지</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">개인정보 처리방침</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">서비스 약관</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">보안 안내</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-stack-md px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto">
          <p className="text-xs text-outline">© 2024 MeetingHub Collaboration Systems Inc.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-sm"></span>
            <span className="text-xs text-on-surface-variant">시스템 상태: 정상</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


