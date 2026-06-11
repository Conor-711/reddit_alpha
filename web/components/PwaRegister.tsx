"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// 注册 Service Worker（PWA 可安装 + 离线壳）。本地/内网跳过，避免开发期缓存困扰。
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const h = location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h === "::1" || !h.includes(".")) return;
    const onLoad = () => {
      navigator.serviceWorker.register(`${BASE}/sw.js`).catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);
  return null;
}
