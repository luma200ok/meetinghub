export default function InvitePage({ params }: { params: { token: string } }) {
  return <div>초대 수락: {params.token}</div>;
}
