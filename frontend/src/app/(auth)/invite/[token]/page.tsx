"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

type InviteAcceptResponse = {
  company_id: string;
  session?: { access_token?: string | null } | null;
};

export default function InvitePage() {
  const params = useParams<{ token: string }>();
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
      setMessage("초대를 수락했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "초대 수락에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div>
          <p className="text-sm font-medium text-emerald-700">MeetingHub AI</p>
          <h1 className="mt-2 text-3xl font-semibold">초대 수락</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <label className="flex flex-col gap-2 text-sm font-medium">
            비밀번호
            <input className="rounded-md border border-slate-300 px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </label>
          <button className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400" disabled={isSubmitting}>
            {isSubmitting ? "처리 중" : "초대 수락"}
          </button>
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </section>
    </main>
  );
}
