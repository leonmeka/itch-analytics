import { View } from 'react-native';
import { TimeSeriesChart, type TimeSeriesPoint } from './time-series-chart.component';

// Stat tile: the chart owns the label + live value header and the scrub
// interaction; this wrapper only supplies the card chrome.
export function StatCard({
  label,
  points,
  formatValue,
  isLoading = false,
}: {
  label: string;
  points: TimeSeriesPoint[];
  formatValue: (value: number) => string;
  isLoading?: boolean;
}) {
  return (
    <View className="min-w-0 flex-1 overflow-hidden rounded-app-card bg-app-surface">
      <View className="m-4 min-w-0">
        <TimeSeriesChart
          isLoading={isLoading}
          points={points}
          label={label}
          formatValue={formatValue}
          aspectRatio={2.5}
        />
      </View>
    </View>
  );
}
