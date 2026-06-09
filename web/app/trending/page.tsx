import Link from "next/link";
import { Panel, Eyebrow, ScoreNum } from "@/components/ui";
import { IconFlame } from "@/components/icons";
import { getTrending } from "@/lib/queries";

export default function TrendingPage() {
  const rows = getTrending(50);
  return (
    <div className="space-y-4">
      <div>
        <Eyebrow color="text-amber">异动监测</Eyebrow>
        <h1 className="mt-1 font-display font-extrabold text-cream text-2xl">声量飙升 · z-score 排序</h1>
        <p className="mt-1 text-sm text-neutral-500">近 6h 提及速率对 48h 基线的偏离度；🔥 = 触发 spike。</p>
      </div>

      <Panel className="p-2 sm:p-4">
        <div className="grid grid-cols-[36px_1fr_72px_72px_64px] sm:grid-cols-[44px_1fr_120px_100px_100px] items-center gap-3 px-3 py-2 text-[11px] text-neutral-500 uppercase tracking-wide">
          <span className="text-right">#</span>
          <span>标的</span>
          <span className="text-right">24h 提及</span>
          <span className="text-right">z-score</span>
          <span className="text-right">情绪</span>
        </div>
        <div className="space-y-0.5">
          {rows.map((t) => (
            <Link
              key={t.ticker}
              href={`/ticker/${t.ticker}`}
              className="grid grid-cols-[36px_1fr_72px_72px_64px] sm:grid-cols-[44px_1fr_120px_100px_100px] items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[.03] transition group"
            >
              <span className="text-right text-xs text-neutral-600 tabular">{t.rank}</span>
              <span className="flex items-center gap-2 min-w-0">
                {t.spike ? <IconFlame className="w-4 h-4 text-amber shrink-0" /> : <span className="w-4 shrink-0" />}
                <span className="font-mono font-semibold text-cream group-hover:text-amber transition">{t.ticker}</span>
                <span className="hidden sm:inline text-sm text-neutral-500 truncate">{t.name}</span>
              </span>
              <span className="text-right font-mono text-sm text-neutral-300 tabular">{t.mentions}</span>
              <span className="text-right font-mono text-sm text-amber tabular">{t.zscore > 0 ? "+" : ""}{t.zscore.toFixed(2)}</span>
              <span className="text-right text-sm"><ScoreNum score={t.sentiment} /></span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
