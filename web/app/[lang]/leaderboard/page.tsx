import { Panel, ScoreNum, MiniBar, Avatar, PageHeader, HeaderStat } from "@/components/ui";
import { fmtInt, fmtCompact } from "@/lib/format";
import { getLeaderboard } from "@/lib/queries";
import { getDictionary, isLocale, defaultLocale, type Locale } from "@/lib/i18n";

export default function LeaderboardPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const t = getDictionary(lang).leaderboard;
  const rows = getLeaderboard(25);
  const maxScore = Math.max(1, ...rows.map((r) => r.score || 0));
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t.eyebrow}
        eyebrowColor="text-bull"
        title={t.title}
        subtitle={t.subtitle}
        right={<HeaderStat label={t.stat} value={String(rows.length)} tone="text-bull" />}
      />

      <Panel className="p-2 sm:p-4">
        <div className="grid grid-cols-[36px_1fr_80px_72px_64px] sm:grid-cols-[44px_1fr_160px_100px_90px] items-center gap-3 px-3 py-2 text-[11px] text-neutral-500 uppercase tracking-wide">
          <span className="text-right">#</span>
          <span>{t.colAuthor}</span>
          <span className="text-right">{t.colKarma}</span>
          <span className="text-right">{t.colPosts}</span>
          <span className="text-right">{t.colSentiment}</span>
        </div>
        <div className="space-y-0.5">
          {rows.map((r, i) => (
            <div key={r.author} className="grid grid-cols-[36px_1fr_80px_72px_64px] sm:grid-cols-[44px_1fr_160px_100px_90px] items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[.03] transition">
              <span className="flex justify-end">
                {i < 3 ? (
                  <span className={`grid place-items-center w-6 h-6 rounded-full text-[11px] font-extrabold metal-fill ${i === 0 ? "m-gold" : i === 1 ? "m-silver" : "m-bronze"}`}>
                    {i + 1}
                  </span>
                ) : (
                  <span className="text-xs text-neutral-600 tabular">{i + 1}</span>
                )}
              </span>
              <span className="flex items-center gap-2 min-w-0">
                <Avatar name={r.author} size={22} />
                <span className="font-medium text-cream truncate">u/{r.author}</span>
              </span>
              <span className="flex items-center gap-2 justify-end">
                <span className="hidden sm:block w-16"><MiniBar pct={((r.score || 0) / maxScore) * 100} color="bg-bull" /></span>
                <span className="font-mono text-sm text-neutral-300 tabular">{fmtCompact(r.score || 0)}</span>
              </span>
              <span className="text-right font-mono text-sm text-neutral-400 tabular">{fmtInt(r.posts)}</span>
              <span className="text-right text-sm"><ScoreNum score={r.sentiment || 0} /></span>
            </div>
          ))}
          {rows.length === 0 && <div className="px-3 py-6 text-sm text-neutral-600">{t.empty}</div>}
        </div>
      </Panel>
    </div>
  );
}
