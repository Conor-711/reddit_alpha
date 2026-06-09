import { LocaleLink } from "@/components/i18n/LocaleLink";
import { notFound } from "next/navigation";
import { Panel, Eyebrow, SubredditChip, Avatar, SentPill, TickerChip, ThemeTag } from "@/components/ui";
import { MarkdownLite } from "@/components/MarkdownLite";
import { Comments } from "@/components/Comments";
import { TranslateGate } from "@/components/TranslateGate";
import { IconUpvote, IconComment } from "@/components/icons";
import { timeAgo, fmtCompact, fmtInt, REDDIT } from "@/lib/format";
import { getPostDetail, getAllPostIds } from "@/lib/queries";
import { getDictionary, isLocale, defaultLocale, type Locale, type Dictionary } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPostIds().map((id) => ({ id }));
}

export default function PostPage({ params }: { params: { lang: string; id: string } }) {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const t = getDictionary(lang).post;
  const d = getPostDetail(params.id);
  if (!d) notFound();
  const { post, analysis, comments } = d;
  const hasAI = analysis && (analysis.tldr || analysis.bull.length > 0 || analysis.bear.length > 0);
  const isZh = lang === "zh";
  // 标题 + AI 摘要：直接给中文（免费预览）；正文 / 评论：看广告解锁（TranslateGate）。
  const postTitle = isZh && post.title_zh ? post.title_zh : post.title;
  const aiTldr = isZh && analysis?.tldr_zh ? analysis.tldr_zh : analysis?.tldr ?? "";
  const aiBull = isZh && analysis?.bull_zh.length ? analysis.bull_zh : analysis?.bull ?? [];
  const aiBear = isZh && analysis?.bear_zh.length ? analysis.bear_zh : analysis?.bear ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <LocaleLink href="/dashboard" className="text-xs text-neutral-500 hover:text-reddit transition">{t.back}</LocaleLink>

      {/* 帖头 */}
      <Panel className="p-5 sm:p-6 flex gap-4">
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-12">
          <IconUpvote className="w-5 h-5 text-reddit" />
          <span className="font-mono font-bold text-reddit tabular leading-none">{fmtCompact(post.score)}</span>
          {post.upvote_ratio > 0 && (
            <span className="text-[10px] text-neutral-500 mt-0.5">{Math.round(post.upvote_ratio * 100)}%</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            <SubredditChip name={post.subreddit} />
            {post.author && (
              <span className="inline-flex items-center gap-1">
                · <Avatar name={post.author} size={15} /> u/{post.author}
              </span>
            )}
            <span>· {timeAgo(post.created, lang)}</span>
            {post.flair && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/[.06] text-neutral-400 text-[10px] font-medium">{post.flair}</span>
            )}
            <span className="inline-flex items-center gap-1">
              <IconComment className="w-3.5 h-3.5" /> {fmtInt(post.comments)}
            </span>
          </div>
          <h1 className="mt-2 font-display font-extrabold text-cream text-[22px] sm:text-[24px] leading-snug tracking-tight">
            {postTitle}
          </h1>
        </div>
      </Panel>

      {/* AI 投资者摘要：先给结论，方便快速判断 */}
      {hasAI && (
        <Panel className="p-5" style={{ boxShadow: "inset 0 0 0 1px rgba(255,69,0,0.18), var(--panel-shadow)" }}>
          <div className="flex items-center gap-2">
            <Eyebrow color="text-reddit">{t.aiSummary}</Eyebrow>
            {analysis!.stance && <SentPill stance={analysis!.stance} />}
          </div>
          {aiTldr && <p className="mt-2 text-[15px] text-cream leading-relaxed">{aiTldr}</p>}
          {(aiBull.length > 0 || aiBear.length > 0) && (
            <div className="mt-3.5 grid sm:grid-cols-2 gap-x-5 gap-y-3">
              <PointList t={t} tone="bull" items={aiBull} />
              <PointList t={t} tone="bear" items={aiBear} />
            </div>
          )}
          {(analysis!.tickers.length > 0 || analysis!.themes.length > 0) && (
            <div className="mt-3.5 pt-3 border-t border-line flex flex-wrap items-center gap-1.5">
              {analysis!.tickers.slice(0, 8).map((tk) => (
                <TickerChip key={tk.ticker} ticker={tk.ticker} size="xs" />
              ))}
              {analysis!.themes.slice(0, 6).map((th) => (
                <ThemeTag key={th}>{th}</ThemeTag>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* 正文 */}
      {post.selftext ? (
        <Panel className="p-5 sm:p-7">
          <TranslateGate
            hasZh={!!post.selftext_zh}
            original={<MarkdownLite md={post.selftext_fmt || post.selftext} size="base" />}
            zh={<MarkdownLite md={post.selftext_zh} size="base" />}
          />
        </Panel>
      ) : (
        <Panel className="p-5 text-sm text-neutral-500">
          {t.noSelftext}
          {post.permalink && (
            <a href={`${REDDIT}${post.permalink}`} target="_blank" rel="noreferrer" className="ml-1 text-reddit hover:underline">
              {t.viewLink}
            </a>
          )}
        </Panel>
      )}

      {/* 讨论 */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-1 h-3.5 rounded-full bg-reddit" />
            <h2 className="font-display font-bold text-cream text-[15px] tracking-tight">{t.discussion}</h2>
          </div>
          <div className="h-px flex-1 bg-line/70" />
          {comments.length > 0 && <span className="text-xs text-neutral-600 shrink-0">{comments.length} {t.commentsCount}</span>}
        </div>
        <TranslateGate
          hasZh={comments.some((c) => !!c.body_zh)}
          original={<Comments comments={comments} showZh={false} />}
          zh={<Comments comments={comments} showZh={true} />}
        />
      </div>

      {/* 原帖（次要入口） */}
      <div className="pt-2 pb-4 text-center">
        <a
          href={`${REDDIT}${post.permalink}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-500 hover:text-reddit transition"
        >
          {t.viewOnReddit}
        </a>
      </div>
    </div>
  );
}

function PointList({ t, tone, items }: { t: Dictionary["post"]; tone: "bull" | "bear"; items: string[] }) {
  if (!items.length) return null;
  const color = tone === "bull" ? "text-bull" : "text-bear";
  const dot = tone === "bull" ? "bg-bull" : "bg-bear";
  return (
    <div>
      <div className={`text-xs font-semibold ${color} mb-1.5`}>{tone === "bull" ? t.bullPoints : t.bearPoints}</div>
      <ul className="space-y-1.5">
        {items.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm text-neutral-300 leading-relaxed">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
