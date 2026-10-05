import type { GameDto, PaymentDto } from '@itch/protocol';
import { Skeleton } from 'heroui-native/skeleton';
import { Typography } from 'heroui-native/text';
import type { ReactNode } from 'react';
import { Image, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { formatDate, paymentAmount, paymentName } from '../utils/payments.format';
import { Icon, type IconName } from './icon.component';
import { PressableFeedback } from './pressable-feedback.component';
import { Button } from './ui/button';

export function IconButton({
  name,
  label,
  onPress,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Button
      isIconOnly
      variant="ghost"
      className="h-11 w-11 rounded-full bg-app-well"
      accessibilityLabel={label}
      onPress={onPress}
    >
      <Icon name={name} size={20} />
    </Button>
  );
}
export function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between gap-2">
      <Typography className="text-[21px] font-medium tracking-[-0.6px] text-app-foreground">
        {title}
      </Typography>
      {action ? (
        <Button
          accessibilityLabel={`${action} ${title.toLowerCase()}`}
          variant="ghost"
          size="sm"
          className="-mr-3 h-11 min-w-0 gap-1.5 px-3"
          onPress={onPress}
        >
          <Button.Label className="text-[13px] text-app-muted">{action}</Button.Label>
          <Icon name="arrow" size={14} />
        </Button>
      ) : null}
    </View>
  );
}
export function ContentState({
  title,
  description,
  icon = 'receipt',
  action,
  onPress,
}: {
  title: string;
  description: string;
  icon?: IconName;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View className="items-center gap-3 px-5 py-9">
      <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-app-well">
        <Icon name={icon} size={25} />
      </View>
      <Typography className="text-center text-[21px] font-medium tracking-[-0.5px] text-app-foreground">
        {title}
      </Typography>
      <Typography type="body-sm" className="max-w-[280px] text-center text-app-muted">
        {description}
      </Typography>
      {action ? (
        <Button
          variant="ghost"
          className="mt-3 rounded-full bg-app-foreground px-7"
          onPress={onPress}
        >
          <Button.Label className="text-app-surface">{action}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
export function PaymentRow({
  payment,
  onPress,
  last = false,
}: {
  payment: PaymentDto;
  onPress: () => void;
  last?: boolean;
}) {
  const muted = useCSSVariable('--app-muted') as string;
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`${paymentName(payment)}, ${paymentAmount(payment)}, ${formatDate(payment.purchased_at)}. View details.`}
      onPress={onPress}
      className={`min-h-[86px] flex-row items-center gap-3 px-4 py-4 ${last ? '' : 'border-b border-app-border'}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-app-well">
        <Icon name="receipt" size={19} />
      </View>
      <View className="flex-1 gap-0.5">
        <Typography numberOfLines={1} className="text-[15px] font-medium text-app-foreground">
          {paymentName(payment)}
        </Typography>
        <Typography numberOfLines={1} className="text-[12px] text-app-muted">
          {formatDate(payment.purchased_at)}
        </Typography>
      </View>
      <View className="max-w-[125px] items-end">
        <Typography
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          className="text-[16px] font-medium text-app-foreground"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {paymentAmount(payment)}
        </Typography>
      </View>
      <Icon name="arrow" size={13} color={muted} />
    </PressableFeedback>
  );
}
export function GameRow({
  game,
  onPress,
  last = false,
}: {
  game: GameDto;
  onPress: () => void;
  last?: boolean;
}) {
  const muted = useCSSVariable('--app-muted') as string;
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`${game.title}. View details.`}
      onPress={onPress}
      className={`min-h-[86px] flex-row items-center gap-3 px-4 py-4 ${last ? '' : 'border-b border-app-border'}`}
    >
      {game.cover_url ? (
        <Image
          source={{ uri: game.cover_url }}
          accessibilityLabel={`${game.title} cover`}
          className="h-12 w-12 rounded-app-media bg-app-well"
        />
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-app-media bg-app-well">
          <Icon name="game" size={20} />
        </View>
      )}
      <View className="flex-1 gap-1">
        <Typography numberOfLines={1} className="text-[15px] font-medium text-app-foreground">
          {game.title}
        </Typography>
        {game.short_text ? (
          <Typography numberOfLines={1} type="body-xs" className="text-app-muted">
            {game.short_text}
          </Typography>
        ) : (
          <Typography numberOfLines={1} type="body-xs" className="text-app-muted">
            {game.published ? `Published ${formatDate(game.published_at)}` : 'Unpublished draft'}
          </Typography>
        )}
      </View>
      {!game.published ? (
        <Typography type="body-xs" className="text-app-muted">
          Draft
        </Typography>
      ) : null}
      <Icon name="arrow" size={13} color={muted} />
    </PressableFeedback>
  );
}
export function PaymentSkeletons() {
  return (
    <View>
      {[0, 1, 2].map((row) => (
        <View
          key={row}
          className={`flex-row items-center gap-3 px-4 py-4 ${row < 2 ? 'border-b border-app-border' : ''}`}
        >
          <Skeleton className="h-11 w-11 rounded-full" />
          <View className="flex-1 gap-1">
            <Skeleton className="h-4 w-36 rounded-app-placeholder" />
            <Skeleton className="h-3 w-24 rounded-app-placeholder" />
          </View>
          <Skeleton className="h-5 w-16 rounded-app-placeholder" />
        </View>
      ))}
    </View>
  );
}
export function GameSkeletons() {
  return (
    <View>
      {[0, 1, 2].map((row) => (
        <View
          key={row}
          className={`flex-row items-center gap-3 px-4 py-4 ${row < 2 ? 'border-b border-app-border' : ''}`}
        >
          <Skeleton className="h-12 w-12 rounded-app-media" />
          <View className="flex-1 gap-1">
            <Skeleton className="h-4 w-36 rounded-app-placeholder" />
            <Skeleton className="h-5 w-28 rounded-app-placeholder" />
          </View>
          <Skeleton className="h-4 w-10 rounded-app-placeholder" />
        </View>
      ))}
    </View>
  );
}
export function CreatorsSkeletons() {
  return (
    <View>
      {[0, 1, 2].map((row) => (
        <View
          key={row}
          className={`flex-row items-center gap-3 px-4 py-3 ${row < 2 ? 'border-b border-app-border' : ''}`}
        >
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-4 flex-1 rounded-app-placeholder" />
          <Skeleton className="h-5 w-16 rounded-app-placeholder" />
        </View>
      ))}
    </View>
  );
}
export function DetailRow({
  label,
  last = false,
  children,
}: {
  label: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <View
      className={`flex-row justify-between gap-5 py-4 ${last ? '' : 'border-b border-app-border'}`}
    >
      <Typography type="body-sm" className="w-[40%] shrink-0 text-app-muted">
        {label}
      </Typography>
      <Typography
        selectable
        type="body-sm"
        className="flex-1 text-right font-medium text-app-foreground"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {children}
      </Typography>
    </View>
  );
}
