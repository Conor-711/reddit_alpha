"use client";

import { usePathname } from "next/navigation";
import { LocaleLink } from "./i18n/LocaleLink";
import { useLocale } from "./i18n/LocaleProvider";
import { stripLang } from "@/lib/i18n";
import { NAV } from "./nav";

export function NavLinks() {
  const { rest } = stripLang(usePathname() || "/");
  const { dict } = useLocale();
  const isActive = (href: string) => (href === "/" ? rest === "/" : rest.startsWith(href));
  return (
    <nav className="px-3 py-3 space-y-0.5">
      {NAV.map(({ href, key, Icon }) => {
        const active = isActive(href);
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
    </nav>
  );
}
