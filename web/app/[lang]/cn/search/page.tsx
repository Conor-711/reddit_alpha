import { SearchExperience } from "@/components/SearchExperience";
import { getSearchableTickers, getSearchHeat } from "@/lib/queries";

// 中概·港股·A 股 搜索页：与美股搜索页同构，但标的集合 / 热度榜 / 跳转都限定 market='cn'。
export default function CnSearchPage() {
  const valid = getSearchableTickers("cn");
  const heat = getSearchHeat(10, "cn");
  const popular = heat.slice(0, 8).map((h) => h.ticker);
  return (
    <div className="max-w-3xl mx-auto">
      <SearchExperience valid={valid} popular={popular} heat={heat} tickerBase="/cn/ticker" />
    </div>
  );
}
