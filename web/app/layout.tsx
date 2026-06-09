import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "redditalpha · Reddit 美股舆情情报",
  description: "以专业方式分析 Reddit 财经板块的帖子数据：声量份额、情绪、异动、AI 叙事与每日简报。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-ink text-neutral-300 font-sans antialiased">
        <Sidebar />
        <div className="lg:pl-[232px]">
          <Topbar />
          <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1480px] mx-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
