import { View } from 'react-native';
import { TimeSeriesChart, type TimeSeriesPoint } from './time-series-chart.component';

// Stat tile: the chart owns the label + live value header and the scrub
// interaction; this wrapper only supplies the card chrome.
export function StatCard({
  label,
  points,
  formatValue,
}: {
  label: string;
  points: TimeSeriesPoint[];
  formatValue: (value: number) => string;
}) {
  return (
    <View className="flex-1 rounded-[24px] bg-cash-surface p-4">
      <TimeSeriesChart points={points} label={label} formatValue={formatValue} aspectRatio={6} />
    </View>
  );
}
