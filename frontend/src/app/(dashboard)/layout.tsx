import NotificationBell from "@/components/notifications/NotificationBell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid #eee",
        }}
      >
        <NotificationBell />
      </header>

      <main>{children}</main>
    </div>
  );
}