"use client";

import ReactECharts from "echarts-for-react";

export function MoodGauge({ value, height = 170 }: { value: number; height?: number }) {
  const option = {
    backgroundColor: "transparent",
    series: [
      {
        type: "gauge",
        min: -1,
        max: 1,
        startAngle: 205,
        endAngle: -25,
        radius: "100%",
        center: ["50%", "70%"],
        progress: { show: false },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.35, "#F0556E"],
              [0.5, "#8A8A93"],
              [0.65, "#E6B450"],
              [1, "#24B47E"],
            ],
          },
        },
        pointer: { width: 4, length: "60%", itemStyle: { color: "#F4F1EA" } },
        anchor: { show: true, size: 10, itemStyle: { color: "#F4F1EA" } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          formatter: (v: number) => (v > 0 ? "+" : "") + v.toFixed(2),
          color: "#F4F1EA",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "monospace",
          offsetCenter: [0, "32%"],
        },
        data: [{ value }],
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} opts={{ renderer: "canvas" }} />;
}
