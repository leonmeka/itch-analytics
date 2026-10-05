import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from 'heroui-native/card';
import { Typography } from 'heroui-native/text';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/icon.component';
import { PageHeader } from '../components/page-header.component';
import { DetailRow } from '../components/screen-ui.component';
import type { RootStackParamList } from '../navigation/types';
import { formatDate, formatMoney, paymentAmount, paymentSource } from '../utils/payments.format';

export function PaymentDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'PaymentDetail'>) {
  const insets = useSafeAreaInsets();
  const { payment } = route.params;
  const rows: { label: string; cents: number | null }[] = [
    { label: 'Unit price', cents: payment.product_price_cents },
    { label: 'Tax added', cents: payment.tax_added_cents },
    { label: 'Tip', cents: payment.tip_cents },
    { label: 'Gross amount', cents: payment.amount_cents },
    { label: 'Marketplace fee', cents: payment.marketplace_fee_cents },
    { label: 'Payment processor fee', cents: payment.source_fee_cents },
    { label: 'Net to you', cents: payment.amount_delivered_cents },
  ];
  return (
    <View className="flex-1 bg-app-background" style={{ paddingTop: insets.top }}>
      <PageHeader title="Payment" backLabel="Back" onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View className="mx-auto w-full max-w-[640px] px-5">
          <View className="items-center pb-8">
            <View className="mb-5 h-[72px] w-[72px] items-center justify-center rounded-full bg-app-accent-soft">
              <Icon name="receipt" size={30} />
            </View>
            <Typography className="text-center text-[23px] font-medium tracking-[-0.5px] text-app-foreground">
              {payment.object_name ?? '–'}
            </Typography>
            <Typography
              adjustsFontSizeToFit
              numberOfLines={1}
              className="mt-3 text-[52px] font-medium leading-[64px] tracking-[-2px] text-app-foreground"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {paymentAmount(payment)}
            </Typography>
            <Typography type="body-sm" className="mt-1 text-app-muted">
              Gross payment
            </Typography>
          </View>
          <Card className="gap-0 rounded-app-card bg-app-surface px-5 py-1 shadow-none">
            <DetailRow label="Purchased">{formatDate(payment.purchased_at, true)}</DetailRow>
            <DetailRow label="Payment method">{paymentSource(payment.source)}</DetailRow>
            <DetailRow label="Purchase ID">{payment.external_id}</DetailRow>
            {payment.country_code ? (
              <DetailRow label="Country">{payment.country_code}</DetailRow>
            ) : null}
            {payment.payout ? (
              <DetailRow label="Payout status">{payment.payout.replaceAll('_', ' ')}</DetailRow>
            ) : null}
            <DetailRow label="Imported" last>
              {formatDate(payment.created_at)}
            </DetailRow>
          </Card>
          <Typography className="mb-2 mt-6 text-[21px] font-medium tracking-[-0.6px] text-app-foreground">
            Revenue breakdown
          </Typography>
          <Card className="gap-0 rounded-app-card bg-app-surface px-5 py-1 shadow-none">
            {rows.map(({ label, cents }, index) => (
              <DetailRow key={label} label={label} last={index === rows.length - 1}>
                {cents != null ? formatMoney(cents) : '—'}
              </DetailRow>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
