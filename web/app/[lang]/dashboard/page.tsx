import { LocaleLink } from "@/components/i18n/LocaleLink";
import { Panel, SectionTitle, Eyebrow, MiniBar, ScoreNum } from "@/components/ui";
import { MoodGauge } from "@/components/charts/MoodGauge";
import { FeedCard } from "@/components/FeedCard";
import { NarrativeCard } from "@/components/NarrativeCard";
import { TodaysAlpha } from "@/components/TodaysAlpha";
import { IconFlame, IconWaves } from "@/components/icons";
import { AdSlot } from "@/components/AdSlot";
import { fmtInt, sentTextClass } from "@/lib/format";
import { getDictionary, isLocale, defaultLocale, type Locale } from "@/lib/i18n";
import {
  getMarketMood, getMindshare, getTrending, getNarratives, getFeed, getMeta, getTodaysAlpha,
} from "@/lib/queries";

export default function Overview({ params }: { params: { lang: string } }) {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const t = getDictionary(lang).dashboard;

  const meta = getMeta();
  const mood = getMarketMood();
  const alpha = getTodaysAlpha(3);
  const mind = getMindshare(12);
  const spikes = getTrending(8);
  const narratives = getNarratives(6);
  const feed = getFeed({ limit: 6 });
  const maxShare = mind[0]?.mindshare || 1;

  return (
    <div className="space-y-4">
      {/* 首页头牌：今日 Reddit Alpha（置顶、Reddit 橙主题、视觉最强） */}
      <TodaysAlpha alphas={alpha} />

      {/* Masthead */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-1.5 text-reddit">
            <IconWaves className="w-5 h-3.5" />
            <Eyebrow color="text-reddit">{t.eyebrow}</Eyebrow>
          </div>
          <h1 className="mt-1.5 font-display font-extrabold text-cream text-[26px] leading-none tracking-tight">
            {t.heading}
          </h1>
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

      {/* 广告位（模块间横幅） */}
      <AdSlot variant="banner" slot="dashboard-mid" />

      {/* 第一行：热度榜 + 市场情绪 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2 p-5">
          <SectionTitle title={t.topTitle} hint={t.topHint} />
          <div className="space-y-1">
            {mind.map((r, i) => (
              <LocaleLink
                key={r.ticker}
                href={`/ticker/${r.ticker}`}
                className="grid grid-cols-[20px_64px_1fr_auto] sm:grid-cols-[24px_72px_1fr_120px_64px] items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[.03] transition group"
              >
                <span className="flex justify-end">
                  {i < 3 ? (
                    <span className={`grid place-items-center w-5 h-5 rounded-full text-[10px] font-extrabold metal-fill ${i === 0 ? "m-gold" : i === 1 ? "m-silver" : "m-bronze"}`}>{i + 1}</span>
                  ) : (
                    <span className="text-xs text-neutral-600 tabular">{i + 1}</span>
                  )}
                </span>
                <span className="font-mono font-semibold text-cream group-hover:text-amber transition">{r.ticker}</span>
                <span className="hidden sm:block text-sm text-neutral-500 truncate">{r.name}</span>
                <div className="flex items-center gap-2">
                  <MiniBar pct={(r.mindshare / maxShare) * 100} />
                  <span className="font-mono text-xs text-neutral-300 tabular w-11 text-right">{r.mindshare.toFixed(1)}%</span>
                </div>
                <span className="text-right text-xs hidden sm:block"><ScoreNum score={r.sentiment} /></span>
              </LocaleLink>
            ))}
          </div>
        </Panel>

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
      </div>

      {/* 第二行：异动飙升 + 主导叙事 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="p-5">
          <SectionTitle title={t.spikeTitle} />
          <div className="space-y-1">
            {spikes.map((x) => (
              <LocaleLink
                key={x.ticker}
                href={`/ticker/${x.ticker}`}
                className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-white/[.03] transition group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {x.spike ? <IconFlame className="w-4 h-4 text-amber shrink-0" /> : <span className="w-4" />}
                  <span className="font-mono font-semibold text-cream group-hover:text-amber transition">{x.ticker}</span>
                  <span className="text-xs text-neutral-600 tabular">{x.mentions}{t.mentionsSuffix}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-amber tabular">z {x.zscore > 0 ? "+" : ""}{x.zscore.toFixed(1)}</span>
                  <span className="text-xs"><ScoreNum score={x.sentiment} /></span>
                </div>
              </LocaleLink>
            ))}
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <SectionTitle title={t.narrativesTitle} />
          <div className="grid sm:grid-cols-2 gap-4">
            {narratives.map((n) => (
              <NarrativeCard key={n.id} n={n} />
            ))}
          </div>
        </div>
      </div>

      {/* 高质量 DD 帖（getFeed 已按 quality 排序） */}
      <div>
        <SectionTitle title={t.ddTitle} />
        <div className="grid md:grid-cols-2 gap-4">
          {feed.map((p) => (
            <FeedCard key={p.id} p={p} />
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
  return <div className="text-sm text-neutral-600 py-8 text-center">{pre}<code className="text-amber">make demo</code></div>;
}
