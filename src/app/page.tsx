export default function Home() {
  const meetings = [
    {
      title: "API 설계 회의",
      room: "회의실 A",
      owner: "김승현",
      time: "오늘 14:00",
      status: "예약",
    },
    {
      title: "MVP 발표 리허설",
      room: "회의실 B",
      owner: "정재봉",
      time: "내일 10:00",
      status: "예약",
    },
  ];

  const tasks = [
    { title: "API 설계", assignee: "김승현", status: "TODO", due: "6월 15일" },
    {
      title: "Dashboard 통계 카드 구성",
      assignee: "정재봉",
      status: "IN_PROGRESS",
      due: "6월 18일",
    },
    { title: "초대 메일 플로우 점검", assignee: "김관영", status: "BLOCKED", due: "미정" },
  ];

  const features = [
    "기업 생성",
    "초대 기반 조직도",
    "회의실 예약",
    "5분 전 알림",
    "회의록 작성",
    "AI 요약",
    "AI Action Item",
    "업무 관리",
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-[#17202a]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-[#12232e] px-5 py-6 text-white lg:block">
        <a className="text-xl font-bold" href="#">
          MeetingHub AI
        </a>
        <nav className="mt-8 grid gap-1 text-sm text-slate-200">
          {["Dashboard", "기업", "조직도", "회의실", "예약", "회의록", "업무"].map((item) => (
            <a className="rounded-lg px-3 py-3 hover:bg-white/10" href="#" key={item}>
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <section className="mx-auto max-w-7xl px-5 py-6 lg:ml-64 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1f7a8c]">B2B SaaS 협업 플랫폼</p>
            <h1 className="mt-2 text-3xl font-bold">MeetingHub AI</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              기업별 조직도, 회의실 예약, 회의록 관리, AI 회의 분석 및 업무 관리를
              하나의 멀티테넌트 워크스페이스에서 제공합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <a className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-bold text-slate-900" href="/auth/login">
              로그인
            </a>
            <a className="rounded-lg bg-[#1f7a8c] px-4 py-2 text-sm font-bold text-white" href="/auth/register">
              회원가입
            </a>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">오늘 회의</p>
            <strong className="mt-2 block text-3xl">2</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">미완료 업무</p>
            <strong className="mt-2 block text-3xl">3</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">AI 분석 완료</p>
            <strong className="mt-2 block text-3xl">1</strong>
          </article>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">오늘 회의</h2>
              <span className="text-sm font-semibold text-[#1f7a8c]">회의실 중복 예약 검증</span>
            </div>
            <div className="grid gap-3">
              {meetings.map((meeting) => (
                <article
                  className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                  key={meeting.title}
                >
                  <div>
                    <strong>{meeting.title}</strong>
                    <p className="mt-1 text-sm text-slate-500">
                      {meeting.room} · {meeting.owner}
                    </p>
                  </div>
                  <time className="text-sm font-semibold text-slate-700">{meeting.time}</time>
                  <span className="w-fit rounded-full bg-[#edf3f5] px-3 py-1 text-xs font-bold text-[#145566]">
                    {meeting.status}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">내 업무</h2>
              <span className="text-sm font-semibold text-[#1f7a8c]">AI Action Item</span>
            </div>
            <div className="grid gap-3">
              {tasks.map((task) => (
                <article className="rounded-lg border border-slate-200 bg-white p-4" key={task.title}>
                  <div className="flex items-start justify-between gap-3">
                    <strong>{task.title}</strong>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {task.assignee} · {task.due}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold">MVP 범위</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {features.map((feature) => (
              <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700" key={feature}>
                {feature}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            Flask 백엔드 골격은 <code>backend/</code>에 보존했고, 데이터베이스 스키마는{" "}
            <code>backend/sql/schema.sql</code> 및 <code>supabase/schema.sql</code>에서 확인할 수 있습니다.
          </p>
        </section>
      </section>
    </main>
  );
}
