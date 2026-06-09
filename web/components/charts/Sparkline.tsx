"use client";

import ReactECharts from "echarts-for-react";

export function Sparkline({
  series,
  height = 70,
  color = "#FC3E02",
}: {
  series: { ts: string; mentions: number; sentiment: number }[];
  height?: number;
  color?: string;
}) {
  const x = series.map((s) => s.ts);
  const y = series.map((s) => s.mentions);
  const option = {
    backgroundColor: "transparent",
    grid: { left: 0, right: 0, top: 6, bottom: 0 },
    xAxis: { type: "category", show: false, data: x, boundaryGap: false },
    yAxis: { type: "value", show: false, min: 0 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#18171C",
      borderColor: "#2A2930",
      textStyle: { color: "#e5e5e5", fontSize: 11 },
      formatter: (p: any) => `${p[0].value} 次提及`,
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "none",
        data: y,
        lineStyle: { color, width: 2 },
        areaStyle: { color: "rgba(252,62,2,0.14)" },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} opts={{ renderer: "canvas" }} />;
}
