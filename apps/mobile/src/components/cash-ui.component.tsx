import type { GameDto, PaymentDto } from '@itch/protocol';
import { Skeleton } from 'heroui-native/skeleton';
import { Typography } from 'heroui-native/text';
import type { ReactNode } from 'react';
import { Image, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { formatDate, paymentAmount, paymentSource } from '../utils/payments.format';
import { CashIcon, type CashIconName } from './cash-icon.component';
import { PressableFeedback } from './pressable-feedback.component';
import { Button } from './ui/button';

export function CashIconButton({
  name,
  label,
  onPress,
}: {
  name: CashIconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Button
      isIconOnly
      variant="ghost"
      className="h-11 w-11 rounded-full bg-cash-well"
      accessibilityLabel={label}
      onPress={onPress}
    >
      <CashIcon name={name} size={20} />
    </Button>
  );
}
export function CashSection({
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
      <Typography className="text-[21px] font-medium tracking-[-0.6px] text-cash-foreground">
        {title}
      </Typography>
      {action ? (
        <Button variant="ghost" size="sm" className="min-h-11 px-1" onPress={onPress}>
          <Button.Label className="text-[13px] text-cash-muted">{action}</Button.Label>
          <CashIcon name="arrow" size={14} />
        </Button>
      ) : null}
    </View>
  );
}
export function CashState({
  title,
  description,
  icon = 'receipt',
  action,
  onPress,
}: {
  title: string;
  description: string;
  icon?: CashIconName;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View className="items-center gap-3 px-5 py-9">
      <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-cash-well">
        <CashIcon name={icon} size={25} />
      </View>
      <Typography className="text-center text-[21px] font-medium tracking-[-0.5px] text-cash-foreground">
        {title}
      </Typography>
      <Typography type="body-sm" className="max-w-[280px] text-center text-cash-muted">
        {description}
      </Typography>
      {action ? (
        <Button
          variant="ghost"
          className="mt-3 rounded-full bg-cash-foreground px-7"
          onPress={onPress}
        >
          <Button.Label className="text-cash-surface">{action}</Button.Label>
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
  const muted = useCSSVariable('--cash-muted') as string;
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`${payment.object_name ?? 'Payment'}, ${paymentAmount(payment)}, ${formatDate(payment.purchased_at)}. View details.`}
      onPress={onPress}
      className={`min-h-[86px] flex-row items-center gap-3 px-4 py-4 ${last ? '' : 'border-b border-cash-border'}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-cash-well">
        <CashIcon name="receipt" size={19} />
      </View>
      <View className="flex-1 gap-1">
        <Typography numberOfLines={1} className="text-[15px] font-medium text-cash-foreground">
          {payment.object_name ?? '–'}
        </Typography>
        <Typography numberOfLines={1} className="text-[12px] text-cash-muted">
          {formatDate(payment.purchased_at)} · {paymentSource(payment.source)}
        </Typography>
      </View>
      <View className="max-w-[125px] items-end">
        <Typography
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          className="text-[16px] font-medium text-cash-foreground"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {paymentAmount(payment)}
        </Typography>
      </View>
      <CashIcon name="arrow" size={13} color={muted} />
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
  const muted = useCSSVariable('--cash-muted') as string;
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`${game.title}. View details.`}
      onPress={onPress}
      className={`min-h-[86px] flex-row items-center gap-3 px-4 py-4 ${last ? '' : 'border-b border-cash-border'}`}
    >
      {game.cover_url ? (
        <Image
          source={{ uri: game.cover_url }}
          accessibilityLabel={`${game.title} cover`}
          className="h-12 w-12 rounded-xl bg-cash-well"
        />
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-cash-well">
          <CashIcon name="game" size={20} />
        </View>
      )}
      <View className="flex-1 gap-1">
        <Typography numberOfLines={1} className="text-[15px] font-medium text-cash-foreground">
          {game.title}
        </Typography>
        {game.short_text ? (
          <Typography numberOfLines={1} type="body-xs" className="text-cash-muted">
            {game.short_text}
          </Typography>
        ) : (
          <Typography numberOfLines={1} type="body-xs" className="text-cash-muted">
            {game.published ? `Published ${formatDate(game.published_at)}` : 'Unpublished draft'}
          </Typography>
        )}
      </View>
      {!game.published ? (
        <Typography type="body-xs" className="text-cash-muted">
          Draft
        </Typography>
      ) : null}
      <CashIcon name="arrow" size={13} color={muted} />
    </PressableFeedback>
  );
}
export function PaymentSkeletons() {
  return (
    <View>
      {[0, 1, 2].map((row) => (
        <View
          key={row}
          className={`flex-row items-center gap-3 px-4 py-4 ${row < 2 ? 'border-b border-cash-border' : ''}`}
        >
          <Skeleton className="h-11 w-11 rounded-full" />
          <View className="flex-1 gap-1">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </View>
          <Skeleton className="h-5 w-16 rounded-md" />
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
          className={`flex-row items-center gap-3 px-4 py-4 ${row < 2 ? 'border-b border-cash-border' : ''}`}
        >
          <Skeleton className="h-12 w-12 rounded-xl" />
          <View className="flex-1 gap-1">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </View>
          <Skeleton className="h-4 w-10 rounded-md" />
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
          className={`flex-row items-center gap-3 px-4 py-3 ${row < 2 ? 'border-b border-cash-border' : ''}`}
        >
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-4 flex-1 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
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
      className={`flex-row justify-between gap-5 py-4 ${last ? '' : 'border-b border-cash-border'}`}
    >
      <Typography type="body-sm" className="text-cash-muted">
        {label}
      </Typography>
      <Typography
        selectable
        type="body-sm"
        className="flex-1 text-right font-medium text-cash-foreground"
      >
        {children}
      </Typography>
    </View>
  );
}
