import type { Config } from "tailwindcss";

// 设计 tokens 移植自旧原型：暖中性底 + 琥珀金/绿，反 AI 模板脸。
// 仪表盘语义色：bull=绿、bear=rose、attention/热度=琥珀金、neutral=slate。
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0C0C0E",
        surface: "#141317",
        card: "#18171C",
        elevated: "#1E1D23",
        line: "#2A2930",
        reddit: "#FF4500", // Reddit 橙 = 品牌主色 / upvote / 热度
        amber: "#FF4500", // 复用为 Reddit 橙（沿用既有 amber 类名）
        downvote: "#7193FF", // Reddit downvote 蓝紫
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
