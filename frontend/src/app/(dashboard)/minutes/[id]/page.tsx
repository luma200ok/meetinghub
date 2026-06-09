"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { minutesApi } from "@/lib/api/minutes";
import { createClient } from "@/lib/supabase/client";
import type { Minute } from "@/types";
import MinuteViewer from "@/components/minutes/MinuteViewer";

type TranscriptItem = {
  id: string;
  senderName: string;
  initials: string;
  avatarBg: string;
  time: string;
  message: string;
  isAiPlaceholder?: boolean;
};

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export default function MinuteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [companyId] = useState(() => getStored("meetinghubCompanyId"));
  const [minute, setMinute] = useState<Minute | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [todoList, setTodoList] = useState([
    { id: 1, text: "AI 추론 엔진 최적화", owner: "엔지니어링 팀", done: true },
    { id: 2, text: "데모용 스테이징 환경 설정", owner: "마커스 케인 • 기한: 금요일", done: false },
    { id: 3, text: "확장 관련 예산 할당 검토", owner: "재무팀 • 기한: 다음 주 월요일", done: false },
  ]);

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

  const handleToggleTodo = (id: number) => {
    setTodoList(prev =>
      prev.map(todo => (todo.id === id ? { ...todo, done: !todo.done } : todo))
    );
  };

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

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [transcripts, aiAnalyzing]);

  useEffect(() => {
    if (!accessToken || !companyId) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    Promise.all([
      minutesApi.get(id, accessToken, companyId),
      supabase.auth.getUser(),
    ])
      .then(([m, { data }]) => {
        setMinute(m);
        setCurrentUserId(data.user?.id ?? "");
        if (m.content) {
          setTranscripts(prev => [
            ...prev,
            {
              id: "real-content",
              senderName: m.author_name ?? m.created_by.slice(0, 8),
              initials: "MEM",
              avatarBg: "bg-primary-container text-on-primary-container",
              time: new Date(m.updated_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
              message: m.content,
            }
          ]);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, accessToken, companyId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
        <p className="text-lg font-semibold animate-pulse">불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface px-6">
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-surface text-on-surface overflow-hidden relative font-sans">
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant flex flex-col py-6 px-4 z-50">
        <div className="mb-8 px-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-4xl icon-fill" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
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
          <Link href="/minutes" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-semibold">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            <span className="text-sm font-semibold">AI 회의록</span>
          </Link>
        </nav>
      </aside>

      <main className="ml-64 w-[calc(100vw-256px)] h-[calc(100vh-64px)] flex flex-col mt-16 overflow-y-auto custom-scrollbar px-8 pt-8 pb-0">
        <div className="flex justify-between items-end mb-8 flex-shrink-0">
          <div>
            <nav className="flex gap-2 text-on-surface-variant text-xs font-semibold mb-2">
              <span>회의</span>
              <span className="opacity-40">/</span>
              <span className="text-primary font-bold">
                {minute?.reservation?.title ?? "프로젝트 퀀텀 전략"}
              </span>
            </nav>
            <h2 className="text-3xl text-on-surface font-bold">
              {minute?.reservation?.title ?? "주간 경영진 정례 회의"}
            </h2>
            <div className="flex gap-6 mt-3 text-sm text-on-surface-variant font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary/60">calendar_today</span>
                <span>
                  {minute?.reservation?.start_at 
                    ? new Date(minute.reservation.start_at).toLocaleString("ko-KR") 
                    : "2023년 10월 24일 • 오전 10:00"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0 pb-8">
          <div className="col-span-8 flex flex-col gap-8 min-h-0">
            <div className="flex-1 bg-surface-container-lowest rounded-3xl border border-outline-variant/50 flex flex-col min-h-[300px] overflow-hidden">
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {transcripts.map((t) => (
                  <div key={t.id} className="flex gap-5 group">
                    <div className={`h-10 w-10 rounded-2xl ${t.avatarBg} flex-shrink-0 flex items-center justify-center font-bold text-sm`}>
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
              </div>
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-8 min-h-0 pr-1">
            <div className="p-7 bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-sm flex-shrink-0">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> 조치 사항
              </h4>
              <ul className="space-y-5">
                {todoList.map((todo) => (
                  <li key={todo.id} className="flex items-start gap-4">
                    <input 
                      checked={todo.done} 
                      onChange={() => handleToggleTodo(todo.id)}
                      className="rounded border-outline-variant text-primary h-5 w-5 cursor-pointer" 
                      type="checkbox" 
                    />
                    <div className="flex-1">
                      <p className={`text-base text-on-surface ${todo.done ? "line-through opacity-40" : ""}`}>
                        {todo.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-7 bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-sm flex-shrink-0 mt-8">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> 회의록 본문 및 편집
              </h4>
              {minute && (
                <MinuteViewer
                  minute={minute}
                  currentUserId={currentUserId}
                  token={accessToken}
                  companyId={companyId}
                  onUpdated={setMinute}
                  onDeleted={() => window.history.back()}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

