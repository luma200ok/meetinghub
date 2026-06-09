"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

type CompanyResponse = {
  company: { id: string; name: string };
};

type InviteAcceptResponse = {
  company_id: string;
  session?: { access_token?: string | null } | null;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"select" | "create" | "invite">("select");
  
  // 기업 생성 상태
  const [companyName, setCompanyName] = useState("");
  // 초대 수락 상태
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 마우스 이동 시 배경 발광 구체 움직임 효과
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const glowElements = document.querySelectorAll(".pastel-glow") as NodeListOf<HTMLElement>;
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      glowElements.forEach((el, index) => {
        const speed = (index + 1) * 20;
        const xOffset = (x - 0.5) * speed;
        const yOffset = (y - 0.5) * speed;
        el.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // 기업 생성 처리
  async function handleCreateCompany(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("meetinghubAccessToken");
      if (!token) {
        throw new Error("로그인 토큰이 없습니다. 다시 로그인해 주세요.");
      }

      const res = await api.post<CompanyResponse>(
        ENDPOINTS.COMPANIES,
        { name: companyName },
        { headers: authHeaders(token) }
      );

      localStorage.setItem("meetinghubCompanyId", res.company.id);
      setMessage(`"${res.company.name}" 기업이 성공적으로 생성되었습니다! 대시보드로 이동합니다.`);
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "기업 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 초대 코드 처리
  async function handleAcceptInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const result = await api.post<InviteAcceptResponse>(ENDPOINTS.AUTH_ACCEPT_INVITE, {
        token: inviteCode,
        password: password,
      });

      localStorage.setItem("meetinghubCompanyId", result.company_id);
      if (result.session?.access_token) {
        localStorage.setItem("meetinghubAccessToken", result.session.access_token);
      }
      
      setMessage("초대가 성공적으로 수락되었습니다! 대시보드로 이동합니다.");
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "초대 코드가 유효하지 않거나 수락에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative z-10 min-h-screen bg-background flex flex-col items-center justify-center px-4 overflow-hidden md:px-margin-desktop">
      {/* Background Atmospheric Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[500px] bg-primary-container pastel-glow rounded-full pointer-events-none transition-transform duration-300 ease-out"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[500px] bg-secondary-container pastel-glow rounded-full pointer-events-none transition-transform duration-300 ease-out"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[600px] bg-tertiary-fixed pastel-glow rounded-full pointer-events-none transition-transform duration-300 ease-out"></div>

      <div className="relative w-full max-w-[1100px] flex flex-col md:flex-row items-center justify-between gap-12 py-10 z-10">
        
        {/* Left Side: Welcoming Illustration Area */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="mb-stack-lg animate-float">
            <div className="relative w-48 h-48 md:w-72 md:h-72 rounded-full overflow-hidden shadow-2xl">
              <img
                alt="Welcome Workspace"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvqTErrQfu-uyu0fbEVyfodrCnRypDXJjSKIB0advpfxhb8_WtniEWpv562feQxQ3dGsUBlvhYH4_z5TEPOKrbvgEjtdxxxodhJWjE_tn4oFj_kxqJc5-eyOq2c8gxizFGXAGsJsw7_Smw9fOXBBepYLmx8feDaPXL7jwIsi9lZloagwu40aDxb28v2OcEmIvD5LkNhtOKgESamuGfNKH7UesZ6Wn82ZSDbfxSjdRTO4rnj_isZA4SepmbloSyH2TbbUaT4-l-xtc"
              />
              <div className="absolute inset-0 bg-primary opacity-10 mix-blend-overlay"></div>
            </div>
          </div>
          <div className="space-y-stack-md">
            <h1 className="font-hanken font-bold text-4xl md:text-5xl text-primary leading-tight tracking-tight">
              환영합니다! <br />새로운 시작을 준비하세요.
            </h1>
            <p className="font-hanken text-lg text-on-surface-variant max-w-md">
              Nexus AI의 모든 기능을 경험하기 위해 새로운 기업을 생성하거나, 기존 팀에 참여해 보세요.
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Action Container */}
        <div className="w-full md:w-[480px]">
          
          {/* Main Select Mode */}
          {activeTab === "select" && (
            <div className="space-y-gutter animate-fadeIn">
              {/* Create Company Card */}
              <div
                onClick={() => setActiveTab("create")}
                className="glass-card p-8 rounded-[2rem] border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer cta-hover border-primary/20"
              >
                <div className="flex items-start gap-stack-md">
                  <div className="bg-primary-container text-on-primary-container p-4 rounded-xl">
                    <span className="material-symbols-outlined text-4xl">add_business</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-hanken font-semibold text-2xl text-on-surface mb-2">기업 생성</h3>
                    <p className="font-hanken text-sm text-on-surface-variant mb-6">
                      새로운 조직을 만들고 AI 워크스페이스를 구성하세요. 관리자로서 팀원을 초대할 수 있습니다.
                    </p>
                    <button className="bg-primary text-on-primary px-8 py-3 rounded-full font-semibold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 group-hover:bg-on-primary-fixed-variant transition-colors cursor-pointer">
                      시작하기
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Invite Code Card */}
              <div
                onClick={() => setActiveTab("invite")}
                className="glass-card p-8 rounded-[2rem] border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer cta-hover border-secondary/20"
              >
                <div className="flex items-start gap-stack-md">
                  <div className="bg-secondary-container text-on-secondary-container p-4 rounded-xl">
                    <span className="material-symbols-outlined text-4xl">group_add</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-hanken font-semibold text-2xl text-on-surface mb-2">초대 코드 입력</h3>
                    <p className="font-hanken text-sm text-on-surface-variant mb-6">
                      이미 운영 중인 기업이 있나요? 공유받은 초대 코드를 입력하여 팀에 합류하세요.
                    </p>
                    <button className="border-2 border-primary text-primary px-8 py-3 rounded-full font-semibold text-sm hover:bg-primary/5 transition-colors flex items-center gap-2 cursor-pointer">
                      코드 입력
                      <span className="material-symbols-outlined text-lg">key</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Company Form */}
          {activeTab === "create" && (
            <div className="glass-card p-8 rounded-[2rem] border border-primary/20 shadow-lg animate-scaleIn">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-hanken font-semibold text-2xl text-on-surface">새 기업 생성</h3>
                <button
                  onClick={() => {
                    setActiveTab("select");
                    setError("");
                    setMessage("");
                  }}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateCompany} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                    기업 이름
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: (주)넥서스AI"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                {message && <p className="text-sm text-emerald-700 font-medium">{message}</p>}
                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-semibold text-sm shadow-md hover:bg-on-primary-fixed-variant transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "생성 중..." : "기업 생성 완료"}
                </button>
              </form>
            </div>
          )}

          {/* Invite Code Form */}
          {activeTab === "invite" && (
            <div className="glass-card p-8 rounded-[2rem] border border-secondary/20 shadow-lg animate-scaleIn">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-hanken font-semibold text-2xl text-on-surface">초대 코드로 합류</h3>
                <button
                  onClick={() => {
                    setActiveTab("select");
                    setError("");
                    setMessage("");
                  }}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAcceptInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                    초대 코드
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="전달받은 초대 코드를 입력해 주세요"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                    회원 비밀번호
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="본인 계정 비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                {message && <p className="text-sm text-emerald-700 font-medium">{message}</p>}
                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-semibold text-sm shadow-md hover:bg-on-primary-fixed-variant transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "초대 코드 확인 중..." : "팀에 합류하기"}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Optional Support Footer */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-stack-sm text-xs text-on-surface-variant/60">
        <span className="material-symbols-outlined text-sm">help</span>
        도움이 필요하신가요? 고객지원 센터에 문의하세요.
      </div>
    </main>
  );
}
