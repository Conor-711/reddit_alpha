// 预设广告位创意（house ads / 占位）。商业模式 = 广告盈利。
// 接入真实广告（Google AdSense / 直客 / 联盟）时替换 ADS 或在 AdSlot 内挂载广告脚本即可；
// 每个广告位 DOM 上都带 data-ad-slot，便于广告系统定位。
export type AdAccent = "reddit" | "bull" | "gold" | "downvote";

export interface Ad {
  id: string;
  sponsor: string;
  tag: string;
  title: string;
  body: string;
  cta: string;
  url: string;
  accent: AdAccent;
}

export const ADS: Ad[] = [
  { id: "broker", sponsor: "MetaBroker", tag: "券商", title: "0 佣金交易美股，中文开户 5 分钟", body: "支持非美居民 · W-8BEN 在线提交 · SIPC 保障", cta: "免费开户", url: "#", accent: "reddit" },
  { id: "bridge", sponsor: "CryptoBridge", tag: "出入金", title: "从 USDT 到美股，一键过桥", body: "合规出入金通道 · 低费率 · 快速到账", cta: "了解更多", url: "#", accent: "gold" },
  { id: "charts", sponsor: "ChartIQ Pro", tag: "工具", title: "专业级美股图表与期权流", body: "实时盘口 · 异动扫描 · 策略回测", cta: "免费试用", url: "#", accent: "downvote" },
  { id: "letter", sponsor: "AlphaLetter", tag: "资讯", title: "每天 5 分钟，读懂美股要闻", body: "免费订阅 · 已有 12 万投资者在读", cta: "订阅", url: "#", accent: "bull" },
  { id: "tax", sponsor: "TaxEasy", tag: "税务", title: "非美居民美股报税助手", body: "自动汇总 1042-S · 股息预扣一键算清", cta: "试一下", url: "#", accent: "reddit" },
  { id: "screen", sponsor: "ScreenerX", tag: "选股", title: "用 AI 帮你筛美股", body: "基本面 + 舆情双因子 · 自定义条件", cta: "开始筛选", url: "#", accent: "gold" },
];

export function pickAd(i = 0): Ad {
  const n = ADS.length;
  return ADS[((i % n) + n) % n];
}
