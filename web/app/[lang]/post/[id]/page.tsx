import type { Metadata } from "next";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { notFound } from "next/navigation";
import { Panel, SubredditChip, Avatar, SentPill, TickerChip, ThemeTag } from "@/components/ui";
import { MarkdownLite } from "@/components/MarkdownLite";
import { Comments } from "@/components/Comments";
import { TranslateToggle } from "@/components/TranslateToggle";
import { AdSlot } from "@/components/AdSlot";
import { ShareBar } from "@/components/ShareBar";
import { IconUpvote, IconComment, IconDoc } from "@/components/icons";
import { timeAgo, fmtCompact, fmtInt, REDDIT } from "@/lib/format";
import { getPostDetail, getAllPostIds } from "@/lib/queries";
import { getDictionary, isLocale, defaultLocale, type Locale, type Dictionary } from "@/lib/i18n";
import { SITE_URL, OG_IMAGE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPostIds().map((id) => ({ id }));
}

// 帖子页独立 OG / Twitter 卡片：分享到社媒展开富预览，带来免费流量。
export function generateMetadata({ params }: { params: { lang: string; id: string } }): Metadata {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const d = getPostDetail(params.id);
  if (!d) return {};
  const zh = lang === "zh";
  const rawTitle = (zh && d.post.title_zh) ? d.post.title_zh : d.post.title;
  const title = `${rawTitle.slice(0, 90)} | redditalpha`;
  const desc =
    (zh && d.analysis?.tldr_zh ? d.analysis.tldr_zh : d.analysis?.tldr) ||
    (zh ? "Reddit 财经社区的真实讨论与 AI 多空提炼。" : "Real discussion and AI-distilled bull/bear takes from Reddit.");
  const url = `${SITE_URL}/${lang}/post/${params.id}/`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title, description: desc, url, siteName: "redditalpha", type: "article", images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description: desc, images: [OG_IMAGE] },
  };
}

export default function PostPage({ params }: { params: { lang: string; id: string } }) {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const t = getDictionary(lang).post;
  const sh = getDictionary(lang).share;
  const d = getPostDetail(params.id);
  if (!d) notFound();
  const { post, analysis, comments } = d;
  const hasAI = analysis && (analysis.tldr || analysis.bull.length > 0 || analysis.bear.length > 0);
  const isZh = lang === "zh";
  // 标题 + AI 摘要直接给中文；正文 / 评论用「译文 / 原文」切换按钮（不再看广告解锁）。
  const postTitle = isZh && post.title_zh ? post.title_zh : post.title;
  const aiTldr = isZh && analysis?.tldr_zh ? analysis.tldr_zh : analysis?.tldr ?? "";
  const aiBull = isZh && analysis?.bull_zh.length ? analysis.bull_zh : analysis?.bull ?? [];
  const aiBear = isZh && analysis?.bear_zh.length ? analysis.bear_zh : analysis?.bear ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <LocaleLink href="/dashboard" className="text-xs text-neutral-500 hover:text-reddit transition">{t.back}</LocaleLink>
        <ShareBar path={`/${lang}/post/${post.id}`} text={sh.postText.replace("{s}", postTitle)} ticker={analysis?.tickers?.[0]?.ticker} />
      </div>

      {/* ① 标题 / 帖头 —— masthead（投票轨 + 元信息 + 标题） */}
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

      {/* ② AI 投资者摘要 —— 橙色主题（结论先行） */}
      {hasAI && (
        <Panel
          className="p-5 sm:p-6"
          style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,69,0,0.28), var(--panel-shadow)", background: "linear-gradient(180deg, rgba(255,69,0,0.045), transparent 40%), var(--panel-bg)" }}
        >
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-reddit/15">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-reddit text-white text-[11px] font-extrabold shrink-0 shadow-sm shadow-reddit/40">AI</span>
            <span className="font-display font-bold text-cream text-[15px]">{t.aiSummary}</span>
            {analysis!.stance && <SentPill stance={analysis!.stance} className="ml-auto" />}
          </div>
          {aiTldr && <p className="text-[15px] text-cream leading-relaxed">{aiTldr}</p>}
          {(aiBull.length > 0 || aiBear.length > 0) && (
            <div className="mt-4 grid sm:grid-cols-2 gap-x-5 gap-y-3">
              <PointList t={t} tone="bull" items={aiBull} />
              <PointList t={t} tone="bear" items={aiBear} />
            </div>
          )}
          {(analysis!.tickers.length > 0 || analysis!.themes.length > 0) && (
            <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center gap-1.5">
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

      {/* 广告位（原「看广告解锁翻译」的广告改为此处静态占位；可手动关闭） */}
      <AdSlot variant="banner" slot="post-mid" />

      {/* ③ 帖子正文 —— 金色主题（原始素材，阅读区） */}
      {post.selftext ? (
        <Panel className="p-5 sm:p-7">
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-gold/20">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-gold/15 text-gold shrink-0">
              <IconDoc className="w-4 h-4" />
            </span>
            <span className="font-display font-bold text-cream text-[15px]">{t.bodyTitle}</span>
          </div>
          <TranslateToggle
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

      {/* ④ 讨论 / 评论 —— 绿色主题（社区） */}
      <Panel className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-bull/15">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-bull/15 text-bull shrink-0">
            <IconComment className="w-4 h-4" />
          </span>
          <span className="font-display font-bold text-cream text-[15px]">{t.discussion}</span>
          {comments.length > 0 && (
            <span className="ml-auto text-xs text-neutral-500 shrink-0">{comments.length} {t.commentsCount}</span>
          )}
        </div>
        <TranslateToggle
          hasZh={comments.some((c) => !!c.body_zh)}
          original={<Comments comments={comments} showZh={false} />}
          zh={<Comments comments={comments} showZh={true} />}
        />
      </Panel>

      {/* 原帖（次要入口） */}
      <div className="pt-1 pb-4 text-center">
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
