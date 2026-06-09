"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav";

export function NavLinks() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav className="px-3 py-3 space-y-0.5">
      {NAV.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              active ? "bg-reddit/12 text-reddit" : "text-neutral-400 hover:text-cream hover:bg-white/[.04]"
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
