import { Typography } from 'heroui-native/text';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { formatDate } from '../../utils/payments.format';

export type TimeSeriesPoint = { date: string; value: number };

type ChartSize = 'sm' | 'lg';

// One generic cumulative area-line chart in two sizes. Both variants are
// touch-scrubbable and show a live value header (label at rest, explored
// date while scrubbing); 'lg' adds the resting dot, base line and full
// accessibility support, 'sm' is the compact sparkline for stat tiles.
// The SVG renders 1:1 in the measured container width (dynamic viewBox) so
// scrub dots and lines stay perfectly round regardless of tile width.
const GEOMETRY: Record<
  ChartSize,
  {
    height: number;
    padX: number;
    topY: number;
    baseY: number;
    strokeWidth: number;
    dotRadius: number;
    valueClass: string;
    headerGap: string;
  }
> = {
  sm: {
    height: 44,
    padX: 2,
    topY: 4,
    baseY: 42,
    strokeWidth: 1.5,
    dotRadius: 2.5,
    valueClass: 'text-[24px] font-medium leading-[30px] tracking-[-1px]',
    headerGap: 'mb-1.5',
  },
  lg: {
    height: 176,
    padX: 8,
    topY: 12,
    baseY: 156,
    strokeWidth: 2.5,
    dotRadius: 4,
    valueClass: 'text-[26px] font-medium leading-[32px] tracking-[-1px]',
    headerGap: 'mb-3',
  },
};

export function TimeSeriesChart({
  points,
  formatValue,
  size = 'lg',
  label,
}: {
  points: TimeSeriesPoint[];
  formatValue: (value: number) => string;
  size?: ChartSize;
  label?: string;
}) {
  const [accent, border, surface] = useCSSVariable([
    '--cash-accent',
    '--cash-border',
    '--cash-surface',
  ]) as string[];
  const [selected, setSelected] = useState<number | null>(null);
  const [width, setWidth] = useState(300);
  const g = GEOMETRY[size];
  const valid = points.filter(
    (p) => Number.isFinite(Date.parse(p.date)) && Number.isFinite(p.value),
  );

  if (!valid.length) {
    if (size === 'lg') return null;
    return (
      <View>
        {label ? (
          <Typography type="body-xs" className={`text-cash-muted ${g.headerGap}`}>
            {label}
          </Typography>
        ) : null}
        <Typography
          className={`text-cash-foreground ${g.valueClass}`}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          —
        </Typography>
        <View className="h-10" />
      </View>
    );
  }

  const startTime = Date.parse(valid[0].date) - 86_400_000;
  const lastTime = Date.parse(valid[valid.length - 1].date);
  const low = Math.min(0, ...valid.map((p) => p.value));
  const high = Math.max(1, ...valid.map((p) => p.value));
  const chartWidth = Math.max(1, width);
  const x = (time: number) =>
    g.padX + ((time - startTime) / (lastTime - startTime)) * (chartWidth - 2 * g.padX);
  const y = (value: number) => g.baseY - ((value - low) / (high - low)) * (g.baseY - g.topY);
  const coords = valid.map((p) => ({ x: x(Date.parse(p.date)), y: y(p.value) }));
  const path = `M${g.padX},${y(0)} ${coords.map((p) => `L${p.x},${p.y}`).join(' ')}`;
  const index = selected == null ? valid.length - 1 : Math.min(selected, valid.length - 1);
  const point = valid[index];
  const scrubbing = selected != null;
  const selectAt = (location: number) => {
    const scaled = (location / chartWidth) * chartWidth;
    const nearest = coords.reduce(
      (best, p, i) => (Math.abs(p.x - scaled) < Math.abs(coords[best].x - scaled) ? i : best),
      0,
    );
    setSelected(nearest);
  };
  const gradientId = `cash-series-${size}`;

  return (
    <View>
      {label ? (
        <View className={g.headerGap}>
          <Typography type="body-xs" className="text-cash-muted">
            {scrubbing ? formatDate(point.date) : label}
          </Typography>
          <Typography
            adjustsFontSizeToFit
            numberOfLines={1}
            className={`mt-0.5 text-cash-foreground ${g.valueClass}`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatValue(point.value)}
          </Typography>
        </View>
      ) : null}
      <View
        onLayout={(event: { nativeEvent: { layout: { width: number } } }) =>
          setWidth(event.nativeEvent.layout.width)
        }
        onTouchStart={(event: { nativeEvent: { locationX: number } }) =>
          selectAt(event.nativeEvent.locationX)
        }
        onTouchMove={(event: { nativeEvent: { locationX: number } }) =>
          selectAt(event.nativeEvent.locationX)
        }
        onTouchEnd={() => setSelected(null)}
        {...(size === 'lg'
          ? {
              accessible: true,
              accessibilityRole: 'adjustable' as const,
              accessibilityLabel: `${label ?? 'Cumulative'} chart`,
              accessibilityValue: {
                text: `${formatDate(point.date)}: ${formatValue(point.value)}`,
              },
              accessibilityActions: [
                { name: 'increment', label: 'Next date' },
                { name: 'decrement', label: 'Previous date' },
              ],
              onAccessibilityAction: (event: { nativeEvent: { actionName: string } }) =>
                setSelected(
                  Math.max(
                    0,
                    Math.min(
                      valid.length - 1,
                      index + (event.nativeEvent.actionName === 'increment' ? 1 : -1),
                    ),
                  ),
                ),
            }
          : {})}
      >
        <Svg
          width="100%"
          height={g.height}
          viewBox={`0 0 ${chartWidth} ${g.height}`}
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity={size === 'sm' ? 0.2 : 0.13} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path
            d={`${path} L${chartWidth - g.padX},${g.height - 2} L${g.padX},${g.height - 2}Z`}
            fill={`url(#${gradientId})`}
          />
          <Path
            d={path}
            fill="none"
            stroke={accent}
            strokeWidth={g.strokeWidth}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {scrubbing ? (
            <Line
              x1={coords[index].x}
              x2={coords[index].x}
              y1={g.topY}
              y2={g.baseY + 4}
              stroke={border}
              strokeDasharray="3 4"
            />
          ) : null}
          {size === 'lg' || scrubbing ? (
            <Circle
              cx={coords[index].x}
              cy={coords[index].y}
              r={g.dotRadius}
              fill={accent}
              stroke={surface}
              strokeWidth={size === 'lg' ? 2 : 1.5}
            />
          ) : null}
        </Svg>
      </View>
    </View>
  );
}
