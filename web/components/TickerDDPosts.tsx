"use client";

// 个股页「高质量 DD 帖」模块：客户端可切换排序（最近 / 质量 / 热度，默认最近）。
// 卡片在服务端渲染后作为 children 传入，这里只按所选规则对它们重新排序+取前 12，
// 因此不会把 FeedCard 及其依赖打进客户端包（静态导出友好）。
import { Children, useState } from "react";
import { SectionTitle } from "@/components/ui";

type SortKey = "recent" | "quality" | "score";
type Meta = { created: string; quality: number; score: number };

export function TickerDDPosts({
  title,
  hintPre,
  hintPost,
  labels,
  meta,
  children,
}: {
  title: string;
  hintPre: string;
  hintPost: string;
  labels: { recent: string; quality: string; score: string };
  meta: Meta[];
  children: React.ReactNode;
}) {
  const [sort, setSort] = useState<SortKey>("recent");
  const cards = Children.toArray(children);

  // meta[i] 对应第 i 张卡片（children 与 meta 同序）。按所选规则排序索引，取前 12。
  const order = meta
    .map((_, i) => i)
    .sort((ia, ib) => {
      const a = meta[ia];
      const b = meta[ib];
      if (sort === "quality") return (b.quality || 0) - (a.quality || 0);
      if (sort === "score") return (b.score || 0) - (a.score || 0);
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    })
    .slice(0, 12);

  const opts: { key: SortKey; label: string }[] = [
    { key: "recent", label: labels.recent },
    { key: "quality", label: labels.quality },
    { key: "score", label: labels.score },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SectionTitle title={title} hint={`${hintPre}${Math.min(meta.length, 12)}${hintPost}`} accent="gold" icon="doc" />
        <div className="flex items-center gap-0.5 rounded-lg bg-white/[.03] ring-1 ring-inset ring-white/8 p-0.5 shrink-0">
          {opts.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setSort(o.key)}
              aria-pressed={sort === o.key}
              className={`px-2.5 py-1 text-xs rounded-md transition ${
                sort === o.key
                  ? "bg-reddit/15 text-reddit font-medium"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">{order.map((i) => cards[i])}</div>
    </div>
  );
}
