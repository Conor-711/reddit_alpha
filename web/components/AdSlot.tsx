"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./i18n/LocaleProvider";
import { track } from "@/lib/analytics";

/**
 * 广告位占位符 — 网站的商业化模块。
 * 当前为占位 UI；接入真实广告网络时，把对应 slot 的 <ins>/<iframe> 挂到这里
 * （例如 Google AdSense：用 `slot` 作为 data-ad-slot；或自营广告按 `slot` 取素材）。
 *
 * 每个广告都可手动关闭（右上角 ×）。按以广告为主的商业站惯例：关闭仅对**当前页面浏览**
 * 生效（一次广告曝光），刷新/重新进入页面会再次出现（即一次新曝光）——故不做持久化。
 *
 * variant：
 *  - "banner"     夹在模块之间的横向条（响应式，约 728×90）
 *  - "inline"     混入卡片网格的单元（与故事/帖子卡同高，约 300×250 比例）
 *  - "rectangle"  侧栏中矩形（约 300×250）
 */
type Variant = "banner" | "inline" | "rectangle";

export function AdSlot({
  variant = "banner",
  slot,
  className = "",
}: {
  variant?: Variant;
  slot?: string;
  className?: string;
}) {
  const { dict } = useLocale();
  const t = dict.ad;
  // 仅当前页面浏览内有效；刷新即重置（广告会再次出现）。
  const [dismissed, setDismissed] = useState(false);

  // 一次广告曝光
  useEffect(() => {
    track("ad_view", { meta: { slot: slot || variant } });
  }, [slot, variant]);

  if (dismissed) return null;

  const close = () => {
    setDismissed(true);
    track("ad_close", { meta: { slot: slot || variant } });
  };

  const sizeHint = variant === "banner" ? "728 × 90" : "300 × 250";
  const base =
    "relative grid place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-white/[.015] text-center select-none";
  const shape =
    variant === "banner"
      ? "min-h-[88px] px-4 py-4"
      : variant === "inline"
      ? "min-h-[212px] p-4 rounded-2xl"
      : "min-h-[250px] p-4";

  return (
    <aside
      className={`${base} ${shape} ${className}`}
      data-ad-slot={slot}
      aria-label={t.label}
      role="complementary"
    >
      {/* 角标：明确标识为广告 */}
      <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-500 bg-white/[.04] ring-1 ring-inset ring-white/[.07] rounded px-1.5 py-0.5">
        <span className="w-1 h-1 rounded-full bg-reddit/70" />
        {t.sponsored}
      </span>

      {/* 关闭按钮：手动关闭该广告 */}
      <button
        type="button"
        onClick={close}
        aria-label={t.close}
        title={t.close}
        className="absolute top-2 right-2 grid place-items-center w-5 h-5 rounded-md text-neutral-500 hover:text-cream hover:bg-white/[.08] ring-1 ring-inset ring-white/[.07] transition z-10"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">{t.placeholder}</span>
        <span className="font-display font-semibold text-neutral-400 text-sm">{t.cta}</span>
        <span className="mt-1 font-mono text-[10px] text-neutral-600 tabular">{sizeHint}</span>
        <span className="mt-1.5 text-[10px] text-neutral-600 hover:text-reddit transition cursor-default">{t.hint}</span>
      </div>
    </aside>
  );
}
