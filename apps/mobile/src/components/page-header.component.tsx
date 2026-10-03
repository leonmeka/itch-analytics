import { Typography } from 'heroui-native/text';
import type { ReactNode } from 'react';
import { View } from 'react-native';

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View className="mx-auto w-full max-w-[640px] px-5 pb-6 pt-4">
      <View className="min-h-11 flex-row items-center justify-between gap-3">
        <Typography
          type="h2"
          accessibilityRole="header"
          className="flex-1 text-[32px] font-medium leading-[40px] tracking-[-1px] text-cash-foreground"
        >
          {title}
        </Typography>
        {children}
      </View>
    </View>
  );
}
