// Reddit 视觉元素（本地 SVG 重绘，离线可用、可主题化）：
// - SnooAvatar：彩色圆底 + 白色 Snoo 头（眼/嘴为底色镂空）= Reddit 风格用户头像
// - RedditMark：橙底 + 白 Snoo 头 = Reddit logo 标记
// - SnooMascot：线稿 Snoo（含身体），用于空状态 / 页脚等
import { subColor } from "@/lib/format";

export function SnooAvatar({ name, size = 20 }: { name: string; size?: number }) {
  const bg = subColor(name || "?");
  return (
    <span
      className="inline-grid place-items-center rounded-full shrink-0 overflow-hidden ring-1 ring-black/5"
      style={{ width: size, height: size, background: bg }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <path d="M32 21V12" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="10" r="3.4" fill="#fff" />
        <ellipse cx="32" cy="40" rx="21" ry="18" fill="#fff" />
        <ellipse cx="24.5" cy="39" rx="4.4" ry="5.4" fill={bg} />
        <ellipse cx="39.5" cy="39" rx="4.4" ry="5.4" fill={bg} />
        <path d="M25 48.5 Q32 53.5 39 48.5" stroke={bg} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function RedditMark({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-grid place-items-center rounded-full shrink-0"
      style={{ width: size, height: size, background: "#FF4500" }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <path d="M32 23V14" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="12" r="3.2" fill="#fff" />
        <ellipse cx="32" cy="41" rx="20" ry="16.5" fill="#fff" />
        <circle cx="25" cy="40" r="3.4" fill="#FF4500" />
        <circle cx="39" cy="40" r="3.4" fill="#FF4500" />
        <path d="M25.5 48 Q32 52.5 38.5 48" stroke="#FF4500" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function SnooMascot({ className = "w-12 h-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* 天线 */}
      <path d="M32 16V5" />
      <circle cx="32" cy="3.5" r="2.8" fill="currentColor" stroke="none" />
      {/* 头 */}
      <ellipse cx="32" cy="34" rx="20" ry="18" />
      {/* 眼 */}
      <circle cx="25" cy="33" r="3.1" fill="currentColor" stroke="none" />
      <circle cx="39" cy="33" r="3.1" fill="currentColor" stroke="none" />
      {/* 嘴 */}
      <path d="M26 42 Q32 47 38 42" strokeWidth="2.4" />
      {/* 身体 */}
      <path d="M18 52 Q18 71 32 71 Q46 71 46 52" />
    </svg>
  );
}
