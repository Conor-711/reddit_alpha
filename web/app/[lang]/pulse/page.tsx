import { PulseCard } from "@/components/PulseCard";
import { SubredditChip, TickerChip, ScoreNum } from "@/components/ui";
import { IconSearch } from "@/components/icons";
import { AdSlot } from "@/components/AdSlot";
import { hhmm, REDDIT } from "@/lib/format";
import { getFeed } from "@/lib/queries";
import { getDictionary, isLocale, defaultLocale, type Locale } from "@/lib/i18n";

export default function PulsePage({ params }: { params: { lang: string } }) {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const d = getDictionary(lang);
  const t = d.pulse;

  const stories = getFeed({ limit: 12 });
  const events = [...getFeed({ limit: 60 })].sort((a, b) => b.created.localeCompare(a.created)).slice(0, 26);

  const now = new Date();
  const dd = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="space-y-3 pb-3 border-b border-line">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <h1 className="font-display font-extrabold text-cream text-2xl tracking-tight">{t.title}</h1>
          <span className="font-display font-bold text-xl">
            <span className="metal-text m-gold">{dd}</span> <span className="text-neutral-500">{wd}</span>
          </span>
          <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-70" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-bull" />
            </span>
            {t.live}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {t.tabs.map((label, idx) => (
            <span
              key={label}
              className={`text-xs px-3 py-1.5 rounded-full ${
                idx === 0 ? "bg-reddit/15 text-reddit font-semibold" : "bg-white/[.04] text-neutral-400"
              }`}
            >
              {label}
            </span>
          ))}
          <span className="ml-1 grid place-items-center w-7 h-7 rounded-full bg-white/[.04] text-neutral-400">
            <IconSearch className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* 双区：渐变故事卡 + 实时流 */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* 主区：渐变波浪故事卡 */}
        <div className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-4">
            {stories.flatMap((p, i) =>
              i === 4
                ? [
                    <AdSlot key="ad-infeed" variant="inline" slot="pulse-infeed" />,
                    <PulseCard key={p.id} p={p} i={i} />,
                  ]
                : [<PulseCard key={p.id} p={p} i={i} />]
            )}
          </div>
        </div>

        {/* 右栏：实时流 */}
        <aside>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-reddit opacity-70" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-reddit" />
              </span>
              <h2 className="font-display font-bold text-cream">{t.feedTitle}</h2>
            </div>
            <IconSearch className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {t.feedTabs.map((label, idx) => (
              <span
                key={label}
                className={`text-[11px] px-2.5 py-1 rounded-full ${
                  idx === 0 ? "bg-white/10 text-cream font-medium" : "bg-white/[.03] text-neutral-500"
                }`}
              >
                {label}
              </span>
            ))}
          </div>

          {/* 广告位（侧栏矩形） */}
          <AdSlot variant="rectangle" slot="pulse-rail" className="mb-3" />

          <div className="space-y-3 text-xs">
            {events.map((p) => (
              <div key={p.id} className="flex gap-2.5">
                <div className="w-9 shrink-0 pt-2.5 text-right">
                  <div className="font-mono text-[11px] text-neutral-500 tabular">{hhmm(p.created)}</div>
                </div>
                <div className="flex-1 min-w-0 panel rounded-xl p-3 panel-hover">
                  <div className="flex items-center justify-between gap-2">
                    <SubredditChip name={p.subreddit} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[.06] text-neutral-400 shrink-0">
                      {p.themes[0] || p.flair || d.common.discuss}
                    </span>
                  </div>
                  <a
                    href={`${REDDIT}${p.permalink}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 block text-[13px] font-medium text-cream hover:text-reddit transition leading-snug line-clamp-2"
                  >
                    {p.title}
                  </a>
                  {p.tldr && <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed line-clamp-2">{p.tldr}</p>}
                  <div className="mt-2 flex items-center gap-1.5">
                    {p.tickers.slice(0, 2).map((t) => (
                      <TickerChip key={t.ticker} ticker={t.ticker} size="xs" />
                    ))}
                    <span className="ml-auto text-[11px]">
                      <ScoreNum score={p.sentiment} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
