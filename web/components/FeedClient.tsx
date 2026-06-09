"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FeedCard } from "./FeedCard";
import type { FeedRow } from "@/lib/queries";

const STANCES: [string, string][] = [["", "全部"], ["bull", "看多"], ["bear", "看空"], ["neutral", "中性"]];

export function FeedClient({ feed, subs }: { feed: FeedRow[]; subs: string[] }) {
  const sp = useSearchParams();
  const stance = sp.get("stance") ?? "";
  const subreddit = sp.get("subreddit") ?? "";
  const ticker = (sp.get("ticker") ?? "").toUpperCase();

  const filtered = feed.filter(
    (p) =>
      (!stance || p.stance === stance) &&
      (!subreddit || p.subreddit === subreddit) &&
      (!ticker || p.tickers.some((t) => t.ticker === ticker))
  );

  const href = (patch: Record<string, string>) => {
    const merged: Record<string, string> = { stance, subreddit, ticker, ...patch };
    const q = new URLSearchParams();
    for (const k in merged) if (merged[k]) q.set(k, merged[k]);
    const s = q.toString();
    return s ? `/feed?${s}` : "/feed";
  };

  const Chip = ({ active, label, to }: { active: boolean; label: string; to: string }) => (
    <Link
      href={to}
      className={`text-xs px-3 py-1.5 rounded-full transition ${
        active ? "bg-reddit/15 text-reddit" : "bg-white/[.04] text-neutral-400 hover:text-cream"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {STANCES.map(([k, label]) => (
          <Chip key={k} label={label} to={href({ stance: k })} active={stance === k} />
        ))}
        <span className="w-px h-5 bg-line mx-1" />
        <Chip label="全部板块" to={href({ subreddit: "" })} active={!subreddit} />
        {subs.map((s) => (
          <Chip key={s} label={`r/${s}`} to={href({ subreddit: s })} active={subreddit === s} />
        ))}
        {ticker && (
          <Link href={href({ ticker: "" })} className="text-xs px-3 py-1.5 rounded-full bg-reddit/15 text-reddit ml-1">
            {ticker} ✕
          </Link>
        )}
      </div>

      <div className="text-xs text-neutral-600 mt-3 mb-3">{filtered.length} 篇</div>
      <div className="space-y-3 max-w-3xl">
        {filtered.map((p) => (
          <FeedCard key={p.id} p={p} />
        ))}
        {filtered.length === 0 && <div className="text-sm text-neutral-600">没有匹配的帖子。</div>}
      </div>
    </>
  );
}
