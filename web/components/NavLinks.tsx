"use client";

import { usePathname } from "next/navigation";
import { LocaleLink } from "./i18n/LocaleLink";
import { useLocale } from "./i18n/LocaleProvider";
import { stripLang } from "@/lib/i18n";
import { NAV_GROUPS, navActive } from "./nav";

export function NavLinks() {
  const { rest } = stripLang(usePathname() || "/");
  const { dict } = useLocale();

  return (
    <nav className="px-3 py-3 space-y-4">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.id} className={gi > 0 ? "pt-1 border-t border-line/70" : ""}>
          {/* 段标题：主块=美股，次块=中概·港股·A股（次块视觉稍弱） */}
          <div
            className={`sb-hide px-3 ${gi > 0 ? "pt-3" : ""} pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
              group.id === "us" ? "text-neutral-500" : "text-reddit/70"
            }`}
          >
            {dict.nav[group.labelKey]}
          </div>
          <div className="space-y-0.5">
            {group.items.map(({ href, key, Icon }) => {
              const active = navActive(rest, href);
              return (
                <LocaleLink
                  key={href}
                  href={href}
                  title={dict.nav[key]}
                  className={`sb-row flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active ? "bg-reddit/12 text-reddit" : "text-neutral-400 hover:text-cream hover:bg-white/[.04]"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="sb-label">{dict.nav[key]}</span>
                </LocaleLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
