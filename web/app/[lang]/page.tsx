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
      {/* 顶部品牌 */}
      <header className="flex items-center justify-center sm:justify-start px-6 sm:px-10 h-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg overflow-hidden bg-white shrink-0 ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${BASE}/logo.png`} alt="redditalpha" className="w-full h-full object-contain" />
          </span>
          <span className="font-display font-extrabold text-cream text-[18px] tracking-tight">
            reddit<span className="text-reddit">alpha</span>
          </span>
        </div>
      </header>

      {/* 全屏居中英雄区 */}
      <main className="flex flex-col items-center text-center px-6 pb-16 pt-2 sm:pt-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ring-inset ring-white/10 bg-white/[.03] text-neutral-300">
            <IconUpvote className="w-3.5 h-3.5 text-reddit" />
            {t.badge}
          </div>

          <h1 className="mt-6 font-display font-extrabold text-cream tracking-tight leading-[1.08] text-[clamp(34px,6vw,60px)]">
            {t.titleLead} <span className="metal-text m-gold">{t.titleGold}</span>
            {t.titleTail}
          </h1>

          <p className="mt-5 mx-auto max-w-2xl text-neutral-400 leading-relaxed text-[15px] sm:text-[16px]">
            {t.ledePre}
            <span className="text-cream font-medium">{t.ledeStrong}</span>
            {t.ledePost}
          </p>

          {/* 主 CTA */}
          <div className="mt-8 flex flex-col items-center">
            <LocaleLink
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 font-display font-bold text-white text-[16px] shadow-lg shadow-reddit/30 ring-1 ring-inset ring-white/15 hover:brightness-110 hover:-translate-y-0.5 transition"
              style={{ backgroundImage: "var(--grad-brand)" }}
            >
              {t.enterCta}
              <IconArrow className="w-4 h-4 transition group-hover:translate-x-0.5" />
            </LocaleLink>
            <p className="mt-3 text-[13px] text-neutral-500">{t.enterDesc}</p>
          </div>

          {/* 三条「真实人/事」证据卡 */}
          <div className="mt-12 grid sm:grid-cols-3 gap-4 text-left">
            <ProofCard
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
            <ProofCard emoji="🔥" metric="$17 → $483" metricClass="text-reddit" text={t.p2} />
            <ProofCard emoji="🧠" metric={t.p3Metric} metricClass="metal-text m-silver" text={t.p3} />
          </div>

          {/* 统计条 */}
          <div className="mt-12 flex flex-wrap items-start justify-center gap-x-10 gap-y-4">
            <Stat big={String(subs.length)} label={t.statCommunities} />
            <Stat big={subsValue} label={t.statSubscribers} />
            <Stat big={fmtInt(posts)} label={t.statPosts} />
            <Stat big={String(tickers)} label={t.statTickers} />
            <Stat big={fmtInt(authors)} label={t.statAuthors} />
          </div>

          {/* 社区芯片 */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
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

          {/* 页脚声明 */}
          <div className="mt-10 flex items-center justify-center gap-1.5 text-[11px] text-neutral-600">
            <RedditMark size={14} />
            <span>{t.footer}</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProofCard({
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
    <div className="panel rounded-2xl p-5 h-full">
      <div className="text-2xl leading-none">{emoji}</div>
      <div className={`mt-3 font-display font-extrabold text-xl leading-none tracking-tight ${metricClass}`}>{metric}</div>
      <p className="mt-2.5 text-[13px] text-neutral-400 leading-relaxed">{text}</p>
    </div>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display font-extrabold text-cream text-[24px] leading-none tabular tracking-tight">{big}</div>
      <div className="mt-1.5 text-[11px] text-neutral-500">{label}</div>
    </div>
  );
}
