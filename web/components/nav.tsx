import { IconGrid, IconTrend, IconLayers, IconList, IconTrophy, IconDoc } from "./icons";

export const NAV: { href: string; label: string; Icon: (p: { className?: string }) => JSX.Element }[] = [
  { href: "/", label: "看板", Icon: IconGrid },
  { href: "/trending", label: "异动", Icon: IconTrend },
  { href: "/narratives", label: "叙事", Icon: IconLayers },
  { href: "/feed", label: "帖子流", Icon: IconList },
  { href: "/leaderboard", label: "作者榜", Icon: IconTrophy },
  { href: "/brief", label: "简报", Icon: IconDoc },
];
