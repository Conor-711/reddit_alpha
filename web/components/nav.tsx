import { IconGrid, IconPulse, IconTrend, IconLayers, IconTrophy } from "./icons";
import type { Dictionary } from "@/lib/i18n";

export type NavItem = {
  href: string;
  key: keyof Dictionary["nav"];
  Icon: (p: { className?: string }) => JSX.Element;
};

export const NAV: NavItem[] = [
  { href: "/dashboard", key: "dashboard", Icon: IconGrid },
  { href: "/pulse", key: "pulse", Icon: IconPulse },
  { href: "/trending", key: "trending", Icon: IconTrend },
  { href: "/narratives", key: "narratives", Icon: IconLayers },
  { href: "/leaderboard", key: "leaderboard", Icon: IconTrophy },
];
