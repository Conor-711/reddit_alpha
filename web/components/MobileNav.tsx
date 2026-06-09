"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav";

export function MobileNav() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav className="lg:hidden flex gap-1 overflow-x-auto px-4 pb-2 -mt-1">
      {NAV.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              active ? "bg-amber/12 text-amber" : "text-neutral-400 hover:text-cream"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
