import { LocaleLink } from "./i18n/LocaleLink";
import { NavLinks } from "./NavLinks";
import { getCommunities } from "@/lib/queries";
import { fmtCompact, subColor } from "@/lib/format";
import { RedditMark } from "./reddit";
import type { Locale, Dictionary } from "@/lib/i18n";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function Sidebar({ dict }: { lang: Locale; dict: Dictionary }) {
  const communities = getCommunities();
  return (
    <aside className="app-sidebar hidden lg:flex fixed inset-y-0 left-0 w-[232px] flex-col border-r border-line bg-surface/60 backdrop-blur z-40">
      <LocaleLink href="/dashboard" className="flex items-center gap-2.5 px-5 h-16 border-b border-line shrink-0">
        <span className="w-9 h-9 rounded-lg overflow-hidden bg-white shrink-0 ring-1 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE}/logo.png`} alt="RedditAlpha logo" className="w-full h-full object-contain" />
        </span>
        <span className="font-display font-extrabold text-cream text-[17px] tracking-tight">
          reddit<span className="text-reddit">alpha</span>
        </span>
      </LocaleLink>

      <div className="flex-1 overflow-y-auto">
        <NavLinks />

        <div className="px-3 pb-3">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            {dict.chrome.communities}
          </div>
          <div className="space-y-0.5">
            {communities.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
              >
                <span
                  className="grid place-items-center w-5 h-5 rounded-full text-white text-[10px] font-bold shrink-0"
                  style={{ background: subColor(c.id) }}
                >
                  {c.id[0]?.toUpperCase()}
                </span>
                <span className="text-sm text-neutral-300 truncate flex-1">r/{c.id}</span>
                {c.subscribers > 0 && (
                  <span className="text-[10px] text-neutral-600 tabular shrink-0">{fmtCompact(c.subscribers)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-line text-[11px] text-neutral-600 leading-relaxed shrink-0">
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
