"use client";

// 个人主页（私密空间）：仅本人可见的收藏与追踪。
// 未登录 → 跳 /login（沿用 account 页门禁范式）。数据全部客户端从 Supabase 拉取（user_collections）。
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { withLang, type Locale, type Dictionary } from "@/lib/i18n";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { SaveButton } from "@/components/favorites/SaveButton";
import { displayName, avatarUrl } from "@/lib/auth";
import {
  listCollection,
  type CollectionKind,
  type CollectionRow,
  type PostSnapshot,
  type CommentSnapshot,
} from "@/lib/favorites";
import { Panel, SubredditChip, TickerChip, Avatar } from "@/components/ui";
import { CommunityIcon } from "@/components/CommunityIcon";
import { timeAgo } from "@/lib/format";

const TAB_KINDS: CollectionKind[] = ["post", "comment", "subreddit", "ticker", "author"];

export function ProfileView() {
  const { lang, dict } = useLocale();
  const p = dict.profile;
  const { user, loading } = useAuth();
  const { version, countOf } = useFavorites();
  const router = useRouter();
  const [kind, setKind] = useState<CollectionKind>("post");
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [busy, setBusy] = useState(true);

  // 门禁：未登录跳登录页
  useEffect(() => {
    if (!loading && !user) router.replace(withLang(lang, "/login"));
  }, [loading, user, router, lang]);

  // 当前标签的数据（user / kind / version 任一变化都重拉，保证取消收藏后即时刷新）
  useEffect(() => {
    let active = true;
    if (!user) {
      setRows([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    listCollection(user.id, kind).then((r) => {
      if (!active) return;
      setRows(r);
      setBusy(false);
    });
    return () => {
      active = false;
    };
  }, [user, kind, version]);

  if (loading || !user) {
    return <div className="py-24 text-center text-sm text-neutral-500">{p.loading}</div>;
  }

  const name = displayName(user);
  const avatar = avatarUrl(user);

  const label = (k: CollectionKind) =>
    k === "post" ? p.tabPosts
    : k === "comment" ? p.tabComments
    : k === "subreddit" ? p.tabCommunities
    : k === "ticker" ? p.tabTickers
    : p.tabAuthors;
  const emptyText = (k: CollectionKind) =>
    k === "post" ? p.emptyPosts
    : k === "comment" ? p.emptyComments
    : k === "subreddit" ? p.emptyCommunities
    : k === "ticker" ? p.emptyTickers
    : p.emptyAuthors;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <header>
        <h1 className="font-display font-extrabold text-cream text-2xl">{p.title}</h1>
        <p className="mt-1 text-sm text-neutral-500">{p.subtitle}</p>
      </header>

      <Panel className="p-5 flex items-center gap-4">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover ring-1 ring-white/10" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid place-items-center w-14 h-14 rounded-full bg-reddit/90 text-white text-xl font-bold ring-1 ring-white/10">
            {(name.charAt(0) || "U").toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-cream text-lg truncate">{name}</div>
          <div className="text-sm text-neutral-500 truncate">{user.email}</div>
        </div>
        <LocaleLink href="/account" className="text-xs text-neutral-400 hover:text-reddit transition shrink-0">
          {p.accountSettings} →
        </LocaleLink>
      </Panel>

      {/* 标签栏（计数取自全局已加载的 keys） */}
      <div className="flex flex-wrap gap-1.5 border-b border-line pb-2">
        {TAB_KINDS.map((k) => {
          const active = k === kind;
          const n = countOf(k);
          return (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                active ? "bg-reddit/12 text-reddit" : "text-neutral-400 hover:text-cream hover:bg-white/5"
              }`}
            >
              {label(k)}
              {n > 0 && (
                <span className={`ml-1.5 text-[11px] tabular ${active ? "text-reddit" : "text-neutral-600"}`}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 内容 */}
      {busy ? (
        <div className="py-16 text-center text-sm text-neutral-500">{p.loading}</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-neutral-500">{emptyText(kind)}</div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <CollectionItem key={`${r.kind}:${r.ref_id}`} row={r} lang={lang} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionItem({ row, lang, p }: { row: CollectionRow; lang: Locale; p: Dictionary["profile"] }) {
  const isZh = lang === "zh";

  if (row.kind === "post") {
    const s = (row.snapshot ?? {}) as PostSnapshot;
    const title = (isZh && s.title_zh ? s.title_zh : s.title) || row.ref_id;
    const tldr = isZh && s.tldr_zh ? s.tldr_zh : s.tldr;
    return (
      <Panel className="p-3.5 flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-neutral-500">
            {s.subreddit && <SubredditChip name={s.subreddit} />}
            {s.author && <span className="truncate">· u/{s.author}</span>}
            {s.created && <span>· {timeAgo(s.created, lang)}</span>}
          </div>
          <LocaleLink href={`/post/${row.ref_id}`} className="mt-1 block font-medium text-cream hover:text-reddit transition leading-snug">
            {title}
          </LocaleLink>
          {tldr && <p className="mt-1 text-sm text-neutral-400 line-clamp-2 leading-relaxed">{tldr}</p>}
        </div>
        <SaveButton kind="post" refId={row.ref_id} size="xs" className="shrink-0" />
      </Panel>
    );
  }

  if (row.kind === "comment") {
    const s = (row.snapshot ?? {}) as CommentSnapshot;
    const body = isZh && s.body_zh ? s.body_zh : s.body;
    const ptitle = (isZh && s.post_title_zh ? s.post_title_zh : s.post_title) || s.post_id;
    return (
      <Panel className="p-3.5 flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            {s.author && <span className="truncate">u/{s.author}</span>}
            {s.created && <span>· {timeAgo(s.created, lang)}</span>}
          </div>
          <p className="mt-1 text-sm text-neutral-300 line-clamp-3 leading-relaxed">{body}</p>
          {s.post_id && (
            <LocaleLink href={`/post/${s.post_id}`} className="mt-1 inline-block text-xs text-neutral-500 hover:text-reddit transition truncate max-w-full">
              ↳ {ptitle}
            </LocaleLink>
          )}
        </div>
        <SaveButton kind="comment" refId={row.ref_id} size="xs" className="shrink-0" />
      </Panel>
    );
  }

  if (row.kind === "subreddit") {
    return (
      <Panel className="p-3 flex items-center gap-3">
        <CommunityIcon id={row.ref_id} size={24} className="text-[11px]" />
        <span className="text-sm text-neutral-200 flex-1 truncate">r/{row.ref_id}</span>
        <a
          href={`https://www.reddit.com/r/${row.ref_id}`}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs text-neutral-600 hover:text-reddit transition shrink-0"
        >
          {p.viewOnReddit} ↗
        </a>
        <SaveButton kind="subreddit" refId={row.ref_id} variant="follow" size="xs" />
      </Panel>
    );
  }

  if (row.kind === "ticker") {
    return (
      <Panel className="p-3 flex items-center gap-3">
        <TickerChip ticker={row.ref_id} />
        <span className="flex-1" />
        <SaveButton kind="ticker" refId={row.ref_id} variant="follow" size="xs" />
      </Panel>
    );
  }

  // author
  return (
    <Panel className="p-3 flex items-center gap-3">
      <Avatar name={row.ref_id} size={26} />
      <span className="text-sm text-neutral-200 flex-1 truncate">u/{row.ref_id}</span>
      <SaveButton kind="author" refId={row.ref_id} variant="follow" size="xs" />
    </Panel>
  );
}
