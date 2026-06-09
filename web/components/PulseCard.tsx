"use client";

import { Avatar } from "./ui";
import { IconWaves } from "./icons";
import { useLocale } from "./i18n/LocaleProvider";
import { timeAgo, stanceLabel, fmtCompact, REDDIT } from "@/lib/format";
import type { FeedRow } from "@/lib/queries";

// 高级双色调渐变（Surf pulse 风：每张卡不同色相，有变化的高级感）
const GRADS: Record<string, string> = {
  green: "linear-gradient(155deg,#34B36A,#11663b)",
  teal: "linear-gradient(155deg,#1FA890,#0b524a)",
  gold: "linear-gradient(155deg,#E9B53C,#9c6a10)",
  orange: "linear-gradient(155deg,#E8763C,#9a3717)",
  rose: "linear-gradient(155deg,#E0556F,#822038)",
  indigo: "linear-gradient(155deg,#5B6CE0,#262e84)",
  slate: "linear-gradient(155deg,#6E7681,#373c44)",
  violet: "linear-gradient(155deg,#9B5BE0,#4d2580)",
};

function pickGrad(p: FeedRow, i: number): string {
  // 按情绪族 + 序号轮转，保证每张卡不同色相（Surf 风的多彩变化）
  const bull = ["green", "teal", "gold", "indigo"] as const;
  const bear = ["orange", "rose", "slate", "violet"] as const;
  const neutral = ["indigo", "slate", "gold", "teal"] as const;
  const fam = p.sentiment > 0.15 ? bull : p.sentiment < -0.15 ? bear : neutral;
  return GRADS[fam[i % fam.length]];
}

export function PulseCard({ p, i }: { p: FeedRow; i: number }) {
  const { lang, dict } = useLocale();
  const grad = pickGrad(p, i);
  const cat =
    p.themes[0] ||
    p.flair ||
    (p.stance === "bull" ? stanceLabel("bull", lang) : p.stance === "bear" ? stanceLabel("bear", lang) : dict.common.discuss);
  const topTicker = p.tickers[0]?.ticker;
  const mark = (topTicker || p.subreddit || "R")[0].toUpperCase();

  return (
    <a
      href={`${REDDIT}${p.permalink}`}
      target="_blank"
      rel="noreferrer"
      className="group relative overflow-hidden rounded-2xl flex flex-col min-h-[212px] ring-1 ring-inset ring-white/10 shadow-lg shadow-black/30 transition hover:-translate-y-0.5"
      style={{ backgroundImage: grad }}
    >
      {/* 波浪装饰 */}
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-[.13]" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden>
        <path d="M0 64 Q100 24 200 64 T400 64 V120 H0 Z" fill="#fff" />
        <path d="M0 84 Q100 52 200 84 T400 84 V120 H0 Z" fill="#fff" opacity=".55" />
      </svg>
      {/* 大水印 */}
      <span className="pointer-events-none absolute -right-2 -top-6 font-display font-black text-white/[.07] leading-none select-none" style={{ fontSize: 130 }}>
        {mark}
      </span>

      <div className="relative flex-1 p-4 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/25 text-white/95">{cat}</span>
          {p.quality >= 0.72 && <span className="text-[11px] font-bold metal-text m-gold drop-shadow">{dict.common.highSignal}</span>}
        </div>

        <h3 className="mt-2.5 font-display font-extrabold text-white text-[17px] leading-snug line-clamp-3 [text-shadow:0_1px_3px_rgba(0,0,0,.25)]">
          {p.title}
        </h3>
        {p.tldr && <p className="mt-1.5 text-[12.5px] text-white/80 leading-relaxed line-clamp-2">{p.tldr}</p>}

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 min-w-0">
            {p.author ? <Avatar name={p.author} size={18} /> : null}
            <span className="text-xs font-medium text-white/90 truncate">{p.author ? `u/${p.author}` : `r/${p.subreddit}`}</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/65 shrink-0">
            <IconWaves className="w-4 h-2.5" /> redditalpha
          </span>
        </div>
      </div>

      {/* 底部来源/数据条 */}
      <div className="relative px-4 py-2 bg-black/25 flex items-center gap-x-2.5 text-[11px] text-white/85">
        <span className="font-semibold">r/{p.subreddit}</span>
        {topTicker && <span className="font-mono">${topTicker}</span>}
        <span className="text-white/55">· {timeAgo(p.created, lang)}</span>
        <span className="ml-auto font-mono tabular">▲ {fmtCompact(p.score)}</span>
      </div>
    </a>
  );
}
