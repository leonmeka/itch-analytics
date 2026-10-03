import { ActivityIndicator } from 'react-native';
import { Typography } from 'heroui-native/text';
import { View } from 'react-native';

/** Full-screen loading state for boot and auth hand-off moments. */
export function FullscreenSpinner({ heading }: { heading?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background">
      <ActivityIndicator size="large" color="#8f8f99" />
      <Typography.Paragraph type="body-sm" className="text-muted">
        {heading ?? 'Loading…'}
      </Typography.Paragraph>
    </View>
  );
}
