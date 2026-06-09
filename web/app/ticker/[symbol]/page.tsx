import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, SectionTitle, Eyebrow, TickerChip, MiniBar, ScoreNum } from "@/components/ui";
import { Sparkline } from "@/components/charts/Sparkline";
import { FeedCard } from "@/components/FeedCard";
import { fmtInt, fmtPct, sentTextClass, REDDIT } from "@/lib/format";
import { getTickerDetail, getAllTickerSymbols } from "@/lib/queries";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTickerSymbols().map((symbol) => ({ symbol }));
}

export default function TickerPage({ params }: { params: { symbol: string } }) {
  const d = getTickerDetail(params.symbol);
  if (!d.meta && !d.roll && d.posts.length === 0) notFound();

  const r = d.roll;
  const name = d.meta?.company_name || r?.name || "";
  const maxSub = Math.max(1, ...d.bySub.map((s) => s.n));

  return (
    <div className="space-y-4">
      <Link href="/" className="text-xs text-neutral-500 hover:text-amber">← 返回看板</Link>

      {/* 头部 */}
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-extrabold text-cream text-3xl font-mono tracking-tight">{d.ticker}</h1>
              {d.meta?.sector && (
                <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-neutral-400 ring-1 ring-inset ring-white/8">
                  {d.meta.sector}
                </span>
              )}
            </div>
            <div className="mt-1 text-neutral-500">{name}{d.meta?.exchange ? ` · ${d.meta.exchange}` : ""}</div>
          </div>
          {r && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-6 gap-y-3">
              <Metric label="Mindshare" value={fmtPct(r.mindshare)} accent="text-amber" />
              <Metric label="情绪" node={<span className={`font-mono ${sentTextClass(r.sentiment)}`}>{r.sentiment > 0 ? "+" : ""}{r.sentiment.toFixed(2)}</span>} />
              <Metric label="提及" value={fmtInt(r.mentions)} />
              <Metric label="帖子" value={fmtInt(r.posts)} />
              <Metric label="作者" value={fmtInt(r.authors)} />
            </div>
          )}
        </div>

        {d.series.length > 1 && (
          <div className="mt-4 pt-4 border-t border-line">
            <div className="text-xs text-neutral-500 mb-1">声量趋势 · 近 48h（每小时提及数）</div>
            <Sparkline series={d.series} height={84} />
          </div>
        )}
      </Panel>

      {!r && (
        <Panel className="p-8 text-center text-sm text-neutral-500">该标的近 24h 在 Reddit 暂无讨论。</Panel>
      )}

      {/* 多空论点 */}
      {(d.bull.length > 0 || d.bear.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          <ThesisPanel title="看多论点" color="text-bull" border="border-bull/25" items={d.bull} />
          <ThesisPanel title="看空论点" color="text-bear" border="border-bear/25" items={d.bear} />
        </div>
      )}

      {/* 板块拆分 + 关联叙事 */}
      <div className="grid md:grid-cols-2 gap-4">
        <Panel className="p-5">
          <SectionTitle title="板块分布" hint="提及来自哪些 subreddit" />
          <div className="space-y-2.5">
            {d.bySub.map((s) => (
              <div key={s.subreddit} className="flex items-center gap-3">
                <span className="text-sm text-neutral-400 w-32 truncate">r/{s.subreddit}</span>
                <MiniBar pct={(s.n / maxSub) * 100} color="bg-amber" />
                <span className="font-mono text-xs text-neutral-500 w-8 text-right tabular">{s.n}</span>
              </div>
            ))}
            {d.bySub.length === 0 && <div className="text-sm text-neutral-600">—</div>}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle title="关联叙事" />
          <div className="space-y-3">
            {d.narratives.map((n) => (
              <div key={n.id} className="rounded-lg bg-white/[.02] ring-1 ring-inset ring-white/6 p-3">
                <div className="font-display font-semibold text-cream text-sm">{n.name}</div>
                <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">{n.summary}</p>
              </div>
            ))}
            {d.narratives.length === 0 && <div className="text-sm text-neutral-600">—</div>}
          </div>
        </Panel>
      </div>

      {/* 相关帖子 */}
      {d.posts.length > 0 && (
        <div>
          <SectionTitle title="相关讨论" hint={`${d.posts.length} 篇`} />
          <div className="grid md:grid-cols-2 gap-4">
            {d.posts.map((p) => (
              <FeedCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, node, accent = "text-cream" }: { label: string; value?: string; node?: React.ReactNode; accent?: string }) {
  return (
    <div>
      <div className={`font-display font-bold text-lg tabular ${accent}`}>{node ?? value}</div>
      <div className="text-[11px] text-neutral-500">{label}</div>
    </div>
  );
}

function ThesisPanel({ title, color, border, items }: { title: string; color: string; border: string; items: { point: string; permalink: string; title: string }[] }) {
  return (
    <Panel className={`p-5 border ${border}`}>
      <h3 className={`font-display font-bold mb-3 ${color}`}>{title}</h3>
      {items.length === 0 ? (
        <div className="text-sm text-neutral-600">—</div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it, i) => (
            <li key={i} className="text-sm text-neutral-300 leading-relaxed flex gap-2">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${color === "text-bull" ? "bg-bull" : "bg-bear"} shrink-0`} />
              <span>
                {it.point}{" "}
                <a href={`${REDDIT}${it.permalink}`} target="_blank" rel="noreferrer" className="text-neutral-600 hover:text-amber" title={it.title}>↗</a>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
