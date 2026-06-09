import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

// 防闪烁：首屏渲染前按 localStorage 套用主题类 + 侧边栏折叠状态（默认白天 / 展开）。
const THEME_INIT = `try{var d=document.documentElement;var t=localStorage.getItem('redditalpha:theme');if(t==='dark'){d.classList.add('dark')}else{d.classList.remove('dark')}var sb=localStorage.getItem('redditalpha:sidebar');if(sb){d.setAttribute('data-sb',sb)}}catch(e){}`;

export const metadata: Metadata = {
  title: "redditalpha · Reddit 美股舆情情报",
  description:
    "以专业方式分析 Reddit 财经板块的帖子数据：声量份额、情绪、异动、AI 叙事与每日简报。",
};

// 根布局只负责 html/body 外壳与全局 Provider；
// 站点 chrome（侧栏/顶栏/信号条）在 app/[lang]/layout.tsx 内，受语言上下文包裹。
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-ink text-neutral-300 font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
