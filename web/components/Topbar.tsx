import { LocaleLink } from "./i18n/LocaleLink";
import { getMeta } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import { SearchBox } from "./SearchBox";
import { MobileNav } from "./MobileNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { Locale, Dictionary } from "@/lib/i18n";
// v1：账号系统暂未启用（保留组件，后续版本再开）
// import { UserMenu } from "./auth/UserMenu";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function Topbar({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const meta = getMeta();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/70 backdrop-blur">
      <div className="flex items-center justify-between gap-3 h-16 px-4 sm:px-6 lg:px-8">
        <LocaleLink href="/" className="lg:hidden flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg overflow-hidden bg-white shrink-0 ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${BASE}/logo.png`} alt="redditalpha logo" className="w-full h-full object-contain" />
          </span>
          <span className="font-display font-extrabold text-cream">
            reddit<span className="text-reddit">alpha</span>
          </span>
        </LocaleLink>

        <div className="hidden lg:block text-sm text-neutral-500">{dict.chrome.tagline}</div>

        <div className="flex items-center gap-3 ml-auto">
          <SearchBox />
          <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
            {meta.lastUpdated ? `${dict.chrome.updatedPrefix}${timeAgo(meta.lastUpdated, lang)}` : dict.chrome.noData}
          </div>
          <LanguageSwitcher />
          {/* v1：账号系统暂未启用 */}
        </div>
      </div>
      <MobileNav />
    </header>
  );
}
