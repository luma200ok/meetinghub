"use client";

import { useState } from "react";
import { minutesApi } from "@/lib/api/minutes";
import type { Minute } from "@/types";
import MinuteEditor from "./MinuteEditor";

interface Props {
  minute: Minute;
  currentUserId: string;
  token: string;
  companyId: string;
  onUpdated: (minute: Minute) => void;
  onDeleted: () => void;
}

export default function MinuteViewer({
  minute,
  currentUserId,
  token,
  companyId,
  onUpdated,
  onDeleted,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isAuthor = minute.created_by === currentUserId;

  async function handleDelete() {
    if (!confirm("회의록을 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      await minutesApi.delete(minute.id, token, companyId);
      onDeleted();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "삭제 오류");
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <MinuteEditor
        reservationId={minute.reservation_id}
        existing={minute}
        token={token}
        companyId={companyId}
        onSaved={(m) => {
          onUpdated(m);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-slate-400">
        작성자: {minute.author_name ?? minute.created_by} ·{" "}
        {new Date(minute.updated_at).toLocaleString("ko-KR")}
      </div>
      <div className="whitespace-pre-wrap text-sm text-slate-800 bg-slate-50 rounded-lg p-4 min-h-[120px]">
        {minute.content}
      </div>
      {isAuthor && (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      )}
    </div>
  );
}
