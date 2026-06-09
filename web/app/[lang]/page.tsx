import { LocaleLink } from "@/components/i18n/LocaleLink";
import { IconUpvote, IconArrow } from "@/components/icons";
import { RedditMark } from "@/components/reddit";
import { fmtInt, fmtCompact, subColor } from "@/lib/format";
import { getLandingStats } from "@/lib/queries";
import { getDictionary, isLocale, defaultLocale, type Locale } from "@/lib/i18n";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

const FALLBACK_SUBS = [
  { id: "wallstreetbets", subscribers: 20043788 },
  { id: "stocks", subscribers: 9268383 },
  { id: "stockmarket", subscribers: 4067736 },
  { id: "investing", subscribers: 3388641 },
  { id: "options", subscribers: 1414521 },
  { id: "valueinvesting", subscribers: 752379 },
  { id: "thetagang", subscribers: 331918 },
  { id: "securityanalysis", subscribers: 210051 },
];

export default function Landing({ params }: { params: { lang: string } }) {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const t = getDictionary(lang).landing;

  const s = getLandingStats();
  const subs = s.subs.length ? s.subs : FALLBACK_SUBS;
  const totalSubscribers =
    s.totalSubscribers || FALLBACK_SUBS.reduce((a, c) => a + c.subscribers, 0);
  const subsValue = lang === "zh" ? `${fmtInt(Math.round(totalSubscribers / 1e4))}万` : fmtCompact(totalSubscribers);
  const posts = s.posts || 1176;
  const tickers = s.tickers || 50;
  const authors = s.authors || 848;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto theme-canvas">
      <div className="min-h-[100dvh] grid lg:grid-cols-[1.05fr_0.95fr]">
        {/* ============ 左：网站价值 ============ */}
        <aside className="hidden lg:flex flex-col justify-between p-10 xl:p-14 border-r border-line/70">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg overflow-hidden bg-white shrink-0 ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${BASE}/logo.png`} alt="redditalpha" className="w-full h-full object-contain" />
            </span>
            <span className="font-display font-extrabold text-cream text-[18px] tracking-tight">
              reddit<span className="text-reddit">alpha</span>
            </span>
          </div>

          <div className="py-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ring-inset ring-white/10 bg-white/[.03] text-neutral-300">
              <IconUpvote className="w-3.5 h-3.5 text-reddit" />
              {t.badge}
            </div>

            <h1 className="mt-6 font-display font-extrabold text-cream tracking-tight leading-[1.1] text-[clamp(30px,3.4vw,46px)]">
              {t.titleLead}
              <br />
              <span className="metal-text m-gold">{t.titleGold}</span>
              {t.titleTail}
            </h1>
            <p className="mt-4 text-neutral-400 leading-relaxed text-[15px]">
              {t.ledePre}
              <span className="text-cream font-medium">{t.ledeStrong}</span>
              {t.ledePost}
            </p>

            <ul className="mt-8 space-y-5">
              <ProofRow
                emoji="💎"
                metric="$53K → $48M"
                metricClass="metal-text m-gold"
                text={
                  <>
                    {t.p1Pre}
                    <span className="text-gold">{t.p1Quote}</span>
                  </>
                }
              />
              <ProofRow emoji="🔥" metric="$17 → $483" metricClass="text-reddit" text={t.p2} />
              <ProofRow emoji="🧠" metric={t.p3Metric} metricClass="metal-text m-silver" text={t.p3} />
            </ul>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Stat big={String(subs.length)} label={t.statCommunities} />
              <Stat big={subsValue} label={t.statSubscribers} />
              <Stat big={fmtInt(posts)} label={t.statPosts} />
              <Stat big={String(tickers)} label={t.statTickers} />
              <Stat big={fmtInt(authors)} label={t.statAuthors} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {subs.slice(0, 8).map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 ring-1 ring-inset ring-white/10 bg-white/[.025]"
                >
                  <span
                    className="grid place-items-center w-4 h-4 rounded-full text-white text-[9px] font-bold shrink-0"
                    style={{ background: subColor(c.id) }}
                  >
                    {c.id[0]?.toUpperCase()}
                  </span>
                  <span className="text-[12px] text-neutral-300">r/{c.id}</span>
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* ============ 右：进入 ============ */}
        <main className="flex flex-col justify-center items-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[400px]">
            <div className="flex items-center justify-center gap-2.5 mb-6 lg:hidden">
              <span className="w-9 h-9 rounded-lg overflow-hidden bg-white shrink-0 ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${BASE}/logo.png`} alt="redditalpha" className="w-full h-full object-contain" />
              </span>
              <span className="font-display font-extrabold text-cream text-xl tracking-tight">
                reddit<span className="text-reddit">alpha</span>
              </span>
            </div>

            <div className="panel rounded-2xl p-7 sm:p-8">
              <h2 className="font-display font-bold text-cream text-[22px] text-center tracking-tight">{t.enterTitle}</h2>
              <p className="mt-2 text-sm text-neutral-500 text-center leading-relaxed">{t.enterDesc}</p>
              <LocaleLink
                href="/dashboard"
                className="group mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 font-display font-bold text-white text-[15px] shadow-lg shadow-reddit/30 ring-1 ring-inset ring-white/15 hover:brightness-110 transition"
                style={{ backgroundImage: "var(--grad-brand)" }}
              >
                {t.enterCta}
                <IconArrow className="w-4 h-4 transition group-hover:translate-x-0.5" />
              </LocaleLink>
            </div>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-neutral-600">
              <RedditMark size={14} />
              <span>{t.footer}</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProofRow({
  emoji,
  metric,
  metricClass,
  text,
}: {
  emoji: string;
  metric: string;
  metricClass: string;
  text: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3.5">
      <span className="mt-0.5 text-xl leading-none shrink-0">{emoji}</span>
      <div>
        <div className={`font-display font-extrabold text-lg leading-none tracking-tight ${metricClass}`}>{metric}</div>
        <p className="mt-1.5 text-[13px] text-neutral-400 leading-relaxed">{text}</p>
      </div>
    </li>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div>
      <div className="font-display font-extrabold text-cream text-[22px] leading-none tabular tracking-tight">{big}</div>
      <div className="mt-1 text-[11px] text-neutral-500">{label}</div>
    </div>
  );
}
