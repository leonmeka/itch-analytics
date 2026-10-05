import { Typography } from 'heroui-native/text';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { CashIconButton } from './cash-ui.component';

export function PageHeader({
  title,
  children,
  onBack,
  backLabel = 'Back to dashboard',
  hero = false,
}: {
  title: string;
  children?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  hero?: boolean;
}) {
  return (
    <View className="mx-auto w-full max-w-[640px] px-5 pb-6 pt-4">
      <View className="h-11 flex-row items-center gap-3">
        <View className="h-11 w-11">
          {onBack ? <CashIconButton name="back" label={backLabel} onPress={onBack} /> : null}
        </View>
        <Typography
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          className={`flex-1 text-center text-[28px] font-medium leading-[36px] tracking-[-0.8px] ${hero ? 'text-cash-hero-foreground' : 'text-cash-foreground'}`}
        >
          {title}
        </Typography>
        <View className="h-11 w-11" />
      </View>
      {children}
    </View>
  );
}
