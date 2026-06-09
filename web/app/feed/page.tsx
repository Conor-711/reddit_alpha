import { Suspense } from "react";
import { Eyebrow } from "@/components/ui";
import { FeedClient } from "@/components/FeedClient";
import { getFeed, getSubreddits } from "@/lib/queries";

export default function FeedPage() {
  const feed = getFeed({ limit: 150 });
  const subs = getSubreddits().map((s) => s.id);
  return (
    <div className="space-y-4">
      <div>
        <Eyebrow>智能帖子流</Eyebrow>
        <h1 className="mt-1 font-display font-extrabold text-cream text-2xl">高信号优先 · AI 打标</h1>
      </div>
      <Suspense fallback={<div className="text-sm text-neutral-600">加载中…</div>}>
        <FeedClient feed={feed} subs={subs} />
      </Suspense>
    </div>
  );
}
