"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stripLang } from "@/lib/i18n";
import { track } from "@/lib/analytics";

// 路由变化即记录一次 page_view（自动带 lang，并从 /ticker/X 路径提取标的）。
export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const { lang, rest } = stripLang(pathname);
    const path = rest.replace(/\/+$/, "") || "/";
    if (path.startsWith("/insights")) return; // 不统计仪表盘自身，避免自噪声
    const m = path.match(/\/ticker\/([^/]+)/);
    // 归因：分享链接带 utm，落地时记进 page_view 便于追踪「分享带来的访问」
    const sp = new URLSearchParams(window.location.search);
    const src = sp.get("utm_source");
    const meta = src ? { utm_source: src, utm_medium: sp.get("utm_medium") } : undefined;
    track("page_view", {
      path,
      lang,
      ticker: m ? decodeURIComponent(m[1]).toUpperCase() : undefined,
      meta,
    });
  }, [pathname]);
  return null;
}
