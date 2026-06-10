"use client";

import { useLocale } from "./i18n/LocaleProvider";
import { fmtInt, timeAgo } from "@/lib/format";
import type { DataStats } from "@/lib/queries";

// 首页顶部「数据可信度」模块：用每天 08:00 分析后的真实计数（已分析帖子 / 评论 / 提及 /
// 覆盖标的 / 追踪社区 / 活跃作者），让访客一眼看到网站结论建立在多大规模的真实数据上。
export function DataCredibility({ stats }: { stats: DataStats }) {
  const { lang, dict } = useLocale();
  const t = dict.credibility;

  const items = [
    { v: stats.analyzedPosts, label: t.posts, accent: "text-reddit" },
    { v: stats.comments, label: t.comments },
    { v: stats.mentions, label: t.mentions },
    { v: stats.tickers, label: t.tickers },
    { v: stats.communities, label: t.communities },
    { v: stats.authors, label: t.authors },
  ];

  return (
    <section className="panel rounded-2xl px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-bull" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-reddit">{t.eyebrow}</div>
            <div className="text-sm font-medium text-cream leading-snug">{t.title}</div>
          </div>
        </div>
        {stats.lastUpdated && (
          <div className="text-[11px] text-neutral-500 shrink-0">
            {t.updatedPrefix}{timeAgo(stats.lastUpdated, lang)}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-4">
        {items.map((it) => (
          <div key={it.label} className="min-w-0">
            <div className={`font-display font-extrabold tabular leading-none text-xl sm:text-[26px] ${it.accent ?? "text-cream"}`}>
              {fmtInt(it.v)}
            </div>
            <div className="mt-1.5 text-[11px] text-neutral-500 truncate">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
