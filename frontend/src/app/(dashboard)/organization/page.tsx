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
  user_id?: string;
  department_id?: string | null;
  position_id?: string | null;
  role: "ADMIN" | "MEMBER";
  user?: { email?: string; name?: string | null } | null;
  department?: { name?: string } | null;
  position?: { name?: string } | null;
};

const panelClass = "rounded-lg border border-outline-variant bg-surface-container-lowest";
const inputClass = "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20";
const primaryButtonClass = "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-on-primary-fixed-variant disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

function getStoredValue(key: string) {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(key) ?? "";
}

function getJwtSubject(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded)) as { sub?: string };
    return decoded.sub ?? "";
  } catch {
    return "";
  }
}

async function fetchOrganization(token: string, companyId: string) {
  const headers = authHeaders(token, companyId);
  const [departments, positions, members] = await Promise.all([
    api.get<Department[]>(ENDPOINTS.DEPARTMENTS, { headers }),
    api.get<Position[]>(ENDPOINTS.POSITIONS, { headers }),
    api.get<Member[]>(ENDPOINTS.MEMBERS, { headers }),
  ]);
  return { departments, positions, members };
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
  const [currentUserId] = useState(() => getJwtSubject(accessToken));
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editPositionId, setEditPositionId] = useState("");
  const [isSavingMember, setIsSavingMember] = useState(false);

  const loadOrganization = useCallback(async (token = accessToken, activeCompanyId = companyId) => {
    if (!token || !activeCompanyId) {
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const organization = await fetchOrganization(token, activeCompanyId);
      setDepartments(organization.departments);
      setPositions(organization.positions);
      setMembers(organization.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조직 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, companyId]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialOrganization() {
      if (!accessToken || !companyId) return;

      try {
        const organization = await fetchOrganization(accessToken, companyId);
        if (!isMounted) return;
        setDepartments(organization.departments);
        setPositions(organization.positions);
        setMembers(organization.members);
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

  const canManageMembers = members.some(
    (member) => member.user_id === currentUserId && member.role === "ADMIN"
  );
  const resolvedInviteUrl = inviteUrl && typeof window !== "undefined"
    ? new URL(inviteUrl, window.location.origin).toString()
    : inviteUrl;

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

  function startEditingMember(member: Member) {
    setEditingMemberId(member.id);
    setEditMemberName(member.user?.name ?? "");
    setEditDepartmentId(member.department_id ?? "");
    setEditPositionId(member.position_id ?? "");
    setError("");
    setMessage("");
  }

  function cancelEditingMember() {
    setEditingMemberId(null);
    setEditMemberName("");
    setEditDepartmentId("");
    setEditPositionId("");
  }

  async function saveMember(memberId: string) {
    if (!editMemberName.trim()) {
      setError("직원 이름을 입력해 주세요.");
      return;
    }

    setIsSavingMember(true);
    try {
      await submitChange(async () => {
        await api.patch(
          `${ENDPOINTS.MEMBERS}/${memberId}`,
          {
            name: editMemberName.trim(),
            department_id: editDepartmentId || null,
            position_id: editPositionId || null,
          },
          { headers: authHeaders(accessToken, companyId) }
        );
        setMessage("직원 정보가 수정되었습니다.");
        cancelEditingMember();
      });
    } finally {
      setIsSavingMember(false);
    }
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
    <main className="min-h-screen flex-1 bg-surface px-margin-mobile py-8 text-on-surface md:px-margin-desktop">
      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
        <div className="flex flex-col gap-3 border-b border-outline-variant pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Organization</p>
            <h1 className="mt-1 text-3xl font-semibold text-on-background">조직 관리</h1>
            <p className="mt-2 text-sm text-on-surface-variant">부서와 직급을 구성하고 직원 정보를 관리합니다.</p>
          </div>
          <button
            type="button"
            className={`${secondaryButtonClass} w-fit`}
            onClick={() => void loadOrganization()}
            disabled={isLoading}
            aria-label="조직 정보 새로고침"
            title="새로고침"
          >
            <span className={`material-symbols-outlined text-lg ${isLoading ? "animate-spin" : ""}`}>refresh</span>
            <span>{isLoading ? "불러오는 중" : "새로고침"}</span>
          </button>
        </div>

        {(!accessToken || !companyId) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
            로그인 후 로컬 저장소에 인증 토큰과 회사 ID가 있어야 조직 API를 호출할 수 있습니다.
          </div>
        )}

        {message && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{message}</p>}
        {error && <p className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container" role="alert">{error}</p>}
        {resolvedInviteUrl && (
          <p className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            초대 링크: <a className="font-semibold text-primary hover:underline" href={resolvedInviteUrl}>{resolvedInviteUrl}</a>
          </p>
        )}

        {canManageMembers && (
          <div className="grid gap-4 lg:grid-cols-3">
            <form onSubmit={createDepartment} className={`${panelClass} flex flex-col gap-3 p-5`}>
              <h2 className="text-lg font-semibold">부서 추가</h2>
              <input className={inputClass} aria-label="새 부서 이름" placeholder="예: 제품팀" value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} required />
              <button className={`${primaryButtonClass} mt-auto`}>
                <span className="material-symbols-outlined text-lg">add</span>
                부서 추가
              </button>
            </form>

            <form onSubmit={createPosition} className={`${panelClass} flex flex-col gap-3 p-5`}>
              <h2 className="text-lg font-semibold">직급 추가</h2>
              <input className={inputClass} aria-label="새 직급 이름" placeholder="예: 매니저" value={positionName} onChange={(event) => setPositionName(event.target.value)} required />
              <input className={inputClass} aria-label="직급 레벨" placeholder="레벨(1 이상)" type="number" min={1} step={1} value={positionLevel} onChange={(event) => setPositionLevel(event.target.value)} />
              <button className={`${primaryButtonClass} mt-auto`}>
                <span className="material-symbols-outlined text-lg">add</span>
                직급 추가
              </button>
            </form>

            <form onSubmit={inviteMember} className={`${panelClass} flex flex-col gap-3 p-5`}>
              <h2 className="text-lg font-semibold">직원 초대</h2>
              <input className={inputClass} aria-label="초대할 직원 이메일" placeholder="name@example.com" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required />
              <button className={`${primaryButtonClass} mt-auto`}>
                <span className="material-symbols-outlined text-lg">person_add</span>
                초대 링크 생성
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className={panelClass}>
            <div className="border-b border-outline-variant px-5 py-4">
              <h2 className="text-lg font-semibold">부서</h2>
            </div>
            <div className="divide-y divide-outline-variant">
              {departments.map((department) => (
                <div key={department.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="text-sm font-medium">{department.name}</span>
                  {canManageMembers && (
                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                      onClick={() => void deleteDepartment(department.id)}
                      aria-label={`${department.name} 삭제`}
                      title="부서 삭제"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                </div>
              ))}
              {departments.length === 0 && <p className="px-5 py-6 text-sm text-on-surface-variant">등록된 부서가 없습니다.</p>}
            </div>
          </section>

          <section className={panelClass}>
            <div className="border-b border-outline-variant px-5 py-4">
              <h2 className="text-lg font-semibold">직급</h2>
            </div>
            <div className="divide-y divide-outline-variant">
              {positions.map((position) => (
                <div key={position.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="text-sm font-medium">{position.name}</span>
                  <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface-variant">Level {position.level ?? "-"}</span>
                </div>
              ))}
              {positions.length === 0 && <p className="px-5 py-6 text-sm text-on-surface-variant">등록된 직급이 없습니다.</p>}
            </div>
          </section>
        </div>

        <section className={panelClass}>
          <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
            <h2 className="text-lg font-semibold">직원</h2>
            <span className="text-sm text-on-surface-variant">총 {members.length}명</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3 font-medium">이메일</th>
                  <th className="px-5 py-3 font-medium">이름</th>
                  <th className="px-5 py-3 font-medium">부서</th>
                  <th className="px-5 py-3 font-medium">직급</th>
                  <th className="px-5 py-3 font-medium">역할</th>
                  <th className="px-5 py-3 font-medium">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {members.map((member) => (
                  <tr key={member.id} className="transition-colors hover:bg-primary/5">
                    <td className="px-5 py-3">{member.user?.email ?? "-"}</td>
                    <td className="px-5 py-3">
                      {editingMemberId === member.id ? (
                        <input
                          className={`${inputClass} min-w-32`}
                          value={editMemberName}
                          onChange={(event) => setEditMemberName(event.target.value)}
                          aria-label="직원 이름"
                        />
                      ) : (
                        member.user?.name ?? "-"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editingMemberId === member.id ? (
                        <select
                          className={`${inputClass} min-w-32`}
                          value={editDepartmentId}
                          onChange={(event) => setEditDepartmentId(event.target.value)}
                          aria-label="직원 부서"
                        >
                          <option value="">미지정</option>
                          {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        member.department?.name ?? "-"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editingMemberId === member.id ? (
                        <select
                          className={`${inputClass} min-w-32`}
                          value={editPositionId}
                          onChange={(event) => setEditPositionId(event.target.value)}
                          aria-label="직원 직급"
                        >
                          <option value="">미지정</option>
                          {positions.map((position) => (
                            <option key={position.id} value={position.id}>
                              {position.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        member.position?.name ?? "-"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"}`}>
                        {member.role === "ADMIN" ? "관리자" : "구성원"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {canManageMembers && editingMemberId === member.id ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={`${primaryButtonClass} px-3 py-1.5 text-xs`}
                            onClick={() => void saveMember(member.id)}
                            disabled={isSavingMember}
                          >
                            {isSavingMember ? "저장 중" : "저장"}
                          </button>
                          <button
                            type="button"
                            className={`${secondaryButtonClass} px-3 py-1.5 text-xs`}
                            onClick={cancelEditingMember}
                            disabled={isSavingMember}
                          >
                            취소
                          </button>
                        </div>
                      ) : canManageMembers ? (
                        <button
                          type="button"
                          className="inline-flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                          onClick={() => startEditingMember(member)}
                          aria-label={`${member.user?.name ?? member.user?.email ?? "직원"} 관리`}
                          title="직원 정보 관리"
                        >
                          <span className="material-symbols-outlined text-lg">manage_accounts</span>
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td className="px-5 py-6 text-on-surface-variant" colSpan={6}>등록된 직원이 없습니다.</td>
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
