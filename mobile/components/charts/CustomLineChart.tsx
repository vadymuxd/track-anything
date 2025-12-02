import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CustomLineChartProps {
  data: {
    labels: string[];
    datasets: [{ data: number[] }];
  };
  width: number;
  height?: number;
  color?: string;
}

export const CustomLineChart = ({ 
  data, 
  width, 
  height = 220,
  color = '#000'
}: CustomLineChartProps) => {
  // Internal padding so we fully control spacing between Y-axis and line
  const paddingLeft = 32; // controls gap between Y-axis and first point
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 24;

  // Convert hex color to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const gradientId = `lineFill-${color.replace('#', '')}`;

  const { path, fillPath, yTicks, minVal, maxVal } = useMemo(() => {
    const values = data.datasets[0]?.data ?? [];

    const drawableWidth = width - paddingLeft - paddingRight;
    const drawableHeight = height - paddingTop - paddingBottom;

    if (!values.length || drawableWidth <= 0 || drawableHeight <= 0) {
      return { path: '', fillPath: '', yTicks: [] as number[], minVal: 0, maxVal: 0 };
    }

    const minVal = Math.min(0, ...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const stepX = values.length > 1 ? drawableWidth / (values.length - 1) : 0;

    const points = values.map((v, i) => {
      const x = paddingLeft + stepX * i;
      const y = paddingTop + drawableHeight - ((v - minVal) / range) * drawableHeight;
      return { x, y };
    });

    // Build a smooth bezier path similar to chart-kit bezier line
    let d = '';
    if (points.length === 1) {
      d = `M ${points[0].x} ${points[0].y}`;
    } else {
      // Stronger bezier curvature by pulling control points further from the midpoint
      const tension = 0.6; // 0-1, higher = more curve
      points.forEach((p, i) => {
        if (i === 0) {
          d += `M ${p.x} ${p.y}`;
        } else {
          const prev = points[i - 1];
          const dx = p.x - prev.x;
          const cp1x = prev.x + dx * (1 - tension);
          const cp2x = p.x - dx * (1 - tension);
          d += ` C ${cp1x} ${prev.y}, ${cp2x} ${p.y}, ${p.x} ${p.y}`;
        }
      });
    }

    // Closed path for area under the curve
    let areaPath = '';
    if (points.length) {
      const first = points[0];
      const last = points[points.length - 1];
      areaPath = `${d} L ${last.x} ${height - paddingBottom} L ${first.x} ${height - paddingBottom} Z`;
    }

    const ticks = 4;
    const tickValues: number[] = [];
    for (let i = 0; i <= ticks; i++) {
      tickValues.push(minVal + (range * i) / ticks);
    }

    return { path: d, fillPath: areaPath, yTicks: tickValues, minVal, maxVal };
  }, [data, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom]);

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {/* 100% opacity at top of chart area, 0 at bottom */}
            <Stop offset="0" stopColor={hexToRgba(color, 0.2)} stopOpacity="1" />
            <Stop offset="1" stopColor={hexToRgba(color, 0)} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* Y-axis line */}
        <Line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={height - paddingBottom}
          stroke="#e5e5e5"
          strokeWidth={1}
        />

        {/* X-axis line */}
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
          const minVal = yTicks[0];
          const maxVal = yTicks[yTicks.length - 1];
          const range = maxVal - minVal || 1;
          const rel = (val - minVal) / range;
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

        {/* Area under curve */}
        {fillPath ? (
          <Path d={fillPath} fill={`url(#${gradientId})`} stroke="none" />
        ) : null}

        {/* Line path */}
        {path ? (
          <Path
            d={path}
            stroke={color}
            strokeWidth={2}
            fill="none"
          />
        ) : null}

        {/* X labels */}
        {data.labels.map((label, index) => {
          const values = data.datasets[0]?.data ?? [];
          const drawableWidth = width - paddingLeft - paddingRight;
          const stepX = values.length > 1 ? drawableWidth / (values.length - 1) : 0;
          const x = paddingLeft + stepX * index;
          const y = height - paddingBottom + 14;

          return (
            <SvgText
              key={`xlabel-${index}`}
              x={x}
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
