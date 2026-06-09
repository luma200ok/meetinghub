import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-on-surface h-screen overflow-hidden flex">
      {/* Sidebar Nav */}
      <Sidebar />

      {/* Content wrapper */}
      <div className="flex-grow flex flex-col min-w-0 relative h-full ml-64">
        {/* Top Header */}
        <Header />

        {/* Main Content Canvas with independent scroll to prevent layout break */}
        <main className="pt-24 px-12 pb-12 flex-grow overflow-y-auto bg-[#f9f9ff]">
          <div className="max-w-[1440px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}