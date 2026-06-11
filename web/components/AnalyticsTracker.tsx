"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { stripLang } from "@/lib/i18n";
import { track } from "@/lib/analytics";

// 路由变化记录 page_view；同时按页测「活跃停留时长 + 点击数」，离开该页时发 page_leave 信标。
// 这样后端可算：人均停留时长、人均点击、页/会话、跳出率（最爱页面 + 广告主可信度指标）。
type Seg = { path: string; lang: string; start: number; clicks: number };

export function AnalyticsTracker() {
  const pathname = usePathname();
  const seg = useRef<Seg | null>(null);

  // 结束当前页：累计「活跃 ms」与点击数发 page_leave（start=0 表示已结算，避免重复）。
  const flush = useCallback(() => {
    const s = seg.current;
    if (!s || !s.start) return;
    const ms = Date.now() - s.start;
    s.start = 0;
    if (ms > 500 || s.clicks > 0) {
      track("page_leave", { path: s.path, lang: s.lang, meta: { ms, clicks: s.clicks } });
    }
  }, []);

  // 全局点击计数 + 可见性/卸载时结算（仅挂一次）。隐藏=离开 → 结算；重新可见 → 重启计时（不计后台时间）。
  useEffect(() => {
    const onClick = () => { if (seg.current && seg.current.start) seg.current.clicks++; };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
      else if (seg.current && !seg.current.start) seg.current.start = Date.now();
    };
    const onHide = () => flush();
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
      flush();
    };
  }, [flush]);

  // 路由变化：先结算上一页，再开新页 + page_view（仪表盘自身不统计）。
  useEffect(() => {
    if (!pathname) return;
    const { lang, rest } = stripLang(pathname);
    const path = rest.replace(/\/+$/, "") || "/";
    flush();
    if (path.startsWith("/insights")) { seg.current = null; return; }
    seg.current = { path, lang, start: Date.now(), clicks: 0 };
    const m = path.match(/\/ticker\/([^/]+)/);
    const sp = new URLSearchParams(window.location.search);
    const src = sp.get("utm_source");
    const meta = src ? { utm_source: src, utm_medium: sp.get("utm_medium") } : undefined;
    track("page_view", {
      path,
      lang,
      ticker: m ? decodeURIComponent(m[1]).toUpperCase() : undefined,
      meta,
    });
  }, [pathname, flush]);

  return null;
}
