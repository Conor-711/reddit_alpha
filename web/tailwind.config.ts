import type { Config } from "tailwindcss";

// 设计 tokens 移植自旧原型：暖中性底 + 琥珀金/绿，反 AI 模板脸。
// 仪表盘语义色：bull=绿、bear=rose、attention/热度=琥珀金、neutral=slate。
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 取自 logo：深藏青底 + 橙波浪
        ink: "#0C161E", // 页面底色（比 logo 的 A 更深）
        surface: "#11202A", // 导航 / 顶栏
        card: "#16242F", // 卡片
        elevated: "#1C2E3A",
        line: "#243845", // 藏青描边
        navy: "#13212C", // logo 的「A」色
        reddit: "#FC3E02", // logo 橙 = 品牌主色 / upvote / 热度 / CTA
        amber: "#FC3E02", // 沿用既有 amber 类名 = logo 橙
        downvote: "#7193FF",
        bull: "#24B47E", // 看多 / 上涨
        bear: "#F0556E", // 看空 / 下跌
        gold: "#E6B450", // 奖章 / 高信号
        cream: "#F4F1EA",
      },
      fontFamily: {
        display: ["var(--font-sora)", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
