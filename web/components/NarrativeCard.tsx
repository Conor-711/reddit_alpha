import { TickerChip } from "./ui";
import { fmtCompact } from "@/lib/format";
import type { NarrativeRow } from "@/lib/queries";

export function NarrativeCard({ n }: { n: NarrativeRow }) {
  return (
    <div className="panel rounded-xl p-4 panel-hover h-full flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display font-bold text-cream">{n.name}</h3>
        <span className="text-[11px] text-neutral-500 shrink-0">
          {n.post_count} 帖 · 热度 {fmtCompact(n.heat)}
        </span>
      </div>
      <p className="mt-2 text-sm text-neutral-400 leading-relaxed line-clamp-3 flex-1">{n.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {n.tickers.slice(0, 6).map((t) => (
          <TickerChip key={t.ticker} ticker={t.ticker} size="xs" />
        ))}
      </div>
    </div>
  );
}
