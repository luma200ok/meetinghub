import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetingHub AI",
  description: "AI 기반 기업 회의 및 협업 관리 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
