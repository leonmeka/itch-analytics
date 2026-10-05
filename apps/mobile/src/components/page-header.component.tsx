import { Typography } from 'heroui-native/text';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { IconButton } from './screen-ui.component';

export function PageHeader({
  title,
  action,
  onBack,
  backLabel = 'Back to dashboard',
  hero = false,
}: {
  title: string;
  action?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  hero?: boolean;
}) {
  // Own the gap to the first content element; screens should not add top padding.
  return (
    <View className="mx-auto w-full max-w-[640px] px-5 pb-6 pt-4">
      <View className="h-11 flex-row items-center gap-3">
        {onBack ? <IconButton name="back" label={backLabel} onPress={onBack} /> : null}
        <Typography
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          className={`flex-1 text-left text-[28px] font-medium leading-[36px] tracking-[-0.8px] ${hero ? 'text-app-hero-foreground' : 'text-app-foreground'}`}
        >
          {title}
        </Typography>
        {action}
      </View>
    </View>
  );
}
