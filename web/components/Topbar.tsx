import Link from "next/link";
import { getMeta } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import { SearchBox } from "./SearchBox";
import { MobileNav } from "./MobileNav";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function Topbar() {
  const meta = getMeta();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/70 backdrop-blur">
      <div className="flex items-center justify-between gap-3 h-16 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="lg:hidden flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg overflow-hidden bg-white shrink-0 ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${BASE}/logo.png`} alt="redditalpha logo" className="w-full h-full object-contain" />
          </span>
          <span className="font-display font-extrabold text-cream">
            reddit<span className="text-reddit">alpha</span>
          </span>
        </Link>

        <div className="hidden lg:block text-sm text-neutral-500">
          Reddit 美股舆情情报 · 8 个财经板块
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <SearchBox />
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
            {meta.lastUpdated ? `更新于 ${timeAgo(meta.lastUpdated)}` : "暂无数据"}
          </div>
        </div>
      </div>
      <MobileNav />
    </header>
  );
}
