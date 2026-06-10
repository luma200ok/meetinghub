"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, authHeaders } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

type Department = {
  id: string;
  name: string;
  parent_id?: string | null;
};

type Position = {
  id: string;
  name: string;
  level?: number | null;
};

type Member = {
  id: string;
  role: "ADMIN" | "MEMBER";
  user?: { email?: string; name?: string | null } | null;
  department?: { name?: string } | null;
  position?: { name?: string } | null;
};

function getStoredValue(key: string) {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(key) ?? "";
}

export default function OrganizationPage() {
  const [accessToken] = useState(() => getStoredValue("meetinghubAccessToken"));
  const [companyId] = useState(() => getStoredValue("meetinghubCompanyId"));
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [positionName, setPositionName] = useState("");
  const [positionLevel, setPositionLevel] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadOrganization = useCallback(async (token = accessToken, activeCompanyId = companyId) => {
    if (!token || !activeCompanyId) {
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const headers = authHeaders(token, activeCompanyId);
      const [nextDepartments, nextPositions, nextMembers] = await Promise.all([
        api.get<Department[]>(ENDPOINTS.DEPARTMENTS, { headers }),
        api.get<Position[]>(ENDPOINTS.POSITIONS, { headers }),
        api.get<Member[]>(ENDPOINTS.MEMBERS, { headers }),
      ]);
      setDepartments(nextDepartments);
      setPositions(nextPositions);
      setMembers(nextMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조직 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, companyId]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialOrganization() {
      if (!accessToken || !companyId) {
        return;
      }

      try {
        const headers = authHeaders(accessToken, companyId);
        const [nextDepartments, nextPositions, nextMembers] = await Promise.all([
          api.get<Department[]>(ENDPOINTS.DEPARTMENTS, { headers }),
          api.get<Position[]>(ENDPOINTS.POSITIONS, { headers }),
          api.get<Member[]>(ENDPOINTS.MEMBERS, { headers }),
        ]);

        if (isMounted) {
          setDepartments(nextDepartments);
          setPositions(nextPositions);
          setMembers(nextMembers);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "조직 정보를 불러오지 못했습니다.");
        }
      }
    }

    void loadInitialOrganization();

    return () => {
      isMounted = false;
    };
  }, [accessToken, companyId]);

  async function createDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitChange(async () => {
      await api.post(ENDPOINTS.DEPARTMENTS, { name: departmentName }, { headers: authHeaders(accessToken, companyId) });
      setDepartmentName("");
      setMessage("부서를 추가했습니다.");
    });
  }

  async function deleteDepartment(departmentId: string) {
    await submitChange(async () => {
      await api.delete(`${ENDPOINTS.DEPARTMENTS}/${departmentId}`, { headers: authHeaders(accessToken, companyId) });
      setMessage("부서를 삭제했습니다.");
    });
  }

  async function createPosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitChange(async () => {
      await api.post(
        ENDPOINTS.POSITIONS,
        { name: positionName, level: positionLevel ? Number(positionLevel) : null },
        { headers: authHeaders(accessToken, companyId) }
      );
      setPositionName("");
      setPositionLevel("");
      setMessage("직급을 추가했습니다.");
    });
  }

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitChange(async () => {
      const invitation = await api.post<{ invite_url: string; token: string }>(
        ENDPOINTS.AUTH_INVITE,
        { email: inviteEmail, company_id: companyId },
        { headers: authHeaders(accessToken, companyId) }
      );
      setInviteEmail("");
      setInviteUrl(invitation.invite_url);
      setMessage("초대 토큰을 생성했습니다.");
    });
  }

  async function submitChange(action: () => Promise<void>) {
    setError("");
    setMessage("");
    setInviteUrl("");

    try {
      await action();
      await loadOrganization();
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청을 처리하지 못했습니다.");
    }
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50 px-6 py-8 text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Organization</p>
            <h1 className="mt-1 text-3xl font-semibold">조직 관리</h1>
          </div>
          <button className="w-fit rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium" onClick={() => void loadOrganization()} disabled={isLoading}>
            {isLoading ? "불러오는 중" : "새로고침"}
          </button>
        </div>

        {(!accessToken || !companyId) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            로그인 후 로컬 저장소에 인증 토큰과 회사 ID가 있어야 조직 API를 호출할 수 있습니다.
          </div>
        )}

        {message && <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {inviteUrl && <p className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700">초대 경로: {inviteUrl}</p>}

        <div className="grid gap-4 lg:grid-cols-3">
          <form onSubmit={createDepartment} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">부서 추가</h2>
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="예: 제품팀" value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} required />
            <button className="mt-auto rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">추가</button>
          </form>

          <form onSubmit={createPosition} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">직급 추가</h2>
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="예: 매니저" value={positionName} onChange={(event) => setPositionName(event.target.value)} required />
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="레벨(1 이상)" type="number" min={1} step={1} value={positionLevel} onChange={(event) => setPositionLevel(event.target.value)} />
            <button className="mt-auto rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">추가</button>
          </form>

          <form onSubmit={inviteMember} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">직원 초대</h2>
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="name@example.com" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required />
            <button className="mt-auto rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">초대 생성</button>
          </form>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">부서</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {departments.map((department) => (
                <div key={department.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="text-sm font-medium">{department.name}</span>
                  <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium" onClick={() => void deleteDepartment(department.id)}>
                    삭제
                  </button>
                </div>
              ))}
              {departments.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">등록된 부서가 없습니다.</p>}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">직급</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {positions.map((position) => (
                <div key={position.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="text-sm font-medium">{position.name}</span>
                  <span className="text-xs text-slate-500">Level {position.level ?? "-"}</span>
                </div>
              ))}
              {positions.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">등록된 직급이 없습니다.</p>}
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold">직원</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-medium">이메일</th>
                  <th className="px-5 py-3 font-medium">이름</th>
                  <th className="px-5 py-3 font-medium">부서</th>
                  <th className="px-5 py-3 font-medium">직급</th>
                  <th className="px-5 py-3 font-medium">역할</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-5 py-3">{member.user?.email ?? "-"}</td>
                    <td className="px-5 py-3">{member.user?.name ?? "-"}</td>
                    <td className="px-5 py-3">{member.department?.name ?? "-"}</td>
                    <td className="px-5 py-3">{member.position?.name ?? "-"}</td>
                    <td className="px-5 py-3">{member.role}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td className="px-5 py-6 text-slate-500" colSpan={5}>등록된 직원이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
