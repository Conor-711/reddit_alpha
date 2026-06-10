"use client";

import { TickerChip } from "./ui";
import { useLocale } from "./i18n/LocaleProvider";
import type { NarrativeRow } from "@/lib/queries";

export function NarrativeCard({ n, tickerBase = "/ticker" }: { n: NarrativeRow; tickerBase?: string }) {
  const { dict } = useLocale();
  const heatPct = Math.min(100, Math.max(10, Math.round((n.heat / 16000) * 100)));
  return (
    <div className="panel rounded-xl p-4 panel-hover h-full flex flex-col">
      {/* 标题领衔 */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-bold text-cream text-[15px] leading-tight">{n.name}</h3>
        <span className="font-mono text-[11px] text-neutral-500 tabular shrink-0 mt-0.5">{n.post_count} {dict.common.postsSuffix}</span>
      </div>

      {/* 热度条（视觉差异化，弱化公式化文案） */}
      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-[9px] uppercase tracking-[0.12em] text-neutral-600 shrink-0">{dict.common.heat}</span>
        <div className="h-1 flex-1 rounded-full bg-white/[.06] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-reddit/60 to-reddit" style={{ width: `${heatPct}%` }} />
        </div>
      </div>

      <p className="mt-2.5 text-[12.5px] text-neutral-500 leading-relaxed line-clamp-2 flex-1">{n.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {n.tickers.slice(0, 6).map((t) => (
          <TickerChip key={t.ticker} ticker={t.ticker} size="xs" base={tickerBase} />
        ))}
      </div>
    </div>
  );
}
