import { IconGrid, IconSearch, IconTrophy, IconYuan } from "./icons";
import type { Dictionary } from "@/lib/i18n";

export type NavItem = {
  href: string;
  key: keyof Dictionary["nav"];
  Icon: (p: { className?: string }) => JSX.Element;
};

export type NavGroup = {
  id: "us" | "cn";
  labelKey: keyof Dictionary["nav"];
  items: NavItem[];
};

// 侧边栏分两段：主块=美股（看板/搜索/作者榜），次块=中概·港股·A 股（看板/搜索）。
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "us",
    labelKey: "usSection",
    items: [
      { href: "/dashboard", key: "dashboard", Icon: IconGrid },
      { href: "/search", key: "search", Icon: IconSearch },
      { href: "/leaderboard", key: "leaderboard", Icon: IconTrophy },
    ],
  },
  {
    id: "cn",
    labelKey: "cnSection",
    items: [
      { href: "/cn", key: "dashboard", Icon: IconGrid },
      { href: "/cn/search", key: "search", Icon: IconSearch },
    ],
  },
];

// 移动端底栏：扁平的关键入口（标签互不重复）。
export const NAV_MOBILE: NavItem[] = [
  { href: "/dashboard", key: "dashboard", Icon: IconGrid },
  { href: "/cn", key: "cnstocks", Icon: IconYuan },
  { href: "/search", key: "search", Icon: IconSearch },
  { href: "/leaderboard", key: "leaderboard", Icon: IconTrophy },
];

// 高亮判定：看板入口在其个股页(/ticker、/cn/ticker)上也保持高亮；其余精确/前缀匹配。
export function navActive(rest: string, href: string): boolean {
  if (href === "/dashboard") return rest === "/dashboard" || rest === "/" || rest.startsWith("/ticker");
  if (href === "/cn") return rest === "/cn" || rest.startsWith("/cn/ticker");
  return rest === href || rest.startsWith(href + "/");
}
