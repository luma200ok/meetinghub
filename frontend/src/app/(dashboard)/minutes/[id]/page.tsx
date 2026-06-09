"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type TranscriptItem = {
  id: string;
  senderName: string;
  initials: string;
  avatarBg: string;
  time: string;
  message: string;
  isAiPlaceholder?: boolean;
};

export default function MinuteDetailPage({ params }: { params: { id: string } }) {
  // 체크박스 조치 사항들 상태 관리
  const [todoList, setTodoList] = useState([
    { id: 1, text: "AI 추론 엔진 최적화", owner: "엔지니어링 팀", done: true },
    { id: 2, text: "데모용 스테이징 환경 설정", owner: "마커스 케인 • 기한: 금요일", done: false },
    { id: 3, text: "확장 관련 예산 할당 검토", owner: "재무팀 • 기한: 다음 주 월요일", done: false },
  ]);

  // 실시간 회의록 데이터 리스트
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([
    {
      id: "t1",
      senderName: "제임스 스미스 (CEO)",
      initials: "JS",
      avatarBg: "bg-surface-container-highest text-primary",
      time: "오전 10:02",
      message: "모두 좋은 아침입니다. Q4 로드맵부터 시작하죠. 사라, AI 통합 레이어 업데이트 상황을 알려줄 수 있나요? 다음 주 화요일 클라이언트 데모 전까지 지연 시간 문제가 반드시 해결되어야 합니다.",
    },
    {
      id: "t2",
      senderName: "사라 첸 (CTO)",
      initials: "SC",
      avatarBg: "bg-secondary-container text-on-secondary-container",
      time: "오전 10:03",
      message: "물론입니다, 제임스. 엔지니어링 팀이 추론 엔진 최적화에 성공했습니다. 응답 시간이 40% 감소하는 성과를 거두었습니다. 데모 준비는 차질 없이 진행 중입니다.",
    },
  ]);

  const [aiAnalyzing, setAiAnalyzing] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 체크박스 클릭 핸들러
  const handleToggleTodo = (id: number) => {
    setTodoList(prev =>
      prev.map(todo => (todo.id === id ? { ...todo, done: !todo.done } : todo))
    );
  };

  // 실시간 텍스트 유입 연출 시뮬레이션
  useEffect(() => {
    const timer = setTimeout(() => {
      setAiAnalyzing(false);
      setTranscripts(prev => [
        ...prev,
        {
          id: "t3",
          senderName: "마커스 케인 (PM)",
          initials: "MK",
          avatarBg: "bg-surface-container-highest text-primary",
          time: "오전 10:05",
          message: "사라 씨의 말씀대로, 벤치마크 테스트에서도 성능 향상이 두드러졌습니다. 금요일 오전까지 데모 환경 구성을 완료하여 공유하겠습니다.",
        },
      ]);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // 스크롤 동기화 연출
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [transcripts, aiAnalyzing]);

  return (
    <div className="h-screen w-full flex bg-surface text-on-surface overflow-hidden relative font-sans">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant flex flex-col py-6 px-4 z-50">
        <div className="mb-8 px-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl icon-fill" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
          <div>
            <h1 className="text-xl font-black text-primary leading-tight tracking-tight">MeetingHub</h1>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Productive Serenity</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200">
            <span className="material-symbols-outlined text-xl">dashboard</span>
            <span className="text-sm font-semibold">대시보드</span>
          </Link>
          <Link href="/calendar" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200">
            <span className="material-symbols-outlined text-xl">calendar_month</span>
            <span className="text-sm font-semibold">캘린더</span>
          </Link>
          <Link href="/reservations" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200">
            <span className="material-symbols-outlined text-xl">meeting_room</span>
            <span className="text-sm font-semibold">회의실 예약</span>
          </Link>
          <Link href="/minutes" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-semibold transition-transform active:scale-95">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            <span className="text-sm font-semibold">AI 회의록</span>
          </Link>
          <Link href="/tasks" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200">
            <span className="material-symbols-outlined text-xl">account_tree</span>
            <span className="text-sm font-semibold">워크플로우</span>
          </Link>
        </nav>
        <div className="mt-auto space-y-4 pt-6">
          <button className="w-full py-3 bg-primary text-on-primary rounded-2xl text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all cursor-pointer">
            새 분석 시작
          </button>
          <div className="space-y-1">
            <Link className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high" href="/settings">
              <span className="material-symbols-outlined text-xl">settings</span>
              <span className="text-sm font-semibold">설정</span>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high" href="/help">
              <span className="material-symbols-outlined text-xl">help</span>
              <span className="text-sm font-semibold">지원</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-10 z-40">
        <div className="flex items-center gap-8 flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
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
              <button className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-xl">notifications</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-xl">history</span>
              </button>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant"></div>
          <div className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant transition-transform group-hover:scale-105">
              <img 
                alt="User Profile" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTyxNbtW0m31PPxE-WLF7CI5U7rFj_3Rj794hxS3OUQt-P5byj9uddh1D5tHcZKXYBMlBz2kn8lZj-9ZhfzqQQWltPRqoa2PJ5y-t_SRJQFk5CEuORbkegATF3tw5_zOuxsDEzSu12gczdtSnV4V1ik3w5GlmIFVNpW_1K10CBAtHHxwjfk3EFToXijUJj7Dt_U5pzRfqjT-LnrReyIIj8PiXbksmbHvqlphppI5d0N80mVJDkNdm6_jKj5Yx62pOxwjRz77XqhBdZ" 
              />
            </div>
            <div className="text-left hidden lg:block">
              <span className="text-sm font-semibold text-on-surface block leading-none">마커스 첸</span>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tight">팀 리더</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 w-[calc(100vw-256px)] h-[calc(100vh-64px)] flex flex-col mt-16 overflow-y-auto custom-scrollbar px-8 pt-8 pb-0">
        {/* Metadata Row */}
        <div className="flex justify-between items-end mb-8 flex-shrink-0">
          <div>
            <nav className="flex gap-2 text-on-surface-variant text-xs font-semibold mb-2">
              <span>회의</span>
              <span className="opacity-40">/</span>
              <span className="text-primary font-bold">프로젝트 퀀텀 전략</span>
            </nav>
            <h2 className="text-3xl text-on-surface font-bold">주간 경영진 정례 회의</h2>
            <div className="flex gap-6 mt-3 text-sm text-on-surface-variant font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary/60">calendar_today</span>
                <span>2023년 10월 24일 • 오전 10:00</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary/60">groups</span>
                <span>참석자 8명</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary/60">meeting_room</span>
                <span>가상 회의실: Alpha-9</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-surface-container-high text-on-surface-variant text-sm font-bold hover:bg-surface-container-highest transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">share</span> 공유
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-on-primary text-sm font-bold shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">download</span> 보고서 내보내기
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0 pb-8">
          {/* Left Column: Video & Transcript */}
          <div className="col-span-8 flex flex-col gap-8 min-h-0">
            {/* Video Player */}
            <div className="relative w-full aspect-video rounded-3xl bg-black overflow-hidden shadow-xl shadow-black/5 group flex-shrink-0">
              <img 
                alt="회의실 영상" 
                className="w-full h-full object-cover opacity-70" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoM17PBig3vJODdW2CakqE0wcfcWU3essUfpY7YqNuz7liKD3vb4AsnRz0ojnXjG5mJ5J5VQffYlQdj1TM05YFselWRT8XUHBTzVy_7yTDGeI2PWZSZATJap-kGC8fnQxjHKuicWL3XasVkc8Wm5Qqyg5GlkpFyDYWdV7SIxm9TmlIbX-E59NowNe1iGqBtyYmNTS5mdXzRwHB7x4PE9hCtvonHt2oi5D7hyFpPf8-OUKAek9D3pDO7BjkphD0HOu9YoM9U8s0kxw5" 
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-all">
                <button className="h-20 w-20 bg-white/25 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30 hover:scale-110 hover:bg-white/40 transition-all shadow-2xl cursor-pointer">
                  <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-6 text-white">
                  <span className="text-xs font-semibold">14:02 / 45:00</span>
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full relative">
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-primary-container rounded-full"></div>
                    <div className="absolute top-1/2 left-1/3 -translate-y-1/2 h-4 w-4 bg-white rounded-full shadow-lg border-2 border-primary"></div>
                  </div>
                  <span className="material-symbols-outlined cursor-pointer hover:scale-110 transition-transform text-xl">fullscreen</span>
                </div>
              </div>
            </div>

            {/* Transcript Section */}
            <div className="flex-1 bg-surface-container-lowest rounded-3xl border border-outline-variant/50 flex flex-col min-h-[300px] shadow-sm pastel-overlay overflow-hidden">
              <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center flex-shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-primary bg-primary-container/30 p-1.5 rounded-lg">notes</span>
                  실시간 회의록
                </h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-secondary-container/20 text-secondary text-xs font-bold flex items-center gap-2 border border-secondary-container/30">
                    <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span> 라이브 동기화 중
                  </span>
                </div>
              </div>
              
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {transcripts.map((t) => (
                  <div key={t.id} className="flex gap-5 group">
                    <div className={`h-10 w-10 rounded-2xl ${t.avatarBg} flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform`}>
                      {t.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-sm font-bold text-on-surface">{t.senderName}</span>
                        <span className="text-on-surface-variant/60 text-xs font-semibold">{t.time}</span>
                      </div>
                      <p className="text-base text-on-surface-variant leading-relaxed p-4 bg-surface rounded-2xl rounded-tl-none border border-outline-variant/20">
                        {t.message}
                      </p>
                    </div>
                  </div>
                ))}
                
                {aiAnalyzing && (
                  <div className="flex gap-5 opacity-40">
                    <div className="h-10 w-10 rounded-2xl bg-surface-container-highest flex-shrink-0 flex items-center justify-center font-bold text-primary text-sm">MK</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-sm font-bold text-on-surface">마커스 케인</span>
                        <span className="text-on-surface-variant/60 text-xs font-semibold">오전 10:05</span>
                      </div>
                      <p className="text-base text-on-surface-variant leading-relaxed italic p-4 bg-surface rounded-2xl rounded-tl-none border border-outline-variant/10">
                        음성 패턴 분석 중...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Insights */}
          <div className="col-span-4 flex flex-col gap-8 min-h-0 pr-1">
            {/* Summary Card */}
            <div className="p-7 bg-surface-container-lowest rounded-3xl border border-primary-container/40 ai-glow relative overflow-hidden group flex-shrink-0">
              <div className="absolute -top-4 -right-4 p-8 bg-primary-container/10 rounded-full blur-2xl group-hover:bg-primary-container/20 transition-all"></div>
              <div className="relative">
                <h4 className="text-lg font-bold ai-gradient-text mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  AI 핵심 요약
                </h4>
                <p className="text-base text-on-surface-variant leading-relaxed">
                  이번 회의는 프로젝트 퀀텀의 Q4 전략적 정렬에 집중했습니다. 주요 성과로는 기술적 최적화(지연 시간 40% 감소)가 보고되었습니다. 
                  <br /><br />
                  <span className="font-bold text-primary">핵심 마일스톤:</span> 금요일까지 클라이언트 데모 환경 최종 구축. 전반적인 분위기는 매우 긍정적이며 협력적입니다.
                </p>
              </div>
            </div>

            {/* Action Items */}
            <div className="p-7 bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-sm flex-shrink-0">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> 조치 사항
              </h4>
              <ul className="space-y-5">
                {todoList.map((todo) => (
                  <li key={todo.id} className="flex items-start gap-4">
                    <div className="relative flex items-center justify-center h-6 w-6 shrink-0 mt-0.5">
                      <input 
                        checked={todo.done} 
                        onChange={() => handleToggleTodo(todo.id)}
                        className="rounded border-outline-variant text-primary focus:ring-primary/20 h-5 w-5 cursor-pointer" 
                        type="checkbox" 
                      />
                    </div>
                    <div className="flex-1">
                      <p className={`text-base text-on-surface ${todo.done ? "line-through opacity-40" : ""}`}>
                        {todo.text}
                      </p>
                      <span className="text-xs text-on-surface-variant/60 flex items-center gap-1 mt-1 font-semibold">
                        <span className="material-symbols-outlined text-xs">person</span> 담당: {todo.owner}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sentiment Trends */}
            <div className="p-7 bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-sm flex-shrink-0">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> 감정 분석
              </h4>
              <div className="h-32 flex items-end justify-between gap-2 mb-5">
                <div className="w-full bg-secondary-container/20 rounded-2xl h-[40%] hover:bg-secondary-container/40 transition-all cursor-help relative group">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-background text-white text-[11px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-xl z-10 transition-opacity">도입: 침착</div>
                </div>
                <div className="w-full bg-secondary-container/40 rounded-2xl h-[65%] hover:bg-secondary-container/60 transition-all cursor-help relative group">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-background text-white text-[11px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-xl z-10 transition-opacity">기술: 자신감</div>
                </div>
                <div className="w-full bg-[#7cb9e8]/50 rounded-2xl h-[85%] hover:bg-[#7cb9e8]/70 transition-all cursor-help relative group">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-background text-white text-[11px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-xl z-10 transition-opacity">로드맵: 열정</div>
                </div>
                <div className="w-full bg-error-container/20 rounded-2xl h-[30%] hover:bg-error-container/40 transition-all cursor-help relative group">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-background text-white text-[11px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-xl z-10 transition-opacity">예산: 우려</div>
                </div>
                <div className="w-full bg-secondary-container/60 rounded-2xl h-[75%] hover:bg-secondary-container/80 transition-all cursor-help relative group">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-background text-white text-[11px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-xl z-10 transition-opacity">마무리: 긍정</div>
                </div>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <div className="flex items-center gap-2 text-secondary">
                  <span className="h-2 w-2 rounded-full bg-secondary"></span> 82% 긍정
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant/60">
                  <span className="h-2 w-2 rounded-full bg-surface-container-highest"></span> 18% 중립
                </div>
              </div>
            </div>

            {/* Keyword Cloud */}
            <div className="p-7 bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-sm flex-shrink-0">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> 주요 키워드
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1.5 rounded-full bg-primary-container/20 text-primary text-sm font-semibold border border-primary-container/30 hover:bg-primary-container/30 transition-colors cursor-default">확장성</span>
                <span className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-semibold border border-transparent hover:border-outline-variant transition-colors cursor-default">Q4 로드맵</span>
                <span className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-semibold border border-transparent hover:border-outline-variant transition-colors cursor-default">클라이언트 데모</span>
                <span className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold shadow-sm">추론 레이어</span>
                <span className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-semibold border border-transparent hover:border-outline-variant transition-colors cursor-default">예산 할당</span>
                <span className="px-4 py-1.5 rounded-full bg-secondary-container/20 text-secondary text-sm font-semibold border border-secondary-container/30">지연 시간</span>
                <span className="px-4 py-1.5 rounded-full bg-primary-container/20 text-primary text-sm font-semibold border border-primary-container/30 font-semibold">최적화</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
