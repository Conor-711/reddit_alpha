import { LocaleLink } from "@/components/i18n/LocaleLink";
import { Panel, SectionTitle, Eyebrow, MiniBar, ScoreNum } from "@/components/ui";
import { MoodGauge } from "@/components/charts/MoodGauge";
import { FeedCard } from "@/components/FeedCard";
import { NarrativeCard } from "@/components/NarrativeCard";
import { TodaysAlpha } from "@/components/TodaysAlpha";
import { IconFlame, IconYuan } from "@/components/icons";
import { AdSlot } from "@/components/AdSlot";
import { fmtInt, sentTextClass } from "@/lib/format";
import { getDictionary, isLocale, defaultLocale, type Locale } from "@/lib/i18n";
import {
  getMarketMood, getMindshare, getTrending, getNarratives, getFeed, getMeta, getTodaysAlpha,
  getSentimentLeaders,
} from "@/lib/queries";

const MK = "cn";          // 本页口径：中概股 + 港股
const TBASE = "/cn/ticker"; // 个股链接前缀

export default function CnOverview({ params }: { params: { lang: string } }) {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const dict = getDictionary(lang);
  const t = dict.dashboard;
  const c = dict.cn;

  const meta = getMeta(MK);
  const mood = getMarketMood(MK);
  const alpha = getTodaysAlpha(3, MK);
  const mind = getMindshare(12, MK);
  const leaders = getSentimentLeaders(MK, 5);
  const spikes = getTrending(8, false, MK);
  const narratives = getNarratives(6, MK);
  const feed = getFeed({ limit: 6, market: MK });
  const maxShare = mind[0]?.mindshare || 1;

  return (
    <div className="space-y-4">
      {/* 头牌：今日中概·港股 Alpha */}
      <TodaysAlpha alphas={alpha} tickerBase={TBASE} />

      {/* Masthead */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pb-4 border-b border-line">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-reddit">
            <IconYuan className="w-4 h-4" />
            <Eyebrow color="text-reddit">{c.eyebrow}</Eyebrow>
          </div>
          <h1 className="mt-1.5 font-display font-extrabold text-cream text-[26px] leading-none tracking-tight">
            {c.heading}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500 leading-relaxed">{c.subtitle}</p>
        </div>
        <div className="flex items-stretch rounded-lg ring-1 ring-inset ring-white/[.06] bg-white/[.012] divide-x divide-line">
          {mood && (
            <KPI label={t.kpiMood} value={mood.label} sub={`${mood.mood_score > 0 ? "+" : ""}${mood.mood_score.toFixed(2)}`} tone={sentTextClass(mood.mood_score)} />
          )}
          <KPI label={t.kpiTickers} value={fmtInt(meta.tickers)} />
          <KPI label={t.kpiPosts} value={fmtInt(meta.posts)} />
          <KPI label={t.kpiMentions} value={fmtInt(meta.mentions)} />
        </div>
      </div>

      <AdSlot variant="banner" slot="cn-mid" />

      {/* 第一行：热度榜（收窄至 1/2）+ 右列堆叠：市场情绪 / 多空风向标 */}
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel className="p-5">
          <SectionTitle title={t.topTitle} hint={t.topHint} />
          <div className="space-y-1">
            {mind.map((r, i) => (
              <LocaleLink
                key={r.ticker}
                href={`${TBASE}/${r.ticker}`}
                className="grid grid-cols-[20px_88px_1fr_auto] sm:grid-cols-[24px_96px_1fr_96px_56px] items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[.03] transition group"
              >
                <span className="flex justify-end">
                  {i < 3 ? (
                    <span className={`grid place-items-center w-5 h-5 rounded-full text-[10px] font-extrabold metal-fill ${i === 0 ? "m-gold" : i === 1 ? "m-silver" : "m-bronze"}`}>{i + 1}</span>
                  ) : (
                    <span className="text-xs text-neutral-600 tabular">{i + 1}</span>
                  )}
                </span>
                <span className="font-mono font-semibold text-cream group-hover:text-amber transition truncate">{r.ticker}</span>
                <span className="hidden sm:block text-sm text-neutral-500 truncate">{r.name}</span>
                <div className="flex items-center gap-2">
                  <MiniBar pct={(r.mindshare / maxShare) * 100} />
                  <span className="font-mono text-xs text-neutral-300 tabular w-11 text-right">{r.mindshare.toFixed(1)}%</span>
                </div>
                <span className="text-right text-xs hidden sm:block"><ScoreNum score={r.sentiment} /></span>
              </LocaleLink>
            ))}
            {mind.length === 0 && <Empty pre={t.emptyPre} />}
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel className="p-5 flex flex-col">
            <h2 className="font-display font-bold text-cream mb-1">{t.moodTitle}</h2>
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
                    <span className="text-bull">{t.moodBull} {mood.bull_pct.toFixed(0)}%</span>
                    <span className="text-neutral-500">{t.moodNeutral} {mood.neutral_pct.toFixed(0)}%</span>
                    <span className="text-bear">{t.moodBear} {mood.bear_pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-line grid grid-cols-2 gap-3 text-sm">
                  <Stat label={t.windowPosts} value={fmtInt(mood.total_posts)} />
                  <Stat label={t.windowMentions} value={fmtInt(mood.total_mentions)} />
                </div>
              </>
            ) : (
              <Empty pre={t.emptyPre} />
            )}
          </Panel>

          {/* 多空风向标：窗口内最看多 / 最看空的具体标的 */}
          <Panel className="p-5">
            <SectionTitle title={t.leadersTitle} hint={t.leadersHint} />
            {leaders.bullish.length || leaders.bearish.length ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                {([
                  { label: t.leadersBull, dot: "bg-bull", rows: leaders.bullish },
                  { label: t.leadersBear, dot: "bg-bear", rows: leaders.bearish },
                ] as const).map((col) => (
                  <div key={col.label}>
                    <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                      {col.label}
                    </div>
                    <div className="space-y-0.5">
                      {col.rows.length ? (
                        col.rows.map((r) => (
                          <LocaleLink
                            key={r.ticker}
                            href={`${TBASE}/${r.ticker}`}
                            className="flex items-center justify-between gap-2 px-1.5 py-1 rounded-md hover:bg-white/[.03] transition group"
                          >
                            <span className="font-mono text-sm font-semibold text-cream group-hover:text-amber transition truncate">{r.ticker}</span>
                            <span className="text-xs shrink-0"><ScoreNum score={r.sentiment} /></span>
                          </LocaleLink>
                        ))
                      ) : (
                        <div className="px-1.5 py-1 text-xs text-neutral-600">{t.leadersEmpty}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-neutral-600 py-4 text-center">{t.leadersEmpty}</div>
            )}
          </Panel>
        </div>
      </div>

      {/* 第二行：异动飙升 + 主导叙事 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="p-5">
          <SectionTitle title={t.spikeTitle} />
          <div className="space-y-1">
            {spikes.map((x) => (
              <LocaleLink
                key={x.ticker}
                href={`${TBASE}/${x.ticker}`}
                className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-white/[.03] transition group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {x.spike ? <IconFlame className="w-4 h-4 text-amber shrink-0" /> : <span className="w-4" />}
                  <span className="font-mono font-semibold text-cream group-hover:text-amber transition truncate">{x.ticker}</span>
                  <span className="text-xs text-neutral-600 tabular">{x.mentions}{t.mentionsSuffix}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-amber tabular">z {x.zscore > 0 ? "+" : ""}{x.zscore.toFixed(1)}</span>
                  <span className="text-xs"><ScoreNum score={x.sentiment} /></span>
                </div>
              </LocaleLink>
            ))}
            {spikes.length === 0 && <div className="px-2 py-6 text-sm text-neutral-600">—</div>}
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <SectionTitle title={t.narrativesTitle} />
          <div className="grid sm:grid-cols-2 gap-4">
            {narratives.map((n) => (
              <NarrativeCard key={n.id} n={n} tickerBase={TBASE} />
            ))}
          </div>
        </div>
      </div>

      {/* 高质量 DD 帖 */}
      <div>
        <SectionTitle title={t.ddTitle} />
        <div className="grid md:grid-cols-2 gap-4">
          {feed.map((p) => (
            <FeedCard key={p.id} p={p} tickerBase={TBASE} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, tone = "text-cream" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="px-4 py-2">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className={`font-display font-bold text-lg tabular leading-none ${tone}`}>{value}</span>
        {sub && <span className={`font-mono text-xs tabular ${tone}`}>{sub}</span>}
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

function Empty({ pre }: { pre: string }) {
  return <div className="text-sm text-neutral-600 py-8 text-center">{pre}<code className="text-amber">make cn-backfill</code></div>;
}
