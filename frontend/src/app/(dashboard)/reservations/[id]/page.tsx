export default function ReservationDetailPage({ params }: { params: { id: string } }) {
  return <div>회의 예약 상세: {params.id}</div>;
}
