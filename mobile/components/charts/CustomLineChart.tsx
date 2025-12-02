import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { Note } from '../../lib/noteRepo';

interface CustomLineChartProps {
  data: {
    labels: string[];
    datasets: [{ data: number[] }];
  };
  width: number;
  height?: number;
  color?: string;
  notes?: Note[];
  eventId?: string;
  onNotePress?: (note: Note, position: { x: number; y: number }) => void;
  dateRanges?: Array<{ start: Date; end: Date }>; // Optional: date range for each data point
}

export const CustomLineChart = ({ 
  data, 
  width, 
  height = 220,
  color = '#000',
  notes = [],
  eventId = '',
  onNotePress,
  dateRanges = []
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

  const { path, fillPath, yTicks, minVal, maxVal, notePositions } = useMemo(() => {
    const values = data.datasets[0]?.data ?? [];

    const drawableWidth = width - paddingLeft - paddingRight;
    const drawableHeight = height - paddingTop - paddingBottom;

    if (!values.length || drawableWidth <= 0 || drawableHeight <= 0) {
      return { path: '', fillPath: '', yTicks: [] as number[], minVal: 0, maxVal: 0, notePositions: [] as Array<{ x: number; y: number; note: Note }> };
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

    // Build a smooth monotone cubic bezier path (similar to d3.curveMonotoneX)
    let d = '';
    if (points.length === 1) {
      d = `M ${points[0].x} ${points[0].y}`;
    } else {
      const n = points.length;
      const dx: number[] = [];
      const dy: number[] = [];
      const m: number[] = []; // segment slopes

      for (let i = 0; i < n - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const dxVal = p1.x - p0.x || 1;
        const dyVal = p1.y - p0.y;
        dx.push(dxVal);
        dy.push(dyVal);
        m.push(dyVal / dxVal);
      }

      const t: number[] = new Array(n);

      // endpoint tangents
      t[0] = m[0];
      t[n - 1] = m[n - 2];

      // interior tangents as average of slopes, then clamped (Fritsch–Carlson)
      for (let i = 1; i < n - 1; i++) {
        if (m[i - 1] === 0 || m[i] === 0 || m[i - 1] * m[i] < 0) {
          t[i] = 0;
        } else {
          t[i] = (m[i - 1] + m[i]) / 2;
        }
      }

      for (let i = 0; i < n - 1; i++) {
        if (m[i] === 0) {
          t[i] = 0;
          t[i + 1] = 0;
          continue;
        }

        const a = t[i] / m[i];
        const b = t[i + 1] / m[i];
        const h = Math.hypot(a, b);
        if (h > 3) {
          const scale = 3 / h;
          t[i] = a * scale * m[i];
          t[i + 1] = b * scale * m[i];
        }
      }

      d = `M ${points[0].x} ${points[0].y}`;

      for (let i = 0; i < n - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const dxVal = dx[i];

        const cp1x = p0.x + dxVal / 3;
        const cp1y = p0.y + (t[i] * dxVal) / 3;
        const cp2x = p1.x - dxVal / 3;
        const cp2y = p1.y - (t[i + 1] * dxVal) / 3;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }
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

    // Calculate note positions on the line
    const notePositions: Array<{ x: number; y: number; note: Note }> = [];
    if (notes && notes.length > 0 && eventId && dateRanges && dateRanges.length === points.length) {
      const eventNotes = notes.filter(n => n.event_id === eventId);

      eventNotes.forEach(note => {
        const noteDate = new Date(note.start_date); // Use start_date for X position

        // Find which data point range this note belongs to
        const noteIndex = dateRanges.findIndex(range => 
          noteDate >= range.start && noteDate <= range.end
        );

        // Only show notes that fall inside the visible period
        if (noteIndex >= 0 && noteIndex < points.length) {
          notePositions.push({
            x: points[noteIndex].x,
            y: points[noteIndex].y,
            note
          });
        }
      });
    }

    return { path: d, fillPath: areaPath, yTicks: tickValues, minVal, maxVal, notePositions };
  }, [data, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, notes, eventId, dateRanges]);

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

        {/* Note markers - visible circles on the line */}
        {notePositions.map((notePos, index) => (
          <Circle
            key={`note-${index}`}
            cx={notePos.x}
            cy={notePos.y}
            r={6}
            fill={color}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Absolute overlay for reliable tapping on notes */}
      {notePositions.map((notePos, index) => (
        <TouchableOpacity
          key={`note-touch-${index}`}
          activeOpacity={0.7}
          style={[
            styles.noteHitArea,
            {
              left: notePos.x - 24,
              top: notePos.y - 24,
            },
          ]}
          onPress={() =>
            onNotePress && onNotePress(notePos.note, { x: notePos.x, y: notePos.y })
          }
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  noteHitArea: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    // Very subtle background so it does not show but still taps well
    backgroundColor: 'transparent',
  },
});
