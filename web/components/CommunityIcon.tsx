"use client";

import { useState } from "react";
import { subColor } from "@/lib/format";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// 真实 subreddit 头像（下载自 Reddit，存 public/communities/{id}.png）。
// 无自定义头像的社区（如 r/SecurityAnalysis）回退到品牌色字母圆标。
export function CommunityIcon({ id, size = 20, className = "" }: { id: string; size?: number; className?: string }) {
  const [err, setErr] = useState(false);

  if (err) {
    return (
      <span
        className={`grid place-items-center rounded-full text-white font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, background: subColor(id), fontSize: Math.round(size * 0.46) }}
        aria-hidden
      >
        {id[0]?.toUpperCase()}
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
