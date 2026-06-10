"use client";

import { useState } from "react";
import { SnooMascot } from "./reddit";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// 真实 subreddit 头像（下载自 Reddit，存 public/communities/{id}.png）。
// 没有自定义头像的社区（如 r/SecurityAnalysis、r/Alibaba）→ 统一回退到「默认头像」：
// 中性圆底 + Reddit Snoo 剪影（与 Reddit 自家「无图标社区」观感一致）。
export function CommunityIcon({ id, size = 20, className = "" }: { id: string; size?: number; className?: string }) {
  const [err, setErr] = useState(false);

  if (err) {
    return (
      <span
        className={`grid place-items-center rounded-full shrink-0 bg-elevated text-neutral-500 ring-1 ring-inset ring-white/10 ${className}`}
        style={{ width: size, height: size }}
        aria-label={`r/${id}`}
      >
        <SnooMascot className="w-[60%] h-[60%]" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE}/communities/${id}.png`}
      alt={`r/${id}`}
      onError={() => setErr(true)}
      className={`rounded-full object-cover shrink-0 ring-1 ring-black/10 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
