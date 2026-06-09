import { SearchHero } from "@/components/SearchHero";
import { getMindshare } from "@/lib/queries";

// 独立搜索页：查任意个股的 Reddit 多空情报（从首页迁出）。
export default function SearchPage() {
  const mind = getMindshare(8);
  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-10">
      <SearchHero suggestions={mind.map((m) => m.ticker)} />
    </div>
  );
}
