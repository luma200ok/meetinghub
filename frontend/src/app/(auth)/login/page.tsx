"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw signInError;
      }
      if (data.session?.access_token) {
        localStorage.setItem("meetinghubAccessToken", data.session.access_token);
      }
      if (companyId) {
        localStorage.setItem("meetinghubCompanyId", companyId);
        setMessage("로그인되었습니다. 대시보드로 이동합니다.");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setMessage("로그인되었습니다. 온보딩을 진행합니다.");
        setTimeout(() => {
          router.push("/onboarding");
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div>
          <p className="text-sm font-medium text-emerald-700">MeetingHub AI</p>
          <h1 className="mt-2 text-3xl font-semibold">로그인</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <label className="flex flex-col gap-2 text-sm font-medium">
            이메일
            <input className="rounded-md border border-slate-300 px-3 py-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            비밀번호
            <input className="rounded-md border border-slate-300 px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            회사 ID
            <input className="rounded-md border border-slate-300 px-3 py-2" value={companyId} onChange={(event) => setCompanyId(event.target.value)} />
          </label>
          <button className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400" disabled={isSubmitting}>
            {isSubmitting ? "처리 중" : "로그인"}
          </button>
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <Link href="/signup" className="text-sm font-medium text-slate-700 underline">
          새 기업으로 시작하기
        </Link>
      </section>
    </main>
  );
}

