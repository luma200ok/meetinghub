import { redirect } from "next/navigation";

// 예약 기능은 회의실 페이지(/meeting-rooms)에 통합됨 — 별도 예약 페이지 폐지.
// 기존 링크/북마크 보호용으로 회의실 페이지로 리다이렉트.
export default function ReservationsPage() {
  redirect("/meeting-rooms");
}
