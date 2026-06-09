import { IconGrid, IconSearch, IconTrophy } from "./icons";
import type { Dictionary } from "@/lib/i18n";

export type NavItem = {
  href: string;
  key: keyof Dictionary["nav"];
  Icon: (p: { className?: string }) => JSX.Element;
};

export const NAV: NavItem[] = [
  { href: "/dashboard", key: "dashboard", Icon: IconGrid },
  { href: "/search", key: "search", Icon: IconSearch },
  { href: "/leaderboard", key: "leaderboard", Icon: IconTrophy },
];
