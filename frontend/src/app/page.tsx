"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);

  // 스크롤 리빌 애니메이션 효과
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll(".reveal-section");
    sections.forEach((sec) => observer.observe(sec));

    // 1초 뒤 우측 하단 플로팅 알림 등장
    const timer = setTimeout(() => {
      setShowNotification(true);
    }, 1500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // 알림 참가하기 및 네비게이션 처리
  const handleJoinMeeting = () => {
    const token = localStorage.getItem("meetinghubAccessToken");
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="font-body-md text-body-md bg-background overflow-x-hidden min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 w-full h-16 bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-between px-margin-desktop border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl icon-fill">meeting_room</span>
          <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">MeetingHub</span>
        </div>
        <div className="hidden md:flex items-center gap-stack-lg">
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">솔루션</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">비즈니스</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">요금제</a>
        </div>
        <div className="flex items-center gap-stack-md">
          <Link href="/login" className="font-label-md text-label-md text-primary px-stack-md py-1.5 rounded-xl hover:bg-primary-container/20 transition-colors">
            로그인
          </Link>
          <Link href="/signup" className="font-label-md text-label-md bg-primary text-on-primary px-stack-lg py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
            시작하기
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-24 pb-32 overflow-hidden pastel-gradient">
        <div className="relative z-10 max-w-[1440px] mx-auto px-margin-desktop text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-secondary-container/40 border border-secondary/10 rounded-full px-4 py-1.5 mb-stack-lg">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-on-secondary-fixed-variant tracking-wider uppercase">Beta: Smart Summaries v2</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl max-w-4xl mx-auto leading-[1.1] mb-stack-md text-on-background">
            효율적인 회의, <br />
            <span className="text-primary">MeetingHub가 디자인합니다.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-stack-lg leading-relaxed">
            자율 회의록 작성부터 최적의 일정 예약까지. <br /> 팀원 모두가 본질적인 논의에만 집중할 수 있는 업무 환경을 경험하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-stack-md mt-6">
            <Link href="/signup" className="bg-primary text-on-primary px-8 py-3.5 rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 text-center">
              지금 무료로 시작하기
            </Link>
            <a href="#" className="bg-white text-on-surface px-8 py-3.5 rounded-2xl font-semibold border border-outline-variant hover:bg-surface-container transition-colors text-center">
              기능 둘러보기
            </a>
          </div>
          <div className="mt-20 w-full soft-card p-2 shadow-2xl relative bg-white/40 border-white">
            <img
              className="w-full h-auto rounded-[1.8rem] mask-fade-bottom border border-surface-container-high"
              alt="High-fidelity meeting dashboard"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIVSd0AkVhmU7Z6MeUopdqPmMBC2_8exeJXzQO8MH8CX4KesOIkLDVDw0ADG93RgvuGFsy9liqVW8yc_m4xDNwO_wCU2u0Q-wS5IVahfWOBYDJ36TK_3hli10z67Nu2On8TMuRK1Ujba8sDLpQPwCUWx8qXzWAuoudqN2mTHDs_jNAcUFQIBarC2kflBNKnD1y-WIS7m4ww6sXdva2VOKYmXQ4ojNdj78YMwcXJMw7aoAm3ucL1lfuXasGxNB-MtYHZHIt3hRXyPGt"
            />
            <div className="absolute -top-8 -left-8 p-stack-md bg-white rounded-2xl shadow-xl border border-surface-container hidden sm:block animate-bounce" style={{ animationDuration: '4s' }}>
              <span className="material-symbols-outlined text-secondary text-4xl">edit_note</span>
            </div>
            <div className="absolute bottom-12 -right-6 p-stack-md bg-white rounded-2xl shadow-xl border border-surface-container hidden sm:block animate-bounce" style={{ animationDuration: '5s' }}>
              <span className="material-symbols-outlined text-primary text-4xl">groups</span>
            </div>
          </div>
        </div>
      </header>

      {/* Trusted By */}
      <section className="reveal-section opacity-0 translate-y-10 transition-all duration-1000 ease-out py-12 bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto px-margin-desktop">
          <p className="text-center font-label-sm text-label-sm text-outline mb-stack-lg uppercase tracking-[0.2em]">주요 파트너사</p>
          <div className="flex flex-wrap justify-center items-center gap-stack-lg opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-1 font-headline-md text-headline-md font-bold text-on-surface">NOVA</div>
            <div className="flex items-center gap-1 font-headline-md text-headline-md font-bold text-on-surface">ATMOS</div>
            <div className="flex items-center gap-1 font-headline-md text-headline-md font-bold text-on-surface">VANTAGE</div>
            <div className="flex items-center gap-1 font-headline-md text-headline-md font-bold text-on-surface">KINETIC</div>
            <div className="flex items-center gap-1 font-headline-md text-headline-md font-bold text-on-surface">STRATA</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="reveal-section opacity-0 translate-y-10 transition-all duration-1000 ease-out py-32 px-margin-desktop max-w-[1440px] mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-headline-lg text-headline-lg font-bold mb-stack-sm text-on-background">회의의 깊이를 더하는 지능형 도구</h2>
          <p className="text-on-surface-variant font-body-lg text-body-lg max-w-2xl mx-auto">기존 업무 도구와 매끄럽게 연결되어 생산성을 극대화합니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Feature 1 */}
          <div className="md:col-span-8 soft-card p-stack-lg flex flex-col justify-between min-h-[360px] bg-white border-surface-container">
            <div className="flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-primary-container/30 flex items-center justify-center mb-stack-lg">
                <span className="material-symbols-outlined text-primary text-3xl">record_voice_over</span>
              </div>
              <h3 className="font-headline-md text-headline-md font-bold mb-stack-sm text-on-background">스마트 회의 기록</h3>
              <p className="text-on-surface-variant font-body-md text-body-md max-w-md">실시간으로 대화를 텍스트로 변환하고, 주요 안건과 결정 사항을 요약하여 자동으로 팀 채널에 공유합니다.</p>
            </div>
            <div className="mt-stack-lg flex gap-stack-sm">
              <span className="px-4 py-1.5 bg-surface-container rounded-full text-label-sm text-on-surface-variant">자동 요약</span>
              <span className="px-4 py-1.5 bg-surface-container rounded-full text-label-sm text-on-surface-variant">화자 식별</span>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="md:col-span-4 soft-card p-stack-lg flex flex-col bg-white border-surface-container">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container/30 flex items-center justify-center mb-stack-lg">
              <span className="material-symbols-outlined text-secondary text-3xl">event_available</span>
            </div>
            <h3 className="font-headline-md text-headline-md font-bold mb-stack-sm text-on-background">지능형 일정 최적화</h3>
            <p className="text-on-surface-variant font-body-md text-body-md">참석자들의 가용 시간을 분석하여 가장 효율적인 회의 시간을 제안하고 중복 예약을 방지합니다.</p>
            <div className="mt-auto pt-8">
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-3/4"></div>
              </div>
              <p className="font-label-sm text-label-sm mt-2 text-on-surface-variant">이번 주 최적화 지수: 75%</p>
            </div>
          </div>
          {/* Feature 3 */}
          <div className="md:col-span-4 soft-card p-stack-lg flex flex-col bg-white border-surface-container">
            <div className="w-14 h-14 rounded-2xl bg-tertiary-container/30 flex items-center justify-center mb-stack-lg">
              <span className="material-symbols-outlined text-tertiary text-3xl">hub</span>
            </div>
            <h3 className="font-headline-md text-headline-md font-bold mb-stack-sm text-on-background">인터랙티브 워크스페이스</h3>
            <p className="text-on-surface-variant font-body-md text-body-md">회의 전후의 모든 문서를 한 곳에서 관리하세요. 관련 업무 맥락을 즉시 파악할 수 있습니다.</p>
            <div className="mt-8 flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-white bg-surface-variant flex items-center justify-center text-xs font-bold">SH</div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-primary-container flex items-center justify-center text-xs font-bold text-primary">JW</div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-secondary-container flex items-center justify-center text-xs font-bold text-secondary">MK</div>
            </div>
          </div>
          {/* Feature 4 */}
          <div className="md:col-span-8 soft-card p-stack-lg flex flex-col md:flex-row gap-stack-lg bg-white border-surface-container">
            <div className="md:w-1/2">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center mb-stack-lg">
                <span className="material-symbols-outlined text-primary text-3xl">monitoring</span>
              </div>
              <h3 className="font-headline-md text-headline-md font-bold mb-stack-sm text-on-background">협업 통계 분석</h3>
              <p className="text-on-surface-variant font-body-md text-body-md">팀의 회의 빈도와 효율성을 시각화하여 더 나은 협업 문화를 위한 인사이트를 제공합니다.</p>
            </div>
            <div className="md:w-1/2 flex items-center">
              <img
                className="rounded-2xl border border-surface-container-high w-full"
                alt="Analytics view"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA96NTWv_Bw42fmE_Nr3wy9tfY2Ao-4xM8Qx4o9S5SkdI-atgyOjF03OL7TflaH-42hXxo4P85SK0q-1lb23HxQidNNHCMFZJ-ZpNF2Yg21fRs2ob2q318m73ypgtblVPwk5vj7TB-N84IZcV2Ko_sVUBUhctZ7rCzBZPfOHy5txqs2eAiEu8kmyOFgoGgiVXpXMT5x3oWH2CLinGsoQX9YHFS-1icA4iytkDPxxZZEoo5GEaryjw6sJeGWbHuT_jUMIXzNzPOGNpVU"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="reveal-section opacity-0 translate-y-10 transition-all duration-1000 ease-out py-24 px-margin-desktop">
        <div className="max-w-5xl mx-auto soft-card p-12 md:p-20 text-center bg-gradient-to-br from-white to-surface-container-low border-white shadow-xl">
          <h2 className="font-headline-xl text-headline-lg md:text-headline-xl font-bold mb-stack-md text-on-background">팀의 잠재력을 깨우세요</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg max-w-xl mx-auto">전 세계 수천 개의 팀이 MeetingHub와 함께 더 적게 회의하고 더 많이 실행하고 있습니다.</p>
          <div className="flex flex-col sm:flex-row gap-stack-md justify-center">
            <Link href="/signup" className="px-8 py-4 bg-primary text-on-primary font-bold rounded-2xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 text-center">
              지금 무료로 시작하기
            </Link>
            <button className="px-8 py-4 bg-white text-on-surface font-semibold rounded-2xl border border-outline-variant hover:bg-surface-container transition-colors">영업팀에 문의</button>
          </div>
          <p className="mt-stack-lg font-label-sm text-label-sm text-outline">카드 등록 없이 14일 무료 체험이 가능합니다</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-surface-container-low border-t border-outline-variant px-margin-desktop mt-auto">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-stack-lg">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-stack-md">
              <span className="material-symbols-outlined text-primary text-2xl icon-fill">meeting_room</span>
              <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">MeetingHub</span>
            </div>
            <p className="text-on-surface-variant font-body-sm text-body-sm leading-relaxed mb-stack-lg">모던 워크플레이스를 위한 최적의 회의 협업 솔루션. 더 스마트하게 소통하세요.</p>
            <div className="flex gap-stack-md">
              <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
              <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">chat</span></a>
              <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">language</span></a>
            </div>
          </div>
          <div>
            <h4 className="font-label-md text-label-md font-bold mb-stack-md text-on-surface uppercase tracking-widest">기능</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">스마트 요약</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">일정 관리</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">연동 서비스</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-md text-label-md font-bold mb-stack-md text-on-surface uppercase tracking-widest">지원</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">도움말 센터</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">커뮤니티</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">문의하기</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-md text-label-md font-bold mb-stack-md text-on-surface uppercase tracking-widest">법적 고지</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">개인정보 처리방침</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">서비스 약관</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">보안 안내</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto mt-20 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-stack-md">
          <p className="font-label-sm text-label-sm text-outline">© 2024 MeetingHub Collaboration Systems Inc.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-sm shadow-secondary/50"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">시스템 상태: 정상</span>
          </div>
        </div>
      </footer>

      {/* Floating Pastel Notification */}
      {showNotification && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-bottom-8 duration-700 ease-out">
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-stack-md border border-primary/10 flex items-center gap-stack-md min-w-[360px] max-w-md ring-1 ring-black/5">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl icon-fill">notifications_active</span>
            </div>
            <div className="flex-grow">
              <p className="font-label-sm text-primary mb-0.5 font-bold">회의 예정</p>
              <p className="font-body-sm text-on-surface font-semibold leading-snug">회의 시작 10분 전: 제품 전략 싱크 회의가 곧 시작됩니다.</p>
            </div>
            <button
              onClick={handleJoinMeeting}
              className="bg-primary text-on-primary px-stack-md py-2.5 rounded-2xl font-bold text-label-sm shadow-md shadow-primary/20 hover:brightness-105 transition-all flex-shrink-0 cursor-pointer"
            >
              참가하기
            </button>
            <button
              onClick={() => setShowNotification(false)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-black/5 transition-colors absolute -top-2 -right-2 bg-white shadow-md border border-outline-variant/30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
