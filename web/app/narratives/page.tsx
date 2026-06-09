import { Eyebrow } from "@/components/ui";
import { NarrativeCard } from "@/components/NarrativeCard";
import { getNarratives } from "@/lib/queries";

export default function NarrativesPage() {
  const narratives = getNarratives(24);
  return (
    <div className="space-y-4">
      <div>
        <Eyebrow color="text-gold">AI 叙事聚类</Eyebrow>
        <h1 className="mt-1 font-display font-extrabold text-cream text-2xl">Reddit 正在围绕什么叙事交易</h1>
        <p className="mt-1 text-sm text-neutral-500">把窗口内的帖子聚成具名主题，按热度排序。</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {narratives.map((n) => (
          <NarrativeCard key={n.id} n={n} />
        ))}
        {narratives.length === 0 && <div className="text-sm text-neutral-600">暂无叙事。</div>}
      </div>
    </div>
  );
}
