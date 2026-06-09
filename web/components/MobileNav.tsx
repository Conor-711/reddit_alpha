"use client";

import { usePathname } from "next/navigation";
import { LocaleLink } from "./i18n/LocaleLink";
import { useLocale } from "./i18n/LocaleProvider";
import { stripLang } from "@/lib/i18n";
import { NAV } from "./nav";

export function MobileNav() {
  const { rest } = stripLang(usePathname() || "/");
  const { dict } = useLocale();
  const isActive = (href: string) => (href === "/" ? rest === "/" : rest.startsWith(href));
  return (
    <nav className="lg:hidden flex gap-1 overflow-x-auto px-4 pb-2 -mt-1">
      {NAV.map(({ href, key, Icon }) => {
        const active = isActive(href);
        return (
          <LocaleLink
            key={href}
            href={href}
            className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              active ? "bg-amber/12 text-amber" : "text-neutral-400 hover:text-cream"
            }`}
          >
            <Icon className="w-4 h-4" />
            {dict.nav[key]}
          </LocaleLink>
        );
      })}
    </nav>
  );
}
