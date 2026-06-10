"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { minutesApi } from "@/lib/api/minutes";
import { aiApi } from "@/lib/api/ai";
import { actionItemsApi } from "@/lib/api/actionItems";
import { createClient } from "@/lib/supabase/client";
import type { Minute, ApiAiSummary, ApiActionItem } from "@/types";
import MinuteViewer from "@/components/minutes/MinuteViewer";

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export default function MinuteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [companyId] = useState(() => getStored("meetinghubCompanyId"));
  const [currentUserId, setCurrentUserId] = useState("");
  
  const [minute, setMinute] = useState<Minute | null>(null);
  const [aiSummary, setAiSummary] = useState<ApiAiSummary | null>(null);
  const [actionItems, setActionItems] = useState<ApiActionItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    if (!accessToken || !companyId) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? "");

      const [m, summary, items] = await Promise.all([
        minutesApi.get(id, accessToken, companyId),
        aiApi.getSummary(id, accessToken, companyId).catch(() => null),
        actionItemsApi.listByMinute(id, accessToken, companyId).catch(() => []),
      ]);
      
      setMinute(m);
      setAiSummary(summary);
      setActionItems(items);
    } catch (e: any) {
      setError(e.message || "데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, accessToken, companyId]);

  const handleRunAiAnalysis = async () => {
    if (!accessToken || !companyId || analyzing) return;
    setAnalyzing(true);
    try {
      // 1. 요약/핵심/결정/위험 분석 실행
      await aiApi.analyze(id, accessToken, companyId);
      // 2. Action Items 자동 추출
      await aiApi.generateActionItems(id, accessToken, companyId);
      
      // 다시 로드
      await loadData();
    } catch (e: any) {
      alert("AI 분석 중 오류가 발생했습니다: " + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleTodo = async (itemId: string, currentStatus: string) => {
    if (!accessToken || !companyId) return;
    
    // Optimistic update
    setActionItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, status: currentStatus === "DONE" ? "TODO" : "DONE" } 
        : item
    ));

    try {
      await actionItemsApi.toggleStatus(itemId, currentStatus, accessToken, companyId);
    } catch (e) {
      // Revert on failure
      setActionItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: currentStatus as any } 
          : item
      ));
      alert("상태 변경에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-medium animate-pulse">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <p className="rounded-2xl bg-error-container px-6 py-4 text-sm font-medium text-on-error-container border border-error-container/50 shadow-sm">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-background text-on-surface overflow-hidden relative font-sans">
      {/* SideNavBar is defined in layout, we just provide the main content area here */}
      
      <main className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar px-8 pt-8 pb-0">
        {/* Metadata Row */}
        <div className="flex justify-between items-end mb-8 flex-shrink-0">
          <div>
            <nav className="flex gap-2 text-on-surface-variant text-xs font-semibold mb-2">
              <Link href="/minutes" className="hover:text-primary transition-colors">회의록</Link>
              <span className="opacity-40">/</span>
              <span className="text-primary font-bold">
                {minute?.reservation?.title ?? "회의 상세"}
              </span>
            </nav>
            <h2 className="text-3xl text-on-surface font-bold font-headline-lg tracking-tight">
              {minute?.reservation?.title ?? "회의 상세 내용"}
            </h2>
            <div className="flex gap-6 mt-3 text-sm text-on-surface-variant font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary/60">calendar_today</span>
                <span>
                  {minute?.reservation?.start_at 
                    ? new Date(minute.reservation.start_at).toLocaleString("ko-KR") 
                    : "날짜 정보 없음"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary/60">person</span>
                <span>작성자: {minute?.author_name ?? minute?.created_by.slice(0, 8)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRunAiAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <span className={`material-symbols-outlined text-[18px] ${analyzing ? 'animate-spin' : ''}`}>
                {analyzing ? 'sync' : 'auto_awesome'}
              </span>
              {analyzing ? 'AI 분석 진행 중...' : (aiSummary ? 'AI 재분석 실행' : 'AI 분석 실행')}
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0 pb-8">
          
          {/* Left Column: Transcript & Editor */}
          <div className="col-span-8 flex flex-col gap-8 min-h-0">
            
            {/* Transcript Area */}
            <div className="flex-1 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 flex flex-col min-h-0 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-secondary-container/5 pointer-events-none"></div>
              
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-white/50 backdrop-blur-sm z-10">
                <h3 className="font-headline-md text-lg font-bold flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-primary bg-primary-container/30 p-2 rounded-xl">notes</span>
                  회의록 원문
                </h3>
              </div>
              
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar z-10">
                <div className="flex gap-5 group">
                  <div className="h-10 w-10 rounded-2xl bg-primary-container text-on-primary-container flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-sm">
                    {(minute?.author_name ?? "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-on-surface">{minute?.author_name ?? "작성자"}</span>
                      <span className="text-on-surface-variant/60 text-xs font-semibold">
                        {new Date(minute?.created_at || Date.now()).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-base text-on-surface-variant leading-relaxed p-5 bg-surface rounded-2xl rounded-tl-none border border-outline-variant/20 whitespace-pre-wrap">
                      {minute?.content || "내용이 없습니다."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Area (MinuteViewer handles edit mode) */}
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm p-6 relative overflow-hidden">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant/70 mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> 편집
              </h3>
              {minute && (
                <MinuteViewer
                  minute={minute}
                  currentUserId={currentUserId}
                  token={accessToken}
                  companyId={companyId}
                  onUpdated={setMinute}
                  onDeleted={() => router.push("/minutes")}
                />
              )}
            </div>

          </div>
          
          {/* Right Column: AI Insights */}
          <div className="col-span-4 flex flex-col gap-8 min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-4">
            
            {/* AI Summary Card */}
            {aiSummary ? (
              <div className="p-7 bg-surface-container-lowest rounded-3xl border border-primary-container/50 relative overflow-hidden group shadow-md">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl group-hover:bg-primary-container/30 transition-all duration-500"></div>
                <div className="relative z-10">
                  <h4 className="font-headline-md text-xl font-bold text-primary mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    AI 핵심 요약
                  </h4>
                  <p className="font-body-md text-base text-on-surface-variant leading-relaxed mb-6">
                    {aiSummary.summary}
                  </p>
                  
                  {aiSummary.key_points && aiSummary.key_points.length > 0 && (
                    <div className="mb-5">
                      <h5 className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest mb-3">핵심 논의 사항</h5>
                      <ul className="space-y-2">
                        {aiSummary.key_points.map((pt, i) => (
                          <li key={i} className="flex gap-2 text-sm text-on-surface">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiSummary.decisions && aiSummary.decisions.length > 0 && (
                    <div className="mb-5">
                      <h5 className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest mb-3">결정 사항</h5>
                      <ul className="space-y-2">
                        {aiSummary.decisions.map((dec, i) => (
                          <li key={i} className="flex gap-2 text-sm text-on-surface">
                            <span className="text-secondary mt-0.5 material-symbols-outlined text-[16px]">check_circle</span>
                            <span>{dec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiSummary.risks && aiSummary.risks.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest mb-3">위험 요소</h5>
                      <ul className="space-y-2">
                        {aiSummary.risks.map((risk, i) => (
                          <li key={i} className="flex gap-2 text-sm text-on-surface">
                            <span className="text-error mt-0.5 material-symbols-outlined text-[16px]">warning</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 bg-surface-container-lowest/50 rounded-3xl border border-dashed border-outline-variant/50 text-center flex flex-col items-center justify-center min-h-[200px]">
                <span className="material-symbols-outlined text-4xl text-primary/30 mb-4">psychology</span>
                <p className="text-on-surface-variant font-medium">아직 AI 분석 결과가 없습니다.</p>
                <p className="text-xs text-on-surface-variant/60 mt-2">우측 상단의 AI 분석 버튼을 눌러보세요.</p>
              </div>
            )}

            {/* Action Items */}
            <div className="p-7 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm flex-shrink-0">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span> 조치 사항 (Action Items)
                </h4>
                <span className="text-xs font-bold bg-secondary-container/30 text-secondary px-2 py-1 rounded-md">
                  {actionItems.length}개
                </span>
              </div>
              
              {actionItems.length === 0 ? (
                <p className="text-sm text-on-surface-variant/60 text-center py-4">조치 사항이 없습니다.</p>
              ) : (
                <ul className="space-y-4">
                  {actionItems.map((item) => {
                    const isDone = item.status === "DONE";
                    return (
                      <li key={item.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-surface transition-colors group">
                        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                          <input 
                            checked={isDone} 
                            onChange={() => handleToggleTodo(item.id, item.status)}
                            className="rounded-md border-outline-variant/50 text-secondary focus:ring-secondary/20 h-5 w-5 cursor-pointer transition-colors" 
                            type="checkbox" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium text-on-surface transition-all ${isDone ? "line-through opacity-40" : ""}`}>
                            {item.task}
                          </p>
                          {(item.assignee_name || item.due_date) && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {item.assignee_name && (
                                <span className="text-[11px] font-semibold text-on-surface-variant/70 flex items-center gap-1 bg-surface-container-high px-1.5 py-0.5 rounded">
                                  <span className="material-symbols-outlined text-[12px]">person</span> {item.assignee_name}
                                </span>
                              )}
                              {item.due_date && (
                                <span className={`text-[11px] font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded ${isDone ? 'bg-surface-container-high text-on-surface-variant/50' : 'bg-error-container/30 text-error'}`}>
                                  <span className="material-symbols-outlined text-[12px]">event</span> {item.due_date}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
