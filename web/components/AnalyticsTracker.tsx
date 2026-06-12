"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { stripLang } from "@/lib/i18n";
import { track } from "@/lib/analytics";

// 路由变化记录 page_view；同时按页测「活跃停留时长 + 点击数」，离开该页时发 page_leave 信标。
// 这样后端可算：人均停留时长、人均点击、页/会话、跳出率（最爱页面 + 广告主可信度指标）。
type Seg = { path: string; lang: string; start: number; clicks: number; maxScroll: number };

// 单页停留上限：30 分钟。防「前台挂着不动 / 长时间不关」把单条停留撑成离群值，污染平均值。
// 计时本就会在切后台时暂停，这里再给一个硬上限兜底。改这里即可调整阈值。
const MAX_DWELL_MS = 30 * 60 * 1000;

export function AnalyticsTracker() {
  const pathname = usePathname();
  const seg = useRef<Seg | null>(null);

  // 结束当前页：累计「活跃 ms」、点击数、最大滚动深度发 page_leave（start=0 表示已结算，避免重复）。
  const flush = useCallback(() => {
    const s = seg.current;
    if (!s || !s.start) return;
    const ms = Math.min(Date.now() - s.start, MAX_DWELL_MS); // 封顶，防离群值
    s.start = 0;
    if (ms > 500 || s.clicks > 0) {
      track("page_leave", { path: s.path, lang: s.lang, meta: { ms, clicks: s.clicks, maxScroll: s.maxScroll } });
    }
  }, []);

  // 全局点击计数 + 滚动深度 + 可见性/卸载结算（仅挂一次）。隐藏=离开 → 结算；重新可见 → 重启计时（不计后台时间）。
  useEffect(() => {
    const onClick = () => { if (seg.current && seg.current.start) seg.current.clicks++; };
    const onScroll = () => {
      const s = seg.current;
      if (!s || !s.start) return;
      const doc = document.documentElement;
      const denom = doc.scrollHeight - doc.clientHeight;
      const pct = denom > 0 ? Math.min(100, Math.round((doc.scrollTop / denom) * 100)) : 100;
      if (pct > s.maxScroll) s.maxScroll = pct;
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
      else if (seg.current && !seg.current.start) seg.current.start = Date.now();
    };
    const onHide = () => flush();
    document.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
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
    seg.current = { path, lang, start: Date.now(), clicks: 0, maxScroll: 0 };
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
