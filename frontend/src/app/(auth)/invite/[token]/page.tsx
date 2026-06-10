"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

type InviteAcceptResponse = {
  company_id: string;
  session?: { access_token?: string | null } | null;
};

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const result = await api.post<InviteAcceptResponse>(ENDPOINTS.AUTH_ACCEPT_INVITE, {
        token,
        password,
      });
      localStorage.setItem("meetinghubCompanyId", result.company_id);
      if (result.session?.access_token) {
        localStorage.setItem("meetinghubAccessToken", result.session.access_token);
      }
      setMessage("초대를 수락했습니다. 대시보드로 이동합니다.");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "초대 수락에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-margin-mobile py-12 text-on-surface md:px-margin-desktop">
      <section className="flex w-full max-w-md flex-col gap-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
            <span className="text-2xl font-black tracking-tight">MeetingHub</span>
          </Link>
          <h1 className="mt-8 text-3xl font-semibold text-on-background">팀 초대 수락</h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">본인 확인을 위해 계정 비밀번호를 입력해 주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
          <label className="flex flex-col gap-2 text-sm font-semibold text-on-surface-variant">
            비밀번호
            <input
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-on-primary-fixed-variant disabled:cursor-not-allowed disabled:opacity-50" disabled={isSubmitting}>
            <span>{isSubmitting ? "처리 중" : "초대 수락"}</span>
            {!isSubmitting && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
          </button>
          {message && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{message}</p>}
          {error && <p className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container" role="alert">{error}</p>}
        </form>

        <p className="text-center text-sm text-on-surface-variant">
          다른 계정으로 참여해야 하나요? <Link className="font-semibold text-primary hover:underline" href="/login">로그인으로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
