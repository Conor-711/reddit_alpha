"use client";

// 轻量埋点 + 聚合读取（Supabase 后端）。未配置 Supabase 时全部静默降级。
// 后端 schema 见 supabase/migrations/20260611000001_analytics.sql。
import { supabase } from "./supabase";

const VKEY = "redditalpha:vid"; // 持久访客 id（localStorage）
const SKEY = "redditalpha:sid"; // 会话 id（sessionStorage）
const DNT = "redditalpha:dnt"; // 「不记录本设备」标记（管理员/自己），排除自有访问

// 本设备是否已选择「排除我的访问」。开启后 track() 直接静默返回，事件根本不写入。
export function isTrackingDisabled(): boolean {
  try {
    return localStorage.getItem(DNT) === "1";
  } catch {
    return false;
  }
}

// 开/关「排除本设备访问」。登录为管理员时会自动开启（见 AuthProvider），也可手动切换。
export function setTrackingDisabled(off: boolean): void {
  try {
    if (off) localStorage.setItem(DNT, "1");
    else localStorage.removeItem(DNT);
  } catch {
    /* ignore */
  }
}

function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function visitorId(): string {
  try {
    let v = localStorage.getItem(VKEY);
    if (!v) {
      v = uid();
      localStorage.setItem(VKEY, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

function sessionId(): string {
  try {
    let s = sessionStorage.getItem(SKEY);
    if (!s) {
      s = uid();
      sessionStorage.setItem(SKEY, s);
    }
    return s;
  } catch {
    return "sess";
  }
}

export interface TrackProps {
  path?: string;
  lang?: string;
  ticker?: string;
  meta?: Record<string, unknown>;
}

// 记录一次行为事件（fire-and-forget；不阻塞、不报错冒泡）。
export function track(eventType: string, props: TrackProps = {}): void {
  if (!supabase || typeof window === "undefined") return;
  if (isTrackingDisabled()) return; // 本设备已选择「排除我的访问」→ 不记录
  let ref: string | null = null;
  try {
    ref = document.referrer ? new URL(document.referrer).host : null;
  } catch {
    /* ignore */
  }
  const row = {
    event_type: eventType,
    path: props.path ?? window.location.pathname,
    lang: props.lang ?? null,
    ticker: props.ticker ?? null,
    ref,
    visitor: visitorId(),
    session: sessionId(),
    meta: props.meta ?? null,
  };
  void (async () => {
    try {
      await supabase!.from("app_events").insert(row);
    } catch {
      /* 网络/未配置 → 忽略 */
    }
  })();
}

// 调用聚合函数；未配置 / 出错 / 未授权 → null。
export async function analyticsRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) return null;
    return (data ?? null) as T | null;
  } catch {
    return null;
  }
}
