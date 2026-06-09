"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "이메일";
  const [resendStatus, setResendStatus] = useState("인증 메일 재발송");
  const [isResending, setIsResending] = useState(false);

  const handleResend = () => {
    if (isResending) return;
    setIsResending(true);
    setResendStatus("메일을 보냈습니다!");

    setTimeout(() => {
      setResendStatus("인증 메일 재발송");
      setIsResending(false);
    }, 3000);
  };

  return (
    <div className="bg-surface relative flex flex-col min-h-screen w-full items-center justify-center text-on-surface">
      {/* Subtle Background Shader */}
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-secondary-container opacity-30 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-tertiary-container opacity-20 rounded-full blur-3xl pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-lg px-margin-mobile md:px-0 flex-1 items-center justify-center flex pt-stack-lg mx-auto">
        <div className="glass-card rounded-xl shadow-sm p-stack-lg md:p-12 text-center flex flex-col items-center gap-stack-lg border border-white/30 backdrop-blur-md transition-all duration-500 hover:shadow-md">
          {/* Illustration Area */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-stack-md animate-float">
            {/* Abstract Pastel Background Circle */}
            <div className="absolute inset-0 bg-primary-container opacity-20 rounded-full blur-3xl scale-110"></div>
            {/* Main Illustration */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <img 
                alt="Email Verification Illustration" 
                className="w-full h-full object-contain rounded-xl drop-shadow-xl" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkUTnOAC6ZfxRazFPMhz5PxN-z0B3wkUhIDMXJ31FqD93rfIW-79e1ABlk-WyvO2ZcTKhsdPdY50FoHsndAhXCo2k7FLWfc0APhu6x_07awcf5yY2FYjLIZ48RJcQCWdTec9XSAA2EY_cbtySrpF7HtKrgrV71H1JL4RlV4cvMK3ij10heaZermz4S33SDlR4xeya0mJiDxlkkRgJadmvw5ObYqggiFwoAwBzXV2cNaVnN7WUyOFuR0WJ6fH-7PV7oH7Tp3z20hSzC" 
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-stack-sm">
            <h1 className="text-3xl text-on-surface font-extrabold">
              이메일을 확인해 주세요
            </h1>
            <p className="text-base text-on-surface-variant max-w-sm mx-auto leading-relaxed">
              인증 링크를 클릭하면 <span className="font-bold text-primary">MeetingHub</span> 가입이 완료됩니다. <br />
              <strong className="text-primary">{email}</strong> 수신함을 확인하고 인증을 마무리하세요.
            </p>
          </div>

          {/* Action Area */}
          <div className="w-full flex flex-col gap-stack-md mt-stack-md">
            {/* Primary Action */}
            <a 
              href="https://mail.google.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group relative flex items-center justify-center gap-2 bg-primary text-on-primary text-sm font-semibold py-4 px-8 rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-primary/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">mail</span>
              <span>이메일 앱 열기</span>
            </a>

            {/* Secondary Action */}
            <div className="flex flex-col items-center gap-1 mt-2">
              <p className="text-xs text-on-surface-variant">
                메일을 받지 못하셨나요?
              </p>
              <button 
                onClick={handleResend}
                className="text-primary text-sm font-semibold hover:underline transition-all duration-200 cursor-pointer"
                disabled={isResending}
              >
                {resendStatus}
              </button>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="mt-stack-lg pt-stack-lg border-t border-outline-variant w-full flex justify-center items-center gap-2 text-outline">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span className="text-xs uppercase tracking-wider font-semibold">Secured by MeetingHub Cloud</span>
          </div>
        </div>
      </main>

      <footer className="py-24 bg-surface-container-low border-t border-outline-variant w-full mt-20">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-stack-lg px-margin-mobile md:px-margin-desktop">
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
        <div className="max-w-[1440px] mx-auto mt-20 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-stack-md px-margin-mobile md:px-margin-desktop">
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

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
        <p className="text-lg font-semibold">불러오는 중...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
