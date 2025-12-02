import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

interface CustomBarChartProps {
  data: {
    labels: string[];
    datasets: [{ data: number[] }];
  };
  width: number;
  height?: number;
  barPercentage?: number;
  color?: string;
}

export const CustomBarChart = ({ 
  data, 
  width, 
  height = 230,
  barPercentage = 0.6,
  color = '#000'
}: CustomBarChartProps) => {
  // Match padding and axes style to CustomLineChart for consistency
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 24;

  const { bars, yTicks, maxVal, minVal } = useMemo(() => {
    const values = data.datasets[0]?.data ?? [];

    const drawableWidth = width - paddingLeft - paddingRight;
    const drawableHeight = height - paddingTop - paddingBottom;

    if (!values.length || drawableWidth <= 0 || drawableHeight <= 0) {
      return { bars: [] as { x: number; y: number; w: number; h: number; v: number }[], yTicks: [] as number[], minVal: 0, maxVal: 0 };
    }

    const minVal = Math.min(0, ...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const count = values.length;

    // Use 8px gap on both chart sides and between each bar
    const gap = 8;
    const totalGap = gap * (count + 1); // left + right + between bars
    const availableForBars = Math.max(drawableWidth - totalGap, 0);
    const barWidth = count > 0 ? availableForBars / count : 0;

    const bars = values.map((v, i) => {
      const x = paddingLeft + gap + i * (barWidth + gap);
      const h = ((v - minVal) / range) * drawableHeight;
      const y = paddingTop + drawableHeight - h;
      return { x, y, w: barWidth, h, v };
    });

    const ticks = 4;
    const yTicks: number[] = [];
    for (let i = 0; i <= ticks; i++) {
      yTicks.push(minVal + (range * i) / ticks);
    }

    return { bars, yTicks, minVal, maxVal };
  }, [data, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, barPercentage]);

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height}>
        {/* Y-axis */}
        <Line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={height - paddingBottom}
          stroke="#e5e5e5"
          strokeWidth={1}
        />

        {/* X-axis */}
        <Line
          x1={paddingLeft}
          y1={height - paddingBottom}
          x2={width - paddingRight}
          y2={height - paddingBottom}
          stroke="#e5e5e5"
          strokeWidth={1}
        />

        {/* Horizontal grid + Y labels */}
        {yTicks.map((val, i) => {
          const drawableHeight = height - paddingTop - paddingBottom;
          const minTick = yTicks[0];
          const maxTick = yTicks[yTicks.length - 1];
          const range = maxTick - minTick || 1;
          const rel = (val - minTick) / range;
          const y = paddingTop + drawableHeight - rel * drawableHeight;

          const label = Math.abs(val) < 1e-6 ? '' : val.toFixed(1);

          return (
            <React.Fragment key={`ytick-${i}`}>
              <Line
                key={`grid-${i}`}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#f0f0f0"
                strokeWidth={1}
              />
              {label ? (
                <SvgText
                  key={`ylabel-${i}`}
                  x={paddingLeft - 4}
                  y={y + 4}
                  fontSize={10}
                  fill="#666"
                  textAnchor="end"
                >
                  {label}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}

        {/* Bars */}
        {bars.map((bar, idx) => (
          <React.Fragment key={`bar-fragment-${idx}`}>
            <Rect
              key={`bar-${idx}`}
              x={bar.x}
              y={bar.y}
              width={bar.w}
              height={bar.h}
              fill={color}
            />
            {/* Value label on top of bar (hide zero) */}
            {bar.v !== 0 ? (
              <SvgText
                key={`bar-label-${idx}`}
                x={bar.x + bar.w / 2}
                y={bar.y - 4}
                fontSize={10}
                fill="#000"
                textAnchor="middle"
              >
                {bar.v.toFixed(1)}
              </SvgText>
            ) : null}
          </React.Fragment>
        ))}

        {/* X labels */}
        {data.labels.map((label, index) => {
          const valuesCount = data.labels.length || 1;
          const gap = 8;
          const drawableWidth = width - paddingLeft - paddingRight;
          const totalGap = gap * (valuesCount + 1);
          const availableForBars = Math.max(drawableWidth - totalGap, 0);
          const barWidthLocal = availableForBars / valuesCount;
          const xCenter = paddingLeft + gap + index * (barWidthLocal + gap) + barWidthLocal / 2;
          const y = height - paddingBottom + 14;

          return (
            <SvgText
              key={`xlabel-${index}`}
              x={xCenter}
              y={y}
              fontSize={10}
              fill="#666"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};
