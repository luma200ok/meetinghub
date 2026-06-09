"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw signInError;
      }
      if (data.session?.access_token) {
        localStorage.setItem("meetinghubAccessToken", data.session.access_token);
      }
      if (companyId) {
        localStorage.setItem("meetinghubCompanyId", companyId);
        setMessage("로그인되었습니다. 대시보드로 이동합니다.");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setMessage("로그인되었습니다. 온보딩을 진행합니다.");
        setTimeout(() => {
          router.push("/onboarding");
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop bg-surface-bright flex-grow pt-24 min-h-screen text-on-surface">
      <div className="w-full max-w-md">
        {/* Brand Anchor */}
        <div className="mb-stack-lg text-center lg:text-left flex items-center justify-center lg:justify-start gap-2">
          <span className="material-symbols-outlined text-primary text-4xl icon-fill" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
          <span className="font-black text-3xl text-primary tracking-tight">MeetingHub</span>
        </div>
        <div className="mb-stack-lg">
          <h1 className="text-3xl text-on-surface font-bold mb-2">로그인</h1>
          <p className="text-base text-on-surface-variant">플랫폼에 접속하여 협업을 시작하세요.</p>
        </div>
        
        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-gutter mb-stack-lg">
          <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all duration-200 text-slate-800 cursor-pointer shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span>Google</span>
          </button>
          <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 bg-[#FEE500] text-[#191919] rounded-lg text-sm font-semibold hover:bg-[#FCE000] transition-all duration-200 cursor-pointer shadow-sm">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.68 2.531-.778 2.9-.123.463.16.458.337.34 1.38-.918 3.195-2.182 3.882-2.651.42.062.85.097 1.289.097 4.97 0 9-3.186 9-7.115S16.97 3 12 3z"></path>
            </svg>
            <span>Kakao</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-stack-md mb-stack-lg">
          <div className="h-[1px] flex-grow bg-outline-variant"></div>
          <span className="text-xs font-bold text-outline">또는 이메일로 로그인</span>
          <div className="h-[1px] flex-grow bg-outline-variant"></div>
        </div>

        {/* Email Login Form */}
        <form className="space-y-stack-md" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-unit px-unit" htmlFor="email">이메일 주소</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
              <input 
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base outline-none text-on-surface" 
                id="email" 
                placeholder="example@meetinghub.ai" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-unit px-unit">
              <label className="block text-xs font-bold text-on-surface-variant" htmlFor="password">비밀번호</label>
              <a className="text-xs text-primary hover:underline transition-all" href="#">비밀번호를 잊으셨나요?</a>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
              <input 
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base outline-none text-on-surface" 
                id="password" 
                placeholder="••••••••" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-unit px-unit" htmlFor="companyId">회사 ID (선택사항)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">corporate_fare</span>
              <input 
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base outline-none text-on-surface" 
                id="companyId" 
                placeholder="회사 ID가 있는 경우 입력하세요" 
                type="text"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-stack-md px-unit">
            <input className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" id="remember" type="checkbox" />
            <label className="text-sm text-on-surface-variant select-none" htmlFor="remember">로그인 상태 유지</label>
          </div>

          <button className="w-full btn-primary-action py-4 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400" disabled={isSubmitting}>
            <span>{isSubmitting ? "처리 중..." : "로그인"}</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>

          {message && <p className="text-sm text-center text-emerald-700 mt-2">{message}</p>}
          {error && <p className="text-sm text-center text-red-600 mt-2">{error}</p>}
        </form>

        {/* Footer Links */}
        <div className="mt-stack-lg text-center">
          <p className="text-sm text-on-surface-variant">
            계정이 없으신가요? 
            <Link className="text-sm font-bold text-primary ml-1 hover:underline" href="/signup">회원가입</Link>
          </p>
        </div>
      </div>

      {/* Footer Policy */}
      <div className="mt-12 text-center w-full max-w-md">
        <p className="text-[10px] text-outline leading-normal">
          MeetingHub 서비스 이용 시 <span className="underline">이용약관</span> 및 <span className="underline">개인정보 처리방침</span>에 동의하는 것으로 간주됩니다. <br />
          © 2024 MeetingHub Inc. All rights reserved.
        </p>
      </div>

      <footer className="py-24 bg-surface-container-low border-t border-outline-variant w-full mt-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-stack-lg px-margin-desktop max-w-[1440px] mx-auto">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-stack-md">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
              <span className="font-extrabold text-2xl text-primary tracking-tight">MeetingHub</span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-stack-lg">모던 워크플레이스를 위한 최적의 회의 협업 솔루션. 더 스마트하게 소통하세요.</p>
            <div className="flex gap-stack-md">
              <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
              <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">chat</span></a>
              <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">language</span></a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-stack-md text-on-surface uppercase tracking-widest">기능</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">스마트 요약</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">일정 관리</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">연동 서비스</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-stack-md text-on-surface uppercase tracking-widest">지원</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">도움말 센터</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">커뮤니티</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">문의하기</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-stack-md text-on-surface uppercase tracking-widest">법적 고지</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">개인정보 처리방침</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">서비스 약관</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">보안 안내</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-stack-md px-margin-desktop max-w-[1440px] mx-auto">
          <p className="text-xs text-outline">© 2024 MeetingHub Collaboration Systems Inc.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-sm shadow-secondary/50"></span>
            <span className="text-xs text-on-surface-variant">시스템 상태: 정상</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


