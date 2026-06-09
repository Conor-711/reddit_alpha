import { Panel, Eyebrow, ScoreNum, MiniBar, Avatar } from "@/components/ui";
import { fmtInt, fmtCompact } from "@/lib/format";
import { getLeaderboard } from "@/lib/queries";

export default function LeaderboardPage() {
  const rows = getLeaderboard(25);
  const maxScore = Math.max(1, ...rows.map((r) => r.score || 0));
  return (
    <div className="space-y-4">
      <div>
        <Eyebrow color="text-bull">作者影响力榜</Eyebrow>
        <h1 className="mt-1 font-display font-extrabold text-cream text-2xl">谁在带动讨论</h1>
        <p className="mt-1 text-sm text-neutral-500">按累计互动（帖子获赞）排序；附平均情绪与内容质量。</p>
      </div>

      <Panel className="p-2 sm:p-4">
        <div className="grid grid-cols-[36px_1fr_80px_72px_64px] sm:grid-cols-[44px_1fr_160px_100px_90px] items-center gap-3 px-3 py-2 text-[11px] text-neutral-500 uppercase tracking-wide">
          <span className="text-right">#</span>
          <span>作者</span>
          <span className="text-right">累计互动</span>
          <span className="text-right">帖子</span>
          <span className="text-right">均情绪</span>
        </div>
        <div className="space-y-0.5">
          {rows.map((r, i) => (
            <div key={r.author} className="grid grid-cols-[36px_1fr_80px_72px_64px] sm:grid-cols-[44px_1fr_160px_100px_90px] items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[.03] transition">
              <span className="text-right text-xs text-neutral-600 tabular">{i + 1}</span>
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
          {rows.length === 0 && <div className="px-3 py-6 text-sm text-neutral-600">暂无数据。</div>}
        </div>
      </Panel>
    </div>
  );
}
