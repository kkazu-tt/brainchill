import { useState } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { colors } from "@/constants/theme";

export interface LineChartPoint {
  /** axis label for the x position */
  label: string;
  /** 0..100 main series (e.g. brain fatigue) */
  primary: number;
  /** 0..N secondary series rendered as accent dots (e.g. sauna visits) */
  secondary?: number;
}

interface LineChartProps {
  data: LineChartPoint[];
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
}

/**
 * Minimal dual-series line chart.
 *
 * - Primary series: smooth teal line (uses brain fatigue 0..100).
 * - Secondary series: sauna orange filled dots sized by count.
 *
 * Width is measured at runtime so the chart fits its parent container
 * on every platform without depending on Dimensions.
 */
export function LineChart({
  data,
  height = 160,
  primaryLabel = "脳疲労",
  secondaryLabel = "サウナ",
}: LineChartProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== width) setWidth(w);
  };

  const padX = 12;
  const padTop = 8;
  const padBottom = 28;
  const innerW = Math.max(0, width - padX * 2);
  const innerH = height - padTop - padBottom;

  const xFor = (i: number) =>
    data.length <= 1
      ? padX + innerW / 2
      : padX + (innerW * i) / (data.length - 1);
  const yFor = (v: number) => padTop + innerH * (1 - Math.min(100, Math.max(0, v)) / 100);

  // Build a smooth Catmull–Rom-ish path via cubic bezier interpolation.
  const buildPath = () => {
    if (data.length === 0 || width === 0) return "";
    const pts = data.map((d, i) => ({ x: xFor(i), y: yFor(d.primary) }));
    if (pts.length === 1) return `M ${pts[0]!.x} ${pts[0]!.y}`;

    let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i]!;
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const baselineY = padTop + innerH * 0.5;

  return (
    <View onLayout={onLayout} className="w-full">
      {width > 0 ? (
        <Svg width={width} height={height}>
          {/* baseline grid */}
          <Line
            x1={padX}
            x2={width - padX}
            y1={baselineY}
            y2={baselineY}
            stroke={colors.border}
            strokeDasharray="4 6"
            strokeWidth={1}
          />

          {/* primary smooth line */}
          <Path
            d={buildPath()}
            stroke={colors.teal}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* primary point markers */}
          {data.map((d, i) => (
            <Circle
              key={`p-${i}`}
              cx={xFor(i)}
              cy={yFor(d.primary)}
              r={3}
              fill={colors.teal}
            />
          ))}

          {/* secondary dots (sauna visits): size scales with count */}
          {data.map((d, i) => {
            const count = d.secondary ?? 0;
            if (count <= 0) return null;
            return (
              <Circle
                key={`s-${i}`}
                cx={xFor(i)}
                cy={padTop + innerH + 12}
                r={4 + count * 1.5}
                fill={colors.sauna}
                opacity={0.9}
              />
            );
          })}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}

      {/* x-axis labels */}
      <View className="flex-row justify-between px-3 -mt-5">
        {data.map((d, i) => (
          <Text key={i} className="text-text-muted text-xs">
            {d.label}
          </Text>
        ))}
      </View>

      {/* legend */}
      <View className="flex-row gap-4 mt-3">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-0.5 bg-teal rounded-pill" />
          <Text className="text-text-secondary text-xs">{primaryLabel}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 bg-sauna rounded-pill" />
          <Text className="text-text-secondary text-xs">{secondaryLabel}</Text>
        </View>
      </View>
    </View>
  );
}
