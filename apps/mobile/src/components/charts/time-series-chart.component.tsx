import { Typography } from 'heroui-native/text';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { formatDate } from '../../utils/payments.format';

export type TimeSeriesPoint = { date: string; value: number };

const STROKE_WIDTH = 2;
const DOT_RADIUS = 3.5;
const PAD_X = 8;
const PAD_Y = 8;

export function TimeSeriesChart({
  points,
  formatValue,
  label,
  aspectRatio = 3,
  showChange = true,
}: {
  points: TimeSeriesPoint[];
  formatValue: (value: number) => string;
  label?: string;
  aspectRatio?: number;
  showChange?: boolean;
}) {
  const [accent, border, surface] = useCSSVariable([
    '--app-accent',
    '--app-border',
    '--app-surface',
  ]) as string[];
  const [selected, setSelected] = useState<number | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const valid = points.filter(
    (p) => Number.isFinite(Date.parse(p.date)) && Number.isFinite(p.value),
  );

  if (!valid.length) {
    return (
      <View className="min-w-0 self-stretch">
        {label ? (
          <Typography type="body-xs" className="mb-2 text-app-muted">
            {label}
          </Typography>
        ) : null}
        <Typography
          className="text-[24px] font-medium leading-[30px] tracking-[-1px] text-app-foreground"
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
  const chartWidth = Math.max(1, layout.width);
  const chartHeight = Math.max(1, layout.height);
  const topY = PAD_Y;
  const baseY = chartHeight - PAD_Y;
  const x = (time: number) =>
    PAD_X + ((time - startTime) / (lastTime - startTime)) * (chartWidth - 2 * PAD_X);
  const y = (value: number) => baseY - ((value - low) / (high - low)) * (baseY - topY);
  const coords = valid.map((p) => ({ x: x(Date.parse(p.date)), y: y(p.value) }));
  const path = `M${PAD_X},${y(0)} ${coords.map((p) => `L${p.x},${p.y}`).join(' ')}`;
  const index = selected == null ? valid.length - 1 : Math.min(selected, valid.length - 1);
  const point = valid[index];
  const today = new Date();
  const windowEnd =
    selected == null
      ? Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
      : Date.parse(point.date);
  const windowStart = windowEnd - 6 * 86_400_000;
  const beforeWindow = valid.findLast((entry) => Date.parse(entry.date) < windowStart);
  const windowLast = valid.findLast((entry) => Date.parse(entry.date) <= windowEnd);
  const change = Math.round((windowLast?.value ?? 0) - (beforeWindow?.value ?? 0));
  const formattedChange = `${change > 0 ? '+' : change < 0 ? '−' : ''}${formatValue(Math.abs(change))}`;
  const scrubbing = selected != null;
  const selectAt = (location: number) => {
    const nearest = coords.reduce(
      (best, p, i) => (Math.abs(p.x - location) < Math.abs(coords[best].x - location) ? i : best),
      0,
    );
    setSelected(nearest);
  };
  const gradientId = 'app-series';

  return (
    <View className="min-w-0 self-stretch">
      {label ? (
        <View className="mb-3">
          <Typography type="body-xs" className="text-app-muted">
            {scrubbing ? formatDate(point.date) : label}
          </Typography>
          <View className="mt-0.5 flex-row items-center gap-2">
            <Typography
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.7}
              className="min-w-0 shrink text-[24px] font-medium leading-[30px] tracking-[-1px] text-app-foreground"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatValue(point.value)}
            </Typography>
            {showChange ? (
              <View
                accessible
                accessibilityLabel={`Past seven days ${formattedChange}`}
                className={`shrink-0 flex-row items-center gap-1 rounded-full px-2 py-1 ${change === 0 ? 'bg-app-well' : 'bg-app-accent-soft'}`}
              >
                <Typography
                  className={`text-[11px] font-semibold leading-[14px] ${change === 0 ? 'text-app-muted' : 'text-app-link'}`}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {change > 0 ? '↗' : change < 0 ? '↘' : '–'} {formatValue(Math.abs(change))} · 7d
                </Typography>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
      <View
        style={{ alignSelf: 'stretch', height: Math.max(64, layout.width / aspectRatio) }}
        onLayout={(event: { nativeEvent: { layout: { width: number; height: number } } }) =>
          setLayout({
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height,
          })
        }
        onTouchStart={(event: { nativeEvent: { locationX: number } }) =>
          selectAt(event.nativeEvent.locationX)
        }
        onTouchMove={(event: { nativeEvent: { locationX: number } }) =>
          selectAt(event.nativeEvent.locationX)
        }
        onTouchEnd={() => setSelected(null)}
        onTouchCancel={() => setSelected(null)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${label ?? 'Cumulative'} chart`}
        accessibilityValue={{
          text: `${formatDate(point.date)}: ${formatValue(point.value)}${showChange ? `, past seven days ${formattedChange}` : ''}`,
        }}
        accessibilityActions={[
          { name: 'increment', label: 'Next date' },
          { name: 'decrement', label: 'Previous date' },
        ]}
        onAccessibilityAction={(event: { nativeEvent: { actionName: string } }) =>
          setSelected(
            Math.max(
              0,
              Math.min(
                valid.length - 1,
                index + (event.nativeEvent.actionName === 'increment' ? 1 : -1),
              ),
            ),
          )
        }
      >
        <Svg
          width={layout.width}
          height={layout.height}
          style={{ position: 'absolute', top: 0, left: 0 }}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity={0.15} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path
            d={`${path} L${chartWidth - PAD_X},${chartHeight - 2} L${PAD_X},${chartHeight - 2}Z`}
            fill={`url(#${gradientId})`}
          />
          <Path
            d={path}
            fill="none"
            stroke={accent}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {scrubbing ? (
            <Line
              x1={coords[index].x}
              x2={coords[index].x}
              y1={topY}
              y2={baseY + 4}
              stroke={border}
              strokeDasharray="3 4"
            />
          ) : null}
          <Circle
            cx={coords[index].x}
            cy={coords[index].y}
            r={DOT_RADIUS}
            fill={accent}
            stroke={surface}
            strokeWidth={2}
          />
        </Svg>
      </View>
    </View>
  );
}
