import Link from "next/link";
import { Panel, SectionTitle, Eyebrow, TickerChip, MiniBar, ScoreNum } from "@/components/ui";
import { MindshareTreemap } from "@/components/charts/MindshareTreemap";
import { MoodGauge } from "@/components/charts/MoodGauge";
import { FeedCard } from "@/components/FeedCard";
import { NarrativeCard } from "@/components/NarrativeCard";
import { IconFlame, IconWaves } from "@/components/icons";
import { fmtInt, fmtCompact, sentTextClass } from "@/lib/format";
import {
  getMarketMood, getMindshare, getTreemap, getTrending, getNarratives, getFeed, getMeta,
} from "@/lib/queries";

export default function Overview() {
  const meta = getMeta();
  const mood = getMarketMood();
  const treemap = getTreemap(28);
  const mind = getMindshare(12);
  const spikes = getTrending(8);
  const narratives = getNarratives(6);
  const feed = getFeed({ limit: 6 });
  const maxShare = mind[0]?.mindshare || 1;

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <IconWaves className="w-6 h-4 text-reddit" />
            <Eyebrow>实时舆情看板</Eyebrow>
          </div>
          <h1 className="mt-1.5 font-display font-extrabold text-cream text-2xl tracking-tight">
            Reddit 在热议什么
          </h1>
        </div>
        <div className="flex gap-5 text-sm">
          <Stat label="追踪标的" value={fmtInt(meta.tickers)} />
          <Stat label="帖子" value={fmtInt(meta.posts)} />
          <Stat label="提及" value={fmtInt(meta.mentions)} />
        </div>
      </div>

      {/* 第一行：treemap + 情绪 */}
      <div className="grid xl:grid-cols-3 gap-4">
        <Panel className="xl:col-span-2 p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display font-bold text-cream">声量份额 · Mindshare</h2>
            <span className="text-xs text-neutral-600">近 24h · 面积=份额 · 颜色=情绪</span>
          </div>
          <MindshareTreemap data={treemap} height={384} />
          <div className="flex items-center gap-3 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-bull" />看多</span>
            <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-neutral-500" />中性</span>
            <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-bear" />看空</span>
            <span className="ml-auto text-neutral-600">点击方块查看详情 →</span>
          </div>
        </Panel>

        <Panel className="p-5 flex flex-col">
          <h2 className="font-display font-bold text-cream mb-1">市场情绪</h2>
          {mood ? (
            <>
              <MoodGauge value={mood.mood_score} />
              <div className="text-center -mt-2">
                <span className={`font-display font-bold text-lg ${sentTextClass(mood.mood_score)}`}>
                  {mood.label}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5">
                  <div className="bg-bull" style={{ width: `${mood.bull_pct}%` }} />
                  <div className="bg-neutral-600" style={{ width: `${mood.neutral_pct}%` }} />
                  <div className="bg-bear" style={{ width: `${mood.bear_pct}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-bull">多 {mood.bull_pct.toFixed(0)}%</span>
                  <span className="text-neutral-500">中 {mood.neutral_pct.toFixed(0)}%</span>
                  <span className="text-bear">空 {mood.bear_pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-line grid grid-cols-2 gap-3 text-sm">
                <Stat label="窗口帖子" value={fmtInt(mood.total_posts)} />
                <Stat label="窗口提及" value={fmtInt(mood.total_mentions)} />
              </div>
            </>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      {/* 第二行：热度榜 + 异动 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2 p-5">
          <SectionTitle title="热度榜" hint="按 mindshare 排序" />
          <div className="space-y-1">
            {mind.map((r, i) => (
              <Link
                key={r.ticker}
                href={`/ticker/${r.ticker}`}
                className="grid grid-cols-[20px_64px_1fr_auto] sm:grid-cols-[24px_72px_1fr_120px_64px] items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[.03] transition group"
              >
                <span className="text-xs text-neutral-600 tabular text-right">{i + 1}</span>
                <span className="font-mono font-semibold text-cream group-hover:text-amber transition">{r.ticker}</span>
                <span className="hidden sm:block text-sm text-neutral-500 truncate">{r.name}</span>
                <div className="flex items-center gap-2">
                  <MiniBar pct={(r.mindshare / maxShare) * 100} />
                  <span className="font-mono text-xs text-neutral-300 tabular w-11 text-right">{r.mindshare.toFixed(1)}%</span>
                </div>
                <span className="text-right text-xs hidden sm:block"><ScoreNum score={r.sentiment} /></span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle title="异动飙升" href="/trending" />
          <div className="space-y-1">
            {spikes.map((t) => (
              <Link
                key={t.ticker}
                href={`/ticker/${t.ticker}`}
                className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-white/[.03] transition group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {t.spike ? <IconFlame className="w-4 h-4 text-amber shrink-0" /> : <span className="w-4" />}
                  <span className="font-mono font-semibold text-cream group-hover:text-amber transition">{t.ticker}</span>
                  <span className="text-xs text-neutral-600 tabular">{t.mentions} 提及</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-amber tabular">z {t.zscore > 0 ? "+" : ""}{t.zscore.toFixed(1)}</span>
                  <span className="text-xs"><ScoreNum score={t.sentiment} /></span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      {/* 叙事 */}
      <div>
        <SectionTitle title="主导叙事" href="/narratives" />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {narratives.map((n) => (
            <NarrativeCard key={n.id} n={n} />
          ))}
        </div>
      </div>

      {/* 帖子流 */}
      <div>
        <SectionTitle title="高信号帖子" href="/feed" />
        <div className="grid md:grid-cols-2 gap-4">
          {feed.map((p) => (
            <FeedCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display font-bold text-cream text-xl tabular">{value}</div>
      <div className="text-[11px] text-neutral-500">{label}</div>
    </div>
  );
}

function Empty() {
  return <div className="text-sm text-neutral-600 py-8 text-center">暂无数据，请先运行 <code className="text-amber">make demo</code></div>;
}
