import { SearchExperience } from "@/components/SearchExperience";
import { getSearchableTickers, getSearchHeat } from "@/lib/queries";

// 独立搜索页：搜索为整页主体 + 搜索热度榜；搜不到 / 数据不足时进入专门提示页。
export default function SearchPage() {
  const valid = getSearchableTickers();        // 有真实数据的标的（校验 + 建议 + 名称映射）
  const heat = getSearchHeat(10);              // 排行榜兜底：真实社区讨论热度
  const popular = heat.slice(0, 8).map((h) => h.ticker);
  return (
    <div className="max-w-3xl mx-auto">
      <SearchExperience valid={valid} popular={popular} heat={heat} />
    </div>
  );
}
