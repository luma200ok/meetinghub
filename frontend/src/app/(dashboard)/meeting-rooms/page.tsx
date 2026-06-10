"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { minutesApi } from "@/lib/api/minutes";
import { createClient } from "@/lib/supabase/client";
import type { ApiReservation, Minute } from "@/types";
import MinuteEditor from "@/components/minutes/MinuteEditor";
import MinuteViewer from "@/components/minutes/MinuteViewer";

type MeetingRoom = {
  id: string;
  name: string;
  location?: string | null;
  capacity?: number | null;
};

type Reservation = {
  id: string;
  room_id: string;
  title: string;
  start_at: string;
  end_at: string;
  organizer_id: string;
  status: "RESERVED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  attendees?: Array<{ user_id: string; name?: string | null }>;
};

// LocalStorage 도우미
function getStored(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

// 날짜 유틸리티 함수
function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const day = baseDate.getDay();
  // 일요일이 0이므로, 월요일(1) 기준으로 맞춤. 일요일이면 -6, 월요일이면 0, 화요일이면 -1 ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diffToMonday);
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function MeetingRoomsPage() {
  const [accessToken] = useState(() => getStored("meetinghubAccessToken"));
  const [companyId] = useState(() => getStored("meetinghubCompanyId"));
  const [currentUserId, setCurrentUserId] = useState("");

  // 회의록 모달 상태
  const [minuteModal, setMinuteModal] = useState<{
    open: boolean;
    reservation: ApiReservation | null;
    minute: Minute | null;
    loading: boolean;
    error: string;
  }>({ open: false, reservation: null, minute: null, loading: false, error: "" });

  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 주간 캘린더 기준 날짜 (기본 오늘)
  const [currentWeekBase, setCurrentWeekBase] = useState(() => new Date());
  const weekDates = getWeekDates(currentWeekBase);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDate, setModalDate] = useState(() => formatDateString(new Date()));
  const [modalStartTime, setModalStartTime] = useState("10:00");
  const [modalEndTime, setModalEndTime] = useState("11:00");

  // 조직도 및 인원 선택 상태
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  // 회의실 선택 상태 ("new" 이면 신규 생성)
  const [modalRoomId, setModalRoomId] = useState<string>("");
  const [modalNewRoomName, setModalNewRoomName] = useState("");

  // AI 추천 문구
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiSuggestedRoomId, setAiSuggestedRoomId] = useState<string | null>(null);

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!accessToken || !companyId) return;
    setError("");
    setIsLoading(true);
    try {
      // 회의실 목록 조회
      const roomList = await api.get<MeetingRoom[]>(ENDPOINTS.MEETING_ROOMS, {
        headers: authHeaders(accessToken, companyId),
      });
      setRooms(roomList);

      // 예약 목록 조회
      const resList = await api.get<Reservation[]>(ENDPOINTS.RESERVATIONS, {
        headers: authHeaders(accessToken, companyId),
      });
      setReservations(resList);

      // 조직 멤버 목록 조회
      try {
        const memberList = await api.get<any[]>(ENDPOINTS.MEMBERS, {
          headers: authHeaders(accessToken, companyId),
        });
        setOrgMembers(memberList);
      } catch (err) {
        console.error("조직 정보를 불러오는데 실패했습니다:", err);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, companyId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // 현재 로그인 사용자 id — 회의록 작성자 본인 판별(수정/삭제 버튼)에 사용
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? ""))
      .catch(() => setCurrentUserId(""));
  }, []);


  // AI 회의실 추천 반응 로직 (참석 인원 수 기반)
  useEffect(() => {
    const size = selectedUserIds.length;
    if (size > 0) {
      // rooms에서 정렬하여 가장 수용 능력이 작으면서 size를 만족하는 방 찾기
      const sortedRooms = [...rooms].sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
      const recommended = sortedRooms.find((r) => (r.capacity || 0) >= size);

      if (recommended) {
        setAiSuggestedRoomId(recommended.id);
        setAiSuggestion(
          `선택하신 ${size}명의 인원에게는 최적의 수용 환경을 제공하는 [${recommended.name}]이(가) 가장 적합합니다.`
        );
      } else {
        setAiSuggestedRoomId(null);
        setAiSuggestion(
          `등록된 회의실 중 ${size}명을 수용할 수 있는 공간이 없습니다. 대형 델타 홀을 별도 예약하거나 회의 분할을 권장합니다.`
        );
      }
    } else {
      setAiSuggestion(null);
      setAiSuggestedRoomId(null);
    }
  }, [selectedUserIds, rooms]);

  // 예약 신청
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken || !companyId) {
      setError("로그인 정보 또는 회사 ID가 없습니다. 다시 로그인해 주세요.");
      return;
    }

    const isNewRoom = modalRoomId === "new";
    if (!modalTitle || !modalRoomId || !modalDate || !modalStartTime || !modalEndTime) {
      setError("필수 입력 필드를 모두 작성해 주세요.");
      return;
    }
    if (isNewRoom && !modalNewRoomName.trim()) {
      setError("새 회의실 이름을 입력해 주세요.");
      return;
    }
    if (modalStartTime >= modalEndTime) {
      setError("시작 시각은 종료 시각보다 빨라야 합니다.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);

    const start_at = `${modalDate}T${modalStartTime}:00+09:00`;
    const end_at   = `${modalDate}T${modalEndTime}:00+09:00`;

    try {
      let roomId = modalRoomId;

      if (isNewRoom) {
        const newRoom = await api.post<MeetingRoom>(
          ENDPOINTS.MEETING_ROOMS,
          { name: modalNewRoomName.trim() },
          { headers: authHeaders(accessToken, companyId) }
        );
        roomId = newRoom.id;
      }

      await api.post<Reservation>(
        ENDPOINTS.RESERVATIONS,
        { room_id: roomId, title: modalTitle, start_at, end_at, user_ids: selectedUserIds },
        { headers: authHeaders(accessToken, companyId) }
      );

      setSuccessMsg("예약이 성공적으로 확정되었습니다!");
      setIsModalOpen(false);
      setModalTitle("");
      setModalRoomId("");
      setModalNewRoomName("");
      setSelectedUserIds([]);
      setMemberSearch("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "예약 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 예약 취소
  const handleCancelReservation = async (id: string) => {
    if (!accessToken || !companyId) return;
    if (!confirm("정말 이 예약을 취소하시겠습니까?")) return;

    setError("");
    setSuccessMsg("");
    try {
      await api.delete(`${ENDPOINTS.RESERVATIONS}/${id}`, {
        headers: authHeaders(accessToken, companyId),
      });
      setSuccessMsg("예약이 취소되었습니다.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "예약 취소에 실패했습니다.");
    }
  };

  // 예약 블록 클릭 → 회의록 모달 열기. 기존 회의록이 있으면 조회해 viewer로, 없으면 editor로 분기.
  const handleOpenMinuteModal = async (resId: string) => {
    const res = reservations.find((r) => r.id === resId);
    if (!res) return;
    setMinuteModal({ open: true, reservation: res as unknown as ApiReservation, minute: null, loading: true, error: "" });
    try {
      const minute = await minutesApi.getByReservation(resId, accessToken, companyId);
      setMinuteModal((prev) => (prev.open ? { ...prev, minute, loading: false } : prev));
    } catch (e) {
      setMinuteModal((prev) =>
        prev.open
          ? { ...prev, loading: false, error: e instanceof Error ? e.message : "회의록을 불러오지 못했습니다." }
          : prev,
      );
    }
  };

  // 주 이동
  const handlePrevWeek = () => {
    setCurrentWeekBase((prev) => {
      const nextDate = new Date(prev);
      nextDate.setDate(prev.getDate() - 7);
      return nextDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekBase((prev) => {
      const nextDate = new Date(prev);
      nextDate.setDate(prev.getDate() + 7);
      return nextDate;
    });
  };

  const handleToday = () => {
    setCurrentWeekBase(new Date());
  };

  // 오늘 날짜로 이동 + 캘린더 섹션으로 스크롤
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleTodayWithScroll = () => {
    setCurrentWeekBase(new Date());
    setTimeout(() => {
      calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // 회의실 실시간 상태 판별 (사용 중 / 승인 대기 / 예약 가능)
  const getRoomStatus = (roomId: string): "IN_USE" | "RESERVED" | "AVAILABLE" => {
    const now = new Date();
    const activeReservations = reservations.filter(
      (res) => res.room_id === roomId && res.status !== "CANCELLED" && res.status !== "DONE"
    );

    // 현재 진행 중인 예약이 있으면 "사용 중"
    const inUse = activeReservations.find((res) => {
      const start = new Date(res.start_at);
      const end = new Date(res.end_at);
      return now >= start && now <= end;
    });
    if (inUse) return "IN_USE";

    // 미래에 예약(RESERVED 상태)이 존재하면 "승인 대기"
    const upcoming = activeReservations.find((res) => {
      return res.status === "RESERVED" && new Date(res.start_at) > now;
    });
    if (upcoming) return "RESERVED";

    return "AVAILABLE";
  };

  // 캘린더 타임라인 렌더링 범위: 09:00 ~ 21:00 (12시간)
  const CALENDAR_START_HOUR = 9;
  const CALENDAR_END_HOUR = 21;
  const CALENDAR_TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
  const CALENDAR_HEIGHT = 600; // px
  const HOUR_HEIGHT = CALENDAR_HEIGHT / CALENDAR_TOTAL_HOURS; // 1시간당 높이

  // 예약 블록의 y축 위치 및 높이 계산
  const getReservationBlockStyle = (res: Reservation) => {
    const start = new Date(res.start_at);
    const end = new Date(res.end_at);

    const startHours = start.getHours() + start.getMinutes() / 60;
    const endHours = end.getHours() + end.getMinutes() / 60;

    // 시작 시각이 렌더링 범위 이전이거나 종료 시각이 이후인 경우 보정
    const visibleStart = Math.max(startHours, CALENDAR_START_HOUR);
    const visibleEnd = Math.min(endHours, CALENDAR_END_HOUR);

    if (visibleStart >= visibleEnd) {
      return { display: "none" };
    }

    const top = (visibleStart - CALENDAR_START_HOUR) * HOUR_HEIGHT;
    const height = (visibleEnd - visibleStart) * HOUR_HEIGHT;

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  return (
    <>
      {/* 구글 Hanken Grotesk 폰트 및 Material Symbols 불러오기 */}
      <link
        href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&amp;display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
        rel="stylesheet"
      />

      <main className="min-h-screen flex-1 bg-slate-50 px-6 py-8 text-on-surface">
        {/* 뒷배경 AI 스파클 그라데이션 장식 */}
        <div className="fixed top-0 right-0 w-[50vw] h-[50vw] -mr-32 -mt-32 bg-primary/5 rounded-full blur-[140px] -z-10"></div>
        <div className="fixed bottom-0 left-0 w-[40vw] h-[40vw] -ml-32 -mb-32 bg-secondary-container/20 rounded-full blur-[120px] -z-10"></div>

        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          {/* 에러 및 성공 알림 */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex justify-between items-center animate-in fade-in">
              <span>{error}</span>
              <button onClick={() => setError("")} className="font-bold ml-4 text-red-500 hover:text-red-800">닫기</button>
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex justify-between items-center animate-in fade-in">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg("")} className="font-bold ml-4 text-emerald-500 hover:text-emerald-800">닫기</button>
            </div>
          )}

          {(!accessToken || !companyId) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
              🔑 회의실 및 예약 정보를 로드하려면 대시보드 로그인이 필요합니다. (LocalStorage 토큰 및 회사 ID 미감지)
            </div>
          )}

          {/* 헤더 섹션 - Tasks 페이지 스타일 */}
          <div className="flex items-start justify-between">
            {/* 좌측: 소제목 + 대제목 */}
            <div>
              <p className="text-sm font-semibold text-primary mb-1">Meeting Rooms</p>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                회의실 예약 및 일정 관리
              </h1>
            </div>

            {/* 우측: 로딩 상태 버튼 */}
            <button
              onClick={() => void loadData()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all disabled:opacity-60"
            >
              <span
                className={`material-symbols-outlined text-base ${isLoading ? "animate-spin" : ""}`}
              >
                refresh
              </span>
              {isLoading ? "불러오는 중" : "새로고침"}
            </button>
          </div>

          {/* 헤더 아래 구분선 */}
          <hr className="border-slate-200" />

          {/* 서브 컨트롤 바: 캘린더 이동 & 예약 버튼 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              <button
                onClick={handlePrevWeek}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="이전 주"
              >
                <span className="material-symbols-outlined text-sm block">chevron_left</span>
              </button>
              <div className="flex items-center border-r border-slate-200 pr-1 mr-1">
                <span className="material-symbols-outlined text-slate-400 text-sm pl-2 pointer-events-none">calendar_month</span>
                <input
                  type="date"
                  value={formatDateString(currentWeekBase)}
                  onChange={(e) => {
                    if (e.target.value) {
                      setCurrentWeekBase(new Date(e.target.value));
                    }
                  }}
                  className="bg-transparent border-0 px-2 py-1 text-xs font-semibold text-slate-700 outline-none w-28 focus:ring-0 cursor-pointer"
                />
              </div>
              <button
                onClick={handleToday}
                className="px-4 py-1.5 hover:bg-slate-100 text-xs font-semibold rounded-lg text-slate-700 transition-colors"
              >
                오늘
              </button>
              <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="다음 주"
              >
                <span className="material-symbols-outlined text-sm block">chevron_right</span>
              </button>
            </div>

            <button
              onClick={() => { setIsModalOpen(true); setModalRoomId(""); setModalNewRoomName(""); setError(""); }}
              className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold text-sm hover:opacity-90 active:scale-95 shadow-md shadow-primary/20 transition-all cursor-pointer ml-auto"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              새로운 예약
            </button>
          </div>

          {/* 메인 Bento 레이아웃 */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* 좌측: 캘린더 컴포넌트 (8컬럼) */}
            <div ref={calendarRef} className="col-span-12 lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 border-b border-slate-200 text-center py-4 bg-slate-50">
                {weekDates.map((date, index) => {
                  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
                  const isToday = formatDateString(date) === formatDateString(new Date());
                  return (
                    <div key={index} className="flex flex-col items-center justify-center">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {dayNames[date.getDay()]}
                      </span>
                      <span
                        className={`text-sm font-bold mt-1 px-2.5 py-0.5 rounded-full ${
                          isToday
                            ? "bg-primary text-white shadow-sm"
                            : "text-slate-800"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 일정 격자판 */}
              <div className="grid grid-cols-7 relative" style={{ height: `${CALENDAR_HEIGHT}px` }}>
                {/* 배경 가이드라인 (1시간 간격 수평 라인) */}
                <div className="absolute inset-0 grid grid-rows-12 pointer-events-none">
                  {Array.from({ length: CALENDAR_TOTAL_HOURS }).map((_, i) => (
                    <div
                      key={i}
                      className="border-b border-slate-100 w-full h-full flex items-start pl-1 pt-0.5"
                    >
                      <span className="text-[9px] text-slate-300 font-medium">
                        {CALENDAR_START_HOUR + i}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* 요일별 세로 열 */}
                {weekDates.map((date, colIndex) => {
                  const dateStr = formatDateString(date);
                  // 해당 날짜의 예약 리스트 필터링
                  const dayReservations = reservations.filter((res) => {
                    if (res.status === "CANCELLED") return false;
                    const resStartStr = res.start_at.substring(0, 10);
                    return resStartStr === dateStr;
                  });

                  return (
                    <div
                      key={colIndex}
                      className={`relative h-full ${
                        colIndex !== 6 ? "border-r border-slate-100" : ""
                      } hover:bg-slate-50/50 transition-colors`}
                    >
                      {/* 예약 블록 배치 */}
                      {dayReservations.map((res) => {
                        const style = getReservationBlockStyle(res);
                        const room = rooms.find((r) => r.id === res.room_id);
                        
                        // 임의의 컬러 적용 (Alpha: primary, Beta: secondary, Gamma: tertiary)
                        let blockBg = "bg-primary/10 border-primary text-primary";
                        if (room?.name.includes("Beta") || room?.name.includes("베타")) {
                          blockBg = "bg-secondary/10 border-secondary text-secondary";
                        } else if (room?.name.includes("Gamma") || room?.name.includes("감마")) {
                          blockBg = "bg-slate-600/10 border-slate-600 text-slate-700";
                        }

                        // 시간 변환
                        const startObj = new Date(res.start_at);
                        const endObj = new Date(res.end_at);
                        const timeRangeStr = `${String(startObj.getHours()).padStart(2, "0")}:${String(
                          startObj.getMinutes()
                        ).padStart(2, "0")} - ${String(endObj.getHours()).padStart(2, "0")}:${String(
                          endObj.getMinutes()
                        ).padStart(2, "0")}`;

                        return (
                          <div
                            key={res.id}
                            style={style}
                            onClick={() => void handleOpenMinuteModal(res.id)}
                            className={`absolute left-1 right-1 border-l-4 rounded-xl px-2 py-1.5 cursor-pointer hover:scale-[1.02] hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between group ${blockBg}`}
                            title="클릭하여 회의록 작성"
                          >
                            <div>
                              <p className="font-bold text-[11px] leading-tight truncate">
                                {res.title}
                              </p>
                              <p className="text-[9px] font-medium opacity-80 mt-0.5 truncate">
                                {room?.name ?? "회의실"} • {timeRangeStr}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleCancelReservation(res.id);
                              }}
                              className="material-symbols-outlined text-[10px] text-red-500 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                              title="예약 취소"
                            >
                              delete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* 우측: 회의실 정보 & AI 효율성 & 도면 (4컬럼) */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              
              {/* 회의실 목록 및 실시간 예약 현황 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                    회의실 예약 현황
                  </h2>
                  <span
                    onClick={() => void loadData()}
                    className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-all text-lg"
                    title="새로고침"
                  >
                    refresh
                  </span>
                </div>

                <div className="space-y-3.5">
                  {rooms.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">등록된 회의실이 없습니다.</p>
                  ) : (
                    rooms.map((room) => {
                      const roomStatus = getRoomStatus(room.id);
                      const isUse = roomStatus === "IN_USE";
                      const isPending = roomStatus === "RESERVED";

                      // 상태별 아이콘 배경 색상
                      const iconBg = isUse
                        ? "bg-red-50 text-red-600"
                        : isPending
                        ? "bg-amber-50 text-amber-600"
                        : "bg-primary/10 text-primary";

                      // 상태 뱃지 스타일
                      const badgeStyle = isUse
                        ? "bg-red-100 text-red-700"
                        : isPending
                        ? "bg-amber-100 text-amber-700"
                        : "bg-primary-container/20 text-primary";

                      // 상태 텍스트
                      const statusLabel = isUse ? "사용 중" : isPending ? "승인 대기" : "예약 가능";

                      return (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                              <span className="material-symbols-outlined text-xl">meeting_room</span>
                            </div>
                            <div>
                              <p className="font-bold text-xs text-slate-800">{room.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {room.location || "위치 미정"} • 수용 {room.capacity ?? "0"}인
                              </p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wider ${badgeStyle}`}>
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* AI 효율성 인사이트 */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <span className="material-symbols-outlined text-[100px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    analytics
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-lg animate-pulse">auto_awesome</span>
                  <h3 className="text-xs font-extrabold text-primary tracking-wider uppercase">AI 효율성 인사이트</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed relative z-10">
                  회의실 점유율 빅데이터 분석 결과, 목요일 오후 시간대에 예약 충돌 빈도가 78% 증가하는 것으로 감지되었습니다. 
                  해당 시간대의 단기 스탠딩 회의는 감마룸으로 예약을 분산하시는 것을 권장합니다.
                </p>
                <button
                  onClick={handleTodayWithScroll}
                  className="mt-4 text-primary font-bold text-[10px] flex items-center gap-1.5 hover:translate-x-1 transition-transform relative z-10"
                >
                  오늘 일정 확인하기
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>

              {/* 층별 도면 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">층별 도면</h3>
                <div className="aspect-square bg-slate-50 rounded-xl border border-slate-200/50 flex items-center justify-center relative overflow-hidden">
                  <div className="w-[85%] h-[85%] border border-slate-200 rounded-lg relative bg-white/60">
                    
                    {/* 미니 맵 구획 */}
                    {rooms.map((room, idx) => {
                      const isUse = getRoomStatus(room.id) === "IN_USE";
                      let positionClass = "";
                      let bgClass = "bg-primary/5 border-primary/20";
                      
                      if (isUse) {
                        bgClass = "bg-red-500/10 border-red-500/30 text-red-700";
                      }

                      if (idx === 0) {
                        positionClass = "absolute top-0 left-0 w-1/2 h-1/2 border-r border-b border-slate-100 rounded-tl-lg";
                      } else if (idx === 1) {
                        positionClass = "absolute top-0 right-0 w-1/2 h-1/3 border-b border-slate-100 rounded-tr-lg";
                      } else if (idx === 2) {
                        positionClass = "absolute bottom-0 left-0 w-1/3 h-1/2 border-r border-t border-slate-100 rounded-bl-lg";
                      } else {
                        positionClass = "absolute bottom-0 right-0 w-1/2 h-1/2 border-t border-l border-slate-100 rounded-br-lg";
                      }

                      return (
                        <div
                          key={room.id}
                          className={`${positionClass} ${bgClass} flex items-center justify-center p-1 transition-all hover:bg-slate-100/80 cursor-pointer`}
                          title={`${room.name} (${isUse ? "사용중" : "예약가능"})`}
                        >
                          <span className="text-[9px] font-bold truncate opacity-80">{room.name}</span>
                        </div>
                      );
                    })}

                    <div className="absolute bottom-0 right-0 w-1/2 h-1/3 border-t border-l border-slate-100 bg-slate-100/30 flex items-center justify-center rounded-br-lg pointer-events-none">
                      <span className="text-[8px] font-bold text-slate-400">CAFE</span>
                    </div>

                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>
      </main>

      {/* 공간 예약 모달 오버레이 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

            {/* 모달 헤더 */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-xl">add_box</span>
                회의 공간 예약하기
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="material-symbols-outlined text-slate-400 hover:bg-slate-200 rounded-full p-2 transition-colors text-lg cursor-pointer"
              >
                close
              </button>
            </div>

            {/* 모달 폼 — 뷰포트보다 길면 스크롤(하단 버튼 잘림 방지) */}
            <form onSubmit={handleCreateReservation} className="p-8 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                
                {/* 회의 제목 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 px-1">회의 제목</label>
                  <input
                    type="text"
                    required
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="예: 3분기 디자인 스프린트 워크숍"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 날짜 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 px-1">날짜</label>
                    <input
                      type="date"
                      required
                      value={modalDate}
                      onChange={(e) => setModalDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-primary/10 outline-none text-sm text-slate-700 transition-all"
                    />
                  </div>

                  {/* 회의실 선택 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 px-1">회의실</label>
                    <select
                      required
                      value={modalRoomId}
                      onChange={(e) => {
                        setModalRoomId(e.target.value);
                        if (e.target.value !== "new") setModalNewRoomName("");
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm text-slate-800 transition-all"
                    >
                      <option value="" disabled>회의실 선택</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}{r.capacity ? ` (${r.capacity}인)` : ""}
                        </option>
                      ))}
                      <option value="new">+ 새 회의실 추가</option>
                    </select>
                    {modalRoomId === "new" && (
                      <input
                        type="text"
                        value={modalNewRoomName}
                        onChange={(e) => setModalNewRoomName(e.target.value)}
                        placeholder="새 회의실 이름 입력"
                        className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all"
                      />
                    )}
                  </div>
                </div>

                {/* 참석자 선택 (조직도 연동 및 검색) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 px-1">
                    <label className="block text-xs font-semibold text-slate-500">참석자 선택</label>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      선택됨: {selectedUserIds.length}명
                    </span>
                  </div>
                  
                  {/* 검색 필드 */}
                  <div className="relative mb-2">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="참석자 이름 또는 이메일 검색..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/30 focus:ring-4 focus:ring-primary/5 outline-none text-xs text-slate-800"
                    />
                  </div>

                  {/* 멤버 목록 스크롤러 */}
                  <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50 p-2 custom-scrollbar">
                    {orgMembers
                      .filter((member) => {
                        const name = member.user?.name || "";
                        const email = member.user?.email || "";
                        return (
                          name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          email.toLowerCase().includes(memberSearch.toLowerCase())
                        );
                      })
                      .map((member) => {
                        const uId = member.user_id || member.user?.id;
                        if (!uId) return null;
                        const isChecked = selectedUserIds.includes(uId);

                        return (
                          <label
                            key={member.id}
                            className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds([...selectedUserIds, uId]);
                                } else {
                                  setSelectedUserIds(selectedUserIds.filter((id) => id !== uId));
                                }
                              }}
                              className="rounded border-slate-350 text-primary focus:ring-primary h-4 w-4"
                            />
                            <div className="flex-grow text-xs flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-slate-800">{member.user?.name || "이름 없음"}</span>
                                <span className="text-slate-450 ml-1.5">({member.user?.email || ""})</span>
                              </div>
                              {member.department?.name && (
                                <span className="text-[9px] bg-slate-205 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                  {member.department.name}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    {orgMembers.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-4">불러온 조직원 정보가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* AI 추천 박스 (선택된 인원 수에 따라 나타남) */}
                {aiSuggestion && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5">auto_awesome</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-primary mb-0.5">AI 공간 제안</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{aiSuggestion}</p>
                      {aiSuggestedRoomId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (aiSuggestedRoomId) setModalRoomId(aiSuggestedRoomId);
                          }}
                          className="mt-2 text-[10px] font-bold bg-primary text-white px-3 py-1 rounded-lg hover:opacity-90 active:scale-95 transition-all"
                        >
                          제안 공간 선택
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* 시작 시각 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 px-1">시작 시각</label>
                    <input
                      type="time"
                      required
                      value={modalStartTime}
                      onChange={(e) => setModalStartTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-primary/10 outline-none text-sm text-slate-700 transition-all"
                    />
                  </div>

                  {/* 종료 시각 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 px-1">종료 시각</label>
                    <input
                      type="time"
                      required
                      value={modalEndTime}
                      onChange={(e) => setModalEndTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-primary/10 outline-none text-sm text-slate-700 transition-all"
                    />
                  </div>
                </div>

              </div>

              {/* 모달 풋터 */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 font-bold text-xs text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 font-bold text-xs bg-primary text-white rounded-xl shadow-md shadow-primary/20 hover:shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "처리 중..." : "예약 확정"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 회의록 모달 */}
      {minuteModal.open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

            {/* 헤더 */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-xl">description</span>
                회의록
              </h2>
              <button
                onClick={() => setMinuteModal({ open: false, reservation: null, minute: null, loading: false, error: "" })}
                className="material-symbols-outlined text-slate-400 hover:bg-slate-200 rounded-full p-2 transition-colors text-lg cursor-pointer"
              >
                close
              </button>
            </div>

            <div className="overflow-y-auto p-8 space-y-6">
              {minuteModal.loading && (
                <p className="text-sm text-slate-400 text-center py-8">불러오는 중...</p>
              )}
              {minuteModal.error && (
                <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {minuteModal.error}
                </p>
              )}

              {minuteModal.reservation && (() => {
                const res = minuteModal.reservation;
                return (
                  <>
                    {/* 회의 정보 */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1">
                      <p className="font-bold text-slate-800">{res.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(res.start_at).toLocaleString("ko-KR")} –{" "}
                        {new Date(res.end_at).toLocaleString("ko-KR")}
                      </p>
                    </div>

                    {/* 회의록 작성 / 조회 — 로딩 중에는 editor를 띄우지 않음(빈 화면·중복 저장 방지) */}
                    {!minuteModal.loading &&
                      (minuteModal.minute ? (
                        <MinuteViewer
                          minute={minuteModal.minute}
                          currentUserId={currentUserId}
                          token={accessToken}
                          companyId={companyId}
                          onUpdated={(m) => setMinuteModal((prev) => ({ ...prev, minute: m }))}
                          onDeleted={() => setMinuteModal((prev) => ({ ...prev, minute: null }))}
                        />
                      ) : (
                        <MinuteEditor
                          reservationId={res.id}
                          token={accessToken}
                          companyId={companyId}
                          onSaved={(m) => setMinuteModal((prev) => ({ ...prev, minute: m }))}
                        />
                      ))}
                  </>
                );
              })()}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
