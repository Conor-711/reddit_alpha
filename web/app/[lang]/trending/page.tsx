import { LocaleLink } from "@/components/i18n/LocaleLink";
import { Panel, ScoreNum, PageHeader, HeaderStat } from "@/components/ui";
import { IconFlame } from "@/components/icons";
import { AdSlot } from "@/components/AdSlot";
import { getTrending } from "@/lib/queries";
import { getDictionary, isLocale, defaultLocale, type Locale } from "@/lib/i18n";

export default function TrendingPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const t = getDictionary(lang).trending;
  const rows = getTrending(50);
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        right={<HeaderStat label={t.spikeStat} value={String(rows.filter((r) => r.spike).length)} tone="text-reddit" />}
      />

      <AdSlot variant="banner" slot="trending-top" />

      <Panel className="p-2 sm:p-4">
        <div className="grid grid-cols-[36px_1fr_72px_72px_64px] sm:grid-cols-[44px_1fr_120px_100px_100px] items-center gap-3 px-3 py-2 text-[11px] text-neutral-500 uppercase tracking-wide">
          <span className="text-right">#</span>
          <span>{t.colTicker}</span>
          <span className="text-right">{t.colMentions}</span>
          <span className="text-right">{t.colZscore}</span>
          <span className="text-right">{t.colSentiment}</span>
        </div>
        <div className="space-y-0.5">
          {rows.map((x) => (
            <LocaleLink
              key={x.ticker}
              href={`/ticker/${x.ticker}`}
              className="grid grid-cols-[36px_1fr_72px_72px_64px] sm:grid-cols-[44px_1fr_120px_100px_100px] items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[.03] transition group"
            >
              <span className="text-right text-xs text-neutral-600 tabular">{x.rank}</span>
              <span className="flex items-center gap-2 min-w-0">
                {x.spike ? <IconFlame className="w-4 h-4 text-amber shrink-0" /> : <span className="w-4 shrink-0" />}
                <span className="font-mono font-semibold text-cream group-hover:text-amber transition">{x.ticker}</span>
                <span className="hidden sm:inline text-sm text-neutral-500 truncate">{x.name}</span>
              </span>
              <span className="text-right font-mono text-sm text-neutral-300 tabular">{x.mentions}</span>
              <span className="text-right font-mono text-sm text-amber tabular">{x.zscore > 0 ? "+" : ""}{x.zscore.toFixed(2)}</span>
              <span className="text-right text-sm"><ScoreNum score={x.sentiment} /></span>
            </LocaleLink>
          ))}
        </div>
      </Panel>
    </div>
  );
}
