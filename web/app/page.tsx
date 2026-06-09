"use client";

import { useEffect } from "react";
import { defaultLocale } from "@/lib/i18n";

// 根路径无 chrome：按浏览器语言把用户送到 /zh 或 /en（默认中文）。
// 静态导出下生成的 index.html 会在加载时用 JS 跳转。
export default function RootRedirect() {
  useEffect(() => {
    const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
    const lang = nav.startsWith("zh") ? "zh" : nav ? "en" : defaultLocale;
    const base = location.pathname.endsWith("/") ? location.pathname : location.pathname + "/";
    location.replace(base + lang + "/");
  }, []);

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "70vh", color: "#8A8A99" }}>
      <noscript>
        <a href={`/${defaultLocale}/`} style={{ color: "#FC3E02" }}>
          进入 redditalpha / Enter
        </a>
      </noscript>
      <span style={{ fontFamily: "system-ui", letterSpacing: ".3px" }}>
        reddit<span style={{ color: "#FC3E02" }}>alpha</span> …
      </span>
    </main>
  );
}
