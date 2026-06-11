"use client";

import { useCallback, useEffect, useState } from "react";
import { LocaleLink } from "./i18n/LocaleLink";
import { useLocale } from "./i18n/LocaleProvider";
import { useAuth } from "./auth/AuthProvider";
import { isAdminEmail } from "@/lib/admin";
import { analyticsRpc, isTrackingDisabled, setTrackingDisabled } from "@/lib/analytics";
import { fmtInt, fmtCompact } from "@/lib/format";

interface Overview {
  events: number; page_views: number; visitors: number; sessions: number;
  views_today: number; visitors_today: number;
}
interface Daily { day: string; views: number; visitors: number }
interface Pair { label: string; value: number }
interface Recent { ts: string; event_type: string; path: string | null; lang: string | null; ticker: string | null }
interface Engagement {
  sessions: number; visitors: number;
  avg_session_seconds: number; avg_visitor_seconds: number;
  avg_pages_per_session: number; avg_pages_per_visitor: number;
  avg_clicks_per_visitor: number; avg_clicks_per_session: number;
  bounce_rate: number;
}
interface EngagedPath { path: string; views: number; visitors: number; avg_seconds: number; clicks: number }
interface Data {
  overview: Overview; engagement: Engagement | null; engagedPaths: EngagedPath[];
  daily: Daily[]; topPaths: Pair[];
  events: Pair[]; tickers: Pair[]; langs: Pair[];
  sources: Pair[]; shares: Pair[]; recent: Recent[];
}

export function InsightsDashboard() {
  const { dict } = useLocale();
  const t = dict.insights;
  const { user, loading: authLoading, configured, signOut } = useAuth();
  const admin = isAdminEmail(user?.email);
  const [data, setData] = useState<Data | null>(null);
  const [fetching, setFetching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dnt, setDnt] = useState(false); // 本设备是否「排除我的访问」
  useEffect(() => setDnt(isTrackingDisabled()), []);

  const load = useCallback(async () => {
    setFetching(true);
    setFailed(false);
    const [overview, engagement, engagedPaths, daily, topPaths, events, tickers, langs, sources, shares, recent] = await Promise.all([
      analyticsRpc<Overview>("analytics_overview"),
      analyticsRpc<Engagement>("analytics_engagement", { p_days: 30 }),
      analyticsRpc<EngagedPath[]>("analytics_top_paths_engaged", { p_limit: 8, p_days: 30 }),
      analyticsRpc<Daily[]>("analytics_daily", { p_days: 14 }),
      analyticsRpc<{ path: string; views: number }[]>("analytics_top_paths", { p_limit: 8, p_days: 30 }),
      analyticsRpc<{ event_type: string; n: number }[]>("analytics_event_breakdown", { p_days: 30 }),
      analyticsRpc<{ ticker: string; n: number }[]>("analytics_top_tickers", { p_limit: 8, p_days: 30 }),
      analyticsRpc<{ lang: string; n: number }[]>("analytics_lang_split", { p_days: 30 }),
      analyticsRpc<{ source: string; n: number }[]>("analytics_traffic_sources", { p_limit: 8, p_days: 30 }),
      analyticsRpc<{ platform: string; n: number }[]>("analytics_shares", { p_days: 30 }),
      analyticsRpc<Recent[]>("analytics_recent", { p_limit: 25 }),
    ]);
    if (!overview) {
      setFailed(true);
      setData(null);
    } else {
      setData({
        overview,
        engagement: engagement ?? null,
        engagedPaths: engagedPaths ?? [],
        daily: daily ?? [],
        topPaths: (topPaths ?? []).map((r) => ({ label: r.path, value: Number(r.views) })),
        events: (events ?? []).map((r) => ({ label: r.event_type, value: Number(r.n) })),
        tickers: (tickers ?? []).map((r) => ({ label: r.ticker, value: Number(r.n) })),
        langs: (langs ?? []).map((r) => ({ label: r.lang, value: Number(r.n) })),
        sources: (sources ?? []).map((r) => ({ label: r.source, value: Number(r.n) })),
        shares: (shares ?? []).map((r) => ({ label: r.platform, value: Number(r.n) })),
        recent: recent ?? [],
      });
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    if (user && admin) void load();
  }, [user, admin, load]);

  // ---- 门槛态 ----
  if (!configured) return <Notice>{t.needConfig}</Notice>;
  if (authLoading) return <Notice>{t.loading}</Notice>;
  if (!user)
    return (
      <Notice>
        {t.needLogin}{" "}
        <LocaleLink href="/login" className="text-reddit font-semibold hover:underline">
          {t.loginCta} →
        </LocaleLink>
      </Notice>
    );
  // 已登录但非管理员：拒绝访问（数据仅管理员可见；后端 RPC 也会再校验一次）
  if (!admin)
    return (
      <Notice tone="warn">
        {t.notAdmin}{" "}
        <button onClick={() => void signOut()} className="text-reddit font-semibold hover:underline">
          {t.switchAccount} →
        </button>
      </Notice>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="eyebrow text-reddit">{t.eyebrow}</div>
          <h1 className="mt-1 font-display font-extrabold text-cream tracking-tight text-[26px] leading-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* 排除我自己的访问：本设备开关（登录为管理员时已自动开启） */}
          <button
            onClick={() => { const v = !dnt; setTrackingDisabled(v); setDnt(v); }}
            title={t.dntHint}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ring-1 ring-inset transition ${
              dnt ? "text-bull bg-bull/10 ring-bull/30" : "text-neutral-400 bg-white/[.04] ring-line hover:text-cream hover:bg-white/[.07]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dnt ? "bg-bull" : "bg-neutral-500"}`} />
            {dnt ? t.dntOn : t.dntOff}
          </button>
          <button
            onClick={() => void load()}
            disabled={fetching}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-neutral-300 bg-white/[.04] ring-1 ring-inset ring-line hover:text-cream hover:bg-white/[.07] transition disabled:opacity-50"
          >
            <RefreshIcon spinning={fetching} /> {t.refresh}
          </button>
        </div>
      </div>

      {failed && <Notice tone="warn">{t.needMigration}</Notice>}
      {!failed && !data && <Notice>{t.loading}</Notice>}

      {data && (
        <>
          {/* —— 触达（受众规模：访客 / 浏览 / 会话）—— */}
          <SectionLabel hint={t.secReachHint}>{t.secReach}</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label={t.kpiVisitors} value={data.overview.visitors} sub={`${t.todayPrefix}+${fmtInt(data.overview.visitors_today)}`} />
            <Kpi label={t.kpiViews} value={data.overview.page_views} sub={`${t.todayPrefix}+${fmtInt(data.overview.views_today)}`} />
            <Kpi label={t.kpiSessions} value={data.overview.sessions} />
            <Kpi label={t.kpiEvents} value={data.overview.events} />
          </div>

          {/* —— 参与度（人均停留 / 点击 / 页数 / 跳出；产品迭代 + 广告主可信度）—— */}
          {data.engagement && (
            <>
              <SectionLabel hint={t.secEngageHint}>{t.secEngage}</SectionLabel>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Kpi accent label={t.engDwellVisitor} text={fmtDur(data.engagement.avg_visitor_seconds)} sub={`${t.perSession} ${fmtDur(data.engagement.avg_session_seconds)}`} />
                <Kpi accent label={t.engClicksVisitor} text={data.engagement.avg_clicks_per_visitor.toFixed(1)} sub={`${t.perSession} ${data.engagement.avg_clicks_per_session.toFixed(1)}`} />
                <Kpi label={t.engPagesVisitor} text={data.engagement.avg_pages_per_visitor.toFixed(1)} sub={`${t.perSession} ${data.engagement.avg_pages_per_session.toFixed(1)}`} />
                <Kpi label={t.engBounce} text={`${Math.round(data.engagement.bounce_rate)}%`} sub={t.bounceHint} />
              </div>
              {/* 广告主一句话概览（可直接截图给广告主）*/}
              <div className="rounded-2xl ring-1 ring-inset ring-reddit/25 bg-reddit/[.06] px-4 py-3 text-[13px] text-neutral-300 leading-relaxed">
                <span className="font-semibold text-reddit">{t.adPitchLabel}</span>{" "}
                {t.adPitch
                  .replace("{visitors}", fmtInt(data.engagement.visitors))
                  .replace("{dwell}", fmtDur(data.engagement.avg_visitor_seconds))
                  .replace("{pages}", data.engagement.avg_pages_per_session.toFixed(1))
                  .replace("{clicks}", data.engagement.avg_clicks_per_visitor.toFixed(1))}
              </div>
            </>
          )}

          {/* 趋势 */}
          <Card title={t.trendTitle}>
            <Trend daily={data.daily} viewsLabel={t.trendViews} />
          </Card>

          {/* 用户最爱逛的页面（含停留 / 访客 / 点击）—— 整宽表 */}
          <Card title={t.topPagesEngaged}>
            <EngagedPaths rows={data.engagedPaths} t={t} />
          </Card>

          {/* 分布网格 */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card title={t.eventsTitle}>
              <BarList items={data.events} empty={t.noData} unit={t.unit} />
            </Card>
            <Card title={t.topTickers}>
              <BarList items={data.tickers} empty={t.noData} unit={t.unit} mono />
            </Card>
            <Card title={t.langSplit}>
              <BarList items={data.langs} empty={t.noData} unit={t.unit} />
            </Card>
            <Card title={t.trafficSources}>
              <BarList items={data.sources} empty={t.noData} unit={t.unit} mono />
            </Card>
            <Card title={t.sharesTitle}>
              <BarList items={data.shares} empty={t.noData} unit={t.unit} />
            </Card>
          </div>

          {/* 最近事件 */}
          <Card title={t.recent}>
            <RecentTable rows={data.recent} t={t} />
          </Card>
        </>
      )}
    </div>
  );
}

/* ---------- 子组件 ---------- */

function Notice({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warn" }) {
  const cls = tone === "warn" ? "text-gold ring-gold/25 bg-gold/5" : "text-neutral-400 ring-line bg-white/[.02]";
  return <div className={`rounded-xl ring-1 ring-inset px-4 py-5 text-sm ${cls}`}>{children}</div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl ring-1 ring-inset ring-line bg-white/[.02] p-4 sm:p-5">
      <h2 className="font-display font-bold text-cream text-[14px] mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Kpi({ label, value, text, sub, accent }: { label: string; value?: number; text?: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl ring-1 ring-inset p-4 ${accent ? "ring-reddit/30 bg-reddit/5" : "ring-line bg-white/[.02]"}`}>
      <div className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-1.5 font-mono font-bold text-[26px] tabular leading-none ${accent ? "text-reddit" : "text-cream"}`}>
        {text ?? fmtCompact(value ?? 0)}
      </div>
      {sub && <div className="mt-1.5 text-[11px] text-bull">{sub}</div>}
    </div>
  );
}

// 秒 → 友好时长："1m 35s" / "42s"
function fmtDur(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

// 区块小标题
function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2 mt-1">
      <span className="w-1 h-3.5 rounded-full bg-reddit shrink-0" />
      <h2 className="font-display font-bold text-cream text-[15px] tracking-tight">{children}</h2>
      {hint && <span className="text-[11px] text-neutral-500">{hint}</span>}
    </div>
  );
}

// 最爱页面（含停留 / 独立访客 / 点击）
function EngagedPaths({ rows, t }: { rows: EngagedPath[]; t: { noData: string; colPath: string; colViews: string; colVisitors: string; colDwell: string; colClicks: string } }) {
  if (!rows.length) return <p className="text-sm text-neutral-600 py-2">{t.noData}</p>;
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-neutral-500 text-left">
            <th className="font-medium pb-2">{t.colPath}</th>
            <th className="font-medium pb-2 text-right">{t.colViews}</th>
            <th className="font-medium pb-2 text-right hidden sm:table-cell">{t.colVisitors}</th>
            <th className="font-medium pb-2 text-right">{t.colDwell}</th>
            <th className="font-medium pb-2 text-right hidden sm:table-cell">{t.colClicks}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path} className="border-t border-line/60">
              <td className="py-2 pr-3">
                <span className="font-mono text-neutral-200 truncate inline-block max-w-[180px] align-middle" title={r.path}>{r.path}</span>
                <span className="ml-2 inline-block h-1 rounded-full bg-reddit/50 align-middle" style={{ width: `${Math.round((r.views / max) * 60)}px` }} />
              </td>
              <td className="py-2 text-right font-mono tabular text-cream">{fmtInt(r.views)}</td>
              <td className="py-2 text-right font-mono tabular text-neutral-400 hidden sm:table-cell">{fmtInt(r.visitors)}</td>
              <td className="py-2 text-right font-mono tabular text-bull">{fmtDur(r.avg_seconds)}</td>
              <td className="py-2 text-right font-mono tabular text-neutral-400 hidden sm:table-cell">{fmtInt(r.clicks)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Trend({ daily, viewsLabel }: { daily: { day: string; views: number }[]; viewsLabel: string }) {
  const max = Math.max(1, ...daily.map((d) => d.views));
  return (
    <div>
      <div className="flex items-end gap-1.5 h-32">
        {daily.map((d) => (
          <div key={d.day} className="group relative flex-1 flex flex-col justify-end items-center">
            <div
              className="w-full rounded-t bg-reddit/70 group-hover:bg-reddit transition-all"
              style={{ height: `${Math.max(2, Math.round((d.views / max) * 100))}%` }}
              title={`${d.day} · ${d.views} ${viewsLabel}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-neutral-600 font-mono">
        <span>{daily[0]?.day.slice(5)}</span>
        <span>{daily[daily.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

function BarList({ items, empty, unit, mono }: { items: { label: string; value: number }[]; empty: string; unit: string; mono?: boolean }) {
  if (!items.length) return <p className="text-sm text-neutral-600 py-2">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-3">
          <span className={`text-[13px] text-neutral-300 truncate w-40 shrink-0 ${mono ? "font-mono" : ""}`} title={it.label}>
            {it.label}
          </span>
          <span className="flex-1 h-2 rounded-full bg-white/[.05] overflow-hidden">
            <span className="block h-full rounded-full bg-reddit/60" style={{ width: `${Math.round((it.value / max) * 100)}%` }} />
          </span>
          <span className="font-mono tabular text-[13px] text-neutral-400 shrink-0 w-14 text-right">
            {fmtInt(it.value)}
            {unit}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RecentTable({ rows, t }: { rows: Recent[]; t: { noData: string; colTime: string; colEvent: string; colPath: string } }) {
  if (!rows.length) return <p className="text-sm text-neutral-600 py-2">{t.noData}</p>;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-neutral-600 text-left">
            <th className="font-medium px-1 pb-2">{t.colTime}</th>
            <th className="font-medium px-1 pb-2">{t.colEvent}</th>
            <th className="font-medium px-1 pb-2">{t.colPath}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line/70">
              <td className="px-1 py-1.5 font-mono text-neutral-500 whitespace-nowrap">{fmtTs(r.ts)}</td>
              <td className="px-1 py-1.5">
                <span className="inline-block px-1.5 py-0.5 rounded bg-white/[.05] text-neutral-300 font-mono text-[11px]">{r.event_type}</span>
              </td>
              <td className="px-1 py-1.5 font-mono text-neutral-400 truncate max-w-[220px]">
                {r.ticker ? `${r.path ?? ""} · ${r.ticker}` : r.path ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmtTs(ts: string): string {
  try {
    const d = new Date(ts);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return ts;
  }
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={spinning ? "animate-spin" : ""} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
    </svg>
  );
}
