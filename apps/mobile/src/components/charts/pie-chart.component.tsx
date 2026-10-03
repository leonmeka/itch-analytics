import { Typography } from 'heroui-native/text';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

export type PieSlice = { label: string; value: number };

const SLICE_OPACITIES = [1, 0.55, 0.32, 0.18, 0.1];

export function PieChart({ slices, size = 64 }: { slices: PieSlice[]; size?: number }) {
  const accent = useCSSVariable('--cash-accent') as string;
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const shown = slices.slice(0, SLICE_OPACITIES.length);

  if (total <= 0) {
    return (
      <View className="h-16 items-center justify-center">
        <Typography type="body-sm" className="text-cash-muted">
          —
        </Typography>
      </View>
    );
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View className="flex-row items-center gap-3">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={accent}
          strokeOpacity={0.12}
          strokeWidth={16}
        />
        {shown.map((slice, index) => {
          const fraction = Math.max(0, slice.value) / total;
          if (fraction <= 0) return null;
          const dash = fraction * circumference;
          const element = (
            <Circle
              key={slice.label}
              cx={50}
              cy={50}
              r={radius}
              fill="none"
              stroke={accent}
              strokeOpacity={SLICE_OPACITIES[index]}
              strokeWidth={16}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += dash;
          return element;
        })}
      </Svg>
      <View className="flex-1 flex-row items-center gap-2">
        {shown.map((slice, index) => (
          <View key={slice.label} className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <View
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: accent,
                  opacity: Math.max(0, slice.value) > 0 ? SLICE_OPACITIES[index] : 0,
                }}
              />
              <Typography
                type="body-xs"
                className="font-medium text-cash-foreground"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {Math.round((Math.max(0, slice.value) / total) * 100)}%
              </Typography>
            </View>
            <Typography type="body-xs" className="text-cash-muted" numberOfLines={1}>
              {slice.label}
            </Typography>
          </View>
        ))}
      </View>
    </View>
  );
}
