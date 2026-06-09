import Link from "next/link";
import { sentTextClass, stanceCN, subColor } from "@/lib/format";

export function Avatar({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-full text-white font-bold shrink-0"
      style={{ background: subColor(name || "?"), width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {(name || "?")[0]?.toUpperCase()}
    </span>
  );
}

export function SubredditChip({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold text-neutral-300 ${className}`}>
      <span className="grid place-items-center w-4 h-4 rounded-full text-white text-[9px] font-bold shrink-0" style={{ background: subColor(name) }}>
        {name[0]?.toUpperCase()}
      </span>
      r/{name}
    </span>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`panel rounded-xl ${className}`}>{children}</div>;
}

export function Eyebrow({ children, color = "text-amber" }: { children: React.ReactNode; color?: string }) {
  return <div className={`text-[11px] font-semibold uppercase tracking-wider ${color}`}>{children}</div>;
}

export function SectionTitle({ title, hint, href }: { title: string; hint?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="font-display font-bold text-cream text-lg">{title}</h2>
      {href ? (
        <Link href={href} className="text-xs text-neutral-500 hover:text-amber transition">
          全部 →
        </Link>
      ) : hint ? (
        <span className="text-xs text-neutral-600">{hint}</span>
      ) : null}
    </div>
  );
}

export function SentPill({ stance, score, className = "" }: { stance?: string; score?: number; className?: string }) {
  const s = stance ?? (score !== undefined ? (score > 0.15 ? "bull" : score < -0.15 ? "bear" : "neutral") : "neutral");
  const map: Record<string, string> = {
    bull: "bg-bull/12 text-bull",
    bear: "bg-bear/12 text-bear",
    neutral: "bg-neutral-500/12 text-neutral-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${map[s]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {stanceCN(s)}
    </span>
  );
}

export function TickerChip({ ticker, size = "sm" }: { ticker: string; size?: "sm" | "xs" }) {
  return (
    <Link
      href={`/ticker/${ticker}`}
      className={`inline-flex items-center font-mono font-medium rounded-md bg-white/[.04] text-neutral-200 hover:bg-amber/15 hover:text-amber transition ring-1 ring-inset ring-white/8 ${
        size === "xs" ? "text-[11px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
      }`}
    >
      {ticker}
    </Link>
  );
}

export function ThemeTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-md bg-gold/10 text-gold ring-1 ring-inset ring-gold/15">
      {children}
    </span>
  );
}

export function ScoreNum({ score }: { score: number }) {
  return <span className={`font-mono tabular ${sentTextClass(score)}`}>{score > 0 ? "+" : ""}{score.toFixed(2)}</span>;
}

export function MiniBar({ pct, color = "bg-amber" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/[.06] overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}
