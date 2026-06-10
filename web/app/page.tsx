"use client";

import { useEffect } from "react";
import { defaultLocale } from "@/lib/i18n";

// 根路径无 chrome：按浏览器语言把用户送到 /zh 或 /en（默认中文）。
// 静态导出下生成的 index.html 会在加载时用 JS 跳转。
export default function RootRedirect() {
  useEffect(() => {
    // 1) 优先用户上次手动选择（LanguageSwitcher 写入）；
    // 2) 否则按浏览器语言：任一首选语言是中文 → zh，否则 → en。
    let lang = "";
    try {
      const saved = localStorage.getItem("redditalpha:lang");
      if (saved === "zh" || saved === "en") lang = saved;
    } catch {
      /* ignore */
    }
    if (!lang) {
      const list =
        typeof navigator !== "undefined"
          ? navigator.languages && navigator.languages.length
            ? navigator.languages
            : [navigator.language || ""]
          : [];
      lang = list.some((l) => (l || "").toLowerCase().startsWith("zh")) ? "zh" : "en";
    }
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
