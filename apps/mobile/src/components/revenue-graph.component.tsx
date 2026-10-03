import type { PaymentGraphPointDto } from '@itch/protocol';
import { Typography } from 'heroui-native/text';
import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg';

type Props = {
  points: PaymentGraphPointDto[];
  currency: string;
};

/** All-time cumulative revenue line (area chart, brand accent). */
export function RevenueGraph({ points, currency }: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 72;
  const chartHeight = 140;

  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const values = [0, ...points.map((point) => point.amount_cents)];
    const max = Math.max(...values, 1);
    const stepX = chartWidth / Math.max(values.length - 1, 1);
    const paddingY = 12;

    const coords = values.map((value, index) => ({
      x: index * stepX,
      y: chartHeight - paddingY - (value / max) * (chartHeight - paddingY * 2),
    }));

    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
    const area = `${line} L${chartWidth},${chartHeight} L0,${chartHeight} Z`;

    return { line, area, last: coords[coords.length - 1] };
  }, [points, chartWidth, chartHeight]);

  const formatAmount = (amountCents: number): string => {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amountCents / 100);
    } catch {
      return `${(amountCents / 100).toFixed(2)} ${currency}`;
    }
  };

  return (
    <View className="gap-1">
      <Typography type="body-xs" className="text-muted">
        All-time revenue
      </Typography>

      {geometry ? (
        <Svg height={chartHeight} width={chartWidth}>
          <Defs>
            <LinearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor="#fa5c5c" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#fa5c5c" stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          <Path d={geometry.area} fill="url(#revenueFill)" />
          <Path
            d={geometry.line}
            fill="none"
            stroke="#fa5c5c"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        </Svg>
      ) : (
        <View
          className="items-center justify-center rounded-xl bg-surface-secondary"
          style={{ height: chartHeight }}
        >
          <Typography type="body-xs" className="text-muted">
            Import payments to see the graph
          </Typography>
        </View>
      )}

      {points.length > 0 ? (
        <Typography type="body-xs" className="self-end text-muted">
          {formatAmount(points[points.length - 1].amount_cents)}
        </Typography>
      ) : null}
    </View>
  );
}
