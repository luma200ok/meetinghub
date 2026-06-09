"use client";

import { useState } from "react";
import { minutesApi } from "@/lib/api/minutes";
import type { Minute } from "@/types";

interface Props {
  reservationId: string;
  existing?: Minute | null;
  token: string;
  companyId: string;
  onSaved: (minute: Minute) => void;
  onCancel?: () => void;
}

export default function MinuteEditor({
  reservationId,
  existing,
  token,
  companyId,
  onSaved,
  onCancel,
}: Props) {
  const [content, setContent] = useState(existing?.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("회의록 내용을 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const minute = existing
        ? await minutesApi.update(existing.id, content, token, companyId)
        : await minutesApi.create(reservationId, content, token, companyId);
      onSaved(minute);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        className="w-full min-h-[200px] border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
        placeholder="회의록 내용을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={saving}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            disabled={saving}
          >
            취소
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-slate-950 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "저장 중..." : existing ? "수정" : "저장"}
        </button>
      </div>
    </form>
  );
}
