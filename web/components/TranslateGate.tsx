"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./i18n/LocaleProvider";

const AD_SECONDS = 6;

// 内容翻译广告闸门：仅在中文模式且存在中文译文时出现。
// 用户点「看广告解锁」→ 倒计时广告 → 显示预先翻译好的中文；可切回原文。
// original / zh 都是已渲染好的 ReactNode（可从服务端组件传入）。
export function TranslateGate({
  hasZh,
  original,
  zh,
}: {
  hasZh: boolean;
  original: React.ReactNode;
  zh: React.ReactNode;
}) {
  const { lang, dict } = useLocale();
  const t = dict.translate;
  const [phase, setPhase] = useState<"idle" | "ad" | "done">("idle");
  const [sec, setSec] = useState(AD_SECONDS);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (phase !== "ad") return;
    if (sec <= 0) {
      setPhase("done");
      return;
    }
    const id = setTimeout(() => setSec((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, sec]);

  // 英文界面或无译文：直接渲染原文，不显示闸门。
  if (lang !== "zh" || !hasZh) return <>{original}</>;

  const showZh = phase === "done" && !showOriginal;
  const pct = Math.round(((AD_SECONDS - sec) / AD_SECONDS) * 100);

  return (
    <div>
      {phase === "idle" && (
        <button
          onClick={() => {
            setSec(AD_SECONDS);
            setPhase("ad");
          }}
          className="mb-3 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/15 shadow-lg shadow-reddit/25 hover:brightness-110 transition"
          style={{ backgroundImage: "var(--grad-brand)" }}
        >
          <GlobeIcon />
          {t.unlock}
        </button>
      )}

      {phase === "ad" && (
        <div className="mb-3 rounded-xl overflow-hidden ring-1 ring-inset ring-white/10 bg-white/[.02]">
          <div className="relative grid place-items-center h-40 sm:h-44 bg-[linear-gradient(135deg,#1b1b22,#101015)]">
            <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider text-neutral-500 ring-1 ring-inset ring-white/10 rounded px-1.5 py-0.5">
              {t.adLabel}
            </span>
            <div className="text-center px-4">
              <div className="text-3xl">📺</div>
              <div className="mt-2 text-sm text-neutral-400">{dict.ad.cta}</div>
              <div className="mt-1 text-[11px] text-neutral-600">{dict.ad.hint}</div>
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between text-[12px] text-neutral-400 mb-1.5">
              <span>{t.watching.replace("{sec}", String(sec))}</span>
              <span className="font-mono tabular text-reddit">{sec}s</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[.06] overflow-hidden">
              <div className="h-full rounded-full bg-reddit transition-all duration-1000 ease-linear" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="mb-3 flex items-center gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1 text-bull font-medium">
            <CheckIcon /> {t.doneBadge}
          </span>
          <span className="text-neutral-600">· {t.poweredBy}</span>
          <button
            onClick={() => setShowOriginal((o) => !o)}
            className="ml-auto text-neutral-500 hover:text-reddit transition"
          >
            {showOriginal ? t.showZh : t.showOriginal}
          </button>
        </div>
      )}

      <div>{showZh ? zh : original}</div>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
