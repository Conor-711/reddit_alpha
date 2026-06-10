import { LocaleLink } from "./i18n/LocaleLink";
import { NavLinks } from "./NavLinks";
import { getCommunities } from "@/lib/queries";
import { fmtCompact } from "@/lib/format";
import { RedditMark } from "./reddit";
import { CommunityIcon } from "./CommunityIcon";
import { IconChevron, IconSearch } from "./icons";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import type { Locale, Dictionary } from "@/lib/i18n";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function Sidebar({ dict }: { lang: Locale; dict: Dictionary }) {
  const communities = getCommunities();
  return (
    <aside className="app-sidebar hidden lg:flex fixed inset-y-0 left-0 w-[232px] flex-col border-r border-line bg-surface/60 backdrop-blur z-40">
      <LocaleLink href="/dashboard" className="sb-row flex items-center gap-2.5 px-4 h-16 border-b border-line shrink-0">
        <span className="w-11 h-11 rounded-xl overflow-hidden bg-white shrink-0 ring-1 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE}/logo.png`} alt="RedditAlpha logo" className="w-full h-full object-contain rounded-xl" />
        </span>
        <span className="sb-label font-display font-extrabold text-cream text-[22px] tracking-tight">
          reddit<span className="text-reddit">alpha</span>
        </span>
      </LocaleLink>

      {/* 搜索入口（侧边栏顶部）：醒目按钮，点开独立搜索页 */}
      <div className="px-3 pt-3 shrink-0">
        <LocaleLink
          href="/search"
          title={dict.nav.search}
          className="sb-row group flex items-center gap-2.5 w-full rounded-lg bg-ink/50 ring-1 ring-inset ring-line px-3 py-2.5 hover:ring-reddit/40 hover:bg-ink/70 transition"
        >
          <IconSearch className="w-[18px] h-[18px] shrink-0 text-neutral-400 group-hover:text-reddit transition" />
          <span className="sb-label text-sm text-neutral-400 group-hover:text-neutral-200 transition">{dict.nav.search}</span>
        </LocaleLink>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <NavLinks />

        {/* 追踪社区：可折叠模块（native <details>，静态导出零 JS） */}
        <details className="group px-3 pb-3 mt-5 pt-4 border-t border-line/60" open>
          <summary className="sb-hide list-none cursor-pointer select-none flex items-center gap-2 px-2 py-1 mb-1.5 text-neutral-400 hover:text-neutral-200 transition [&::-webkit-details-marker]:hidden">
            <span className="w-[3px] h-3.5 rounded-full bg-neutral-600 shrink-0" />
            <span className="font-display text-[13px] font-bold tracking-tight">{dict.chrome.communities}</span>
            <IconChevron className="ml-auto w-3.5 h-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-0.5 mt-1">
            {communities.map((c) => (
              <div key={c.id} className="sb-row flex items-center gap-2.5 px-3 py-1.5 rounded-lg">
                <CommunityIcon id={c.id} size={20} className="text-[10px]" />
                <span className="sb-label text-sm text-neutral-300 truncate flex-1">r/{c.id}</span>
                {c.subscribers > 0 && (
                  <span className="sb-label text-[10px] text-neutral-600 tabular shrink-0">{fmtCompact(c.subscribers)}</span>
                )}
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* 数据看板（/insights）为管理员内部页：不放可见入口，仅凭 URL 直达，避免普通用户误点。 */}

      {/* 控制区（侧边栏下半部分）：语言 + 主题切换；折叠时只留主题图标 */}
      <div className="sb-row px-4 py-3 border-t border-line flex items-center justify-between gap-2 shrink-0">
        <span className="sb-label">
          <LanguageSwitcher />
        </span>
        <ThemeToggle variant="inline" />
      </div>

      <div className="sb-hide px-5 py-4 border-t border-line text-[11px] text-neutral-600 leading-relaxed shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <RedditMark size={18} />
          <span className="text-neutral-500">{dict.chrome.dataFrom}</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
          <span className="text-neutral-500">{dict.chrome.liveDemo}</span>
        </div>
        {dict.chrome.disclaimer}
      </div>
    </aside>
  );
}
