"use client";

import ReactECharts from "echarts-for-react";
import { useRouter } from "next/navigation";
import { sentHex } from "@/lib/format";

type Item = { ticker: string; name: string; value: number; sentiment: number; sector: string; mentions: number };

export function MindshareTreemap({ data, height = 400 }: { data: Item[]; height?: number }) {
  const router = useRouter();
  const items = data.map((d) => ({
    name: d.ticker,
    value: d.value,
    sentiment: d.sentiment,
    company: d.name,
    mentions: d.mentions,
    itemStyle: { color: sentHex(d.sentiment) },
  }));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#18171C",
      borderColor: "#2A2930",
      textStyle: { color: "#e5e5e5", fontSize: 12 },
      formatter: (p: any) =>
        `<b>${p.name}</b> ${p.data.company ? `· ${p.data.company}` : ""}<br/>` +
        `Mindshare <b>${Number(p.value).toFixed(1)}%</b><br/>` +
        `情绪 ${p.data.sentiment > 0 ? "+" : ""}${p.data.sentiment.toFixed(2)} · ${p.data.mentions} 次提及`,
    },
    series: [
      {
        type: "treemap",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        itemStyle: { borderColor: "#0C0C0E", borderWidth: 2, gapWidth: 2 },
        label: {
          show: true,
          formatter: (p: any) => `{t|${p.name}}\n{v|${Number(p.value).toFixed(1)}%}`,
          rich: {
            t: { fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "monospace", lineHeight: 16 },
            v: { fontSize: 11, color: "rgba(255,255,255,.82)", fontFamily: "monospace" },
          },
        },
        data: items,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: "canvas" }}
      onEvents={{ click: (p: any) => p?.name && router.push(`/ticker/${p.name}`) }}
    />
  );
}
