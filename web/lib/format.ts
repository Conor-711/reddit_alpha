// 数字 / 时间 / 语义色 格式化助手。

export function fmtInt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n || 0));
}

export function fmtCompact(n: number): string {
  if (n == null) return "0";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return String(Math.round(n));
}

export function fmtPct(n: number, digits = 1): string {
  return `${(n || 0).toFixed(digits)}%`;
}

export function fmtSignedPct(n: number, digits = 0): string {
  const v = (n || 0).toFixed(digits);
  return (n > 0 ? "+" : "") + v + "%";
}

export function parseUTC(s: string): Date {
  // SQLite 里是 "YYYY-MM-DD HH:MM:SS(.ffffff)"，按 UTC 解析。
  if (!s) return new Date(0);
  return new Date(s.replace(" ", "T").replace(/(\.\d+)?$/, "") + "Z");
}

export function timeAgo(s: string): string {
  const then = parseUTC(s).getTime();
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  return `${Math.floor(hrs / 24)} 天前`;
}

// 情绪 → 颜色（图表用 hex）
export function sentHex(score: number): string {
  if (score > 0.15) return "#24B47E";
  if (score < -0.15) return "#F0556E";
  return "#8A8A93";
}

// 情绪 → 文本色类
export function sentTextClass(score: number): string {
  if (score > 0.15) return "text-bull";
  if (score < -0.15) return "text-bear";
  return "text-neutral-400";
}

export function stanceCN(stance: string): string {
  return { bull: "看多", bear: "看空", neutral: "中性" }[stance] ?? "中性";
}

export function moodColor(score: number): string {
  return sentHex(score);
}

export const REDDIT = "https://www.reddit.com";

// subreddit 小圆标配色（按名字确定性取色）
const SUB_PALETTE = ["#FC3E02", "#0079D3", "#24B47E", "#E6B450", "#7193FF", "#F0556E", "#46D160", "#FF8717"];
export function subColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SUB_PALETTE[h % SUB_PALETTE.length];
}
