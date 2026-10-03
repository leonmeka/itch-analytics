import '../../global.css';

import type { PaymentDto, PaymentsSummaryDto } from '@itch/protocol';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Card } from 'heroui-native/card';
import { Typography } from 'heroui-native/text';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  queryKeys,
  useImportPayments,
  useItchProfile,
  usePayments,
  usePaymentsSummary,
} from '../api/queries';
import { Button } from '../components/ui/button';
import { FileInput } from '../components/ui/file-input';
import { useAuth } from '../providers/auth.provider';

function HeroBackground() {
  return (
    <Svg height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 400 260" width="100%">
      <Defs>
        <LinearGradient id="hero" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#ff8a7a" />
          <Stop offset="1" stopColor="#fa5c5c" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#hero)" height="260" rx="0" width="400" x="0" y="0" />
    </Svg>
  );
}

function Avatar({ uri, name }: { uri: string | null; name: string }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Typography.Heading type="h4" className="text-white">
        {name.charAt(0).toUpperCase()}
      </Typography.Heading>
    </View>
  );
}

function Hero({ userId }: { userId: string | null }) {
  const { itchToken } = useAuth();
  const itchProfile = useItchProfile(userId, itchToken);
  const name = itchProfile.data?.display_name ?? itchProfile.data?.username ?? 'itch';

  return (
    <View className="h-52">
      <HeroBackground />

      <View className="flex-row items-start justify-between px-6 pt-16">
        <View className="flex-row items-center gap-3">
          <Avatar uri={itchProfile.data?.avatar_url ?? null} name={name} />
          <View>
            <Typography.Heading type="h3" className="text-white">
              {name}
            </Typography.Heading>
            <Typography type="body-xs" className="text-white/80">
              itch.io developer
            </Typography>
          </View>
        </View>

        <Pressable accessibilityRole="button" className="rounded-full bg-white/20 p-2">
          <Typography className="text-white">⚙︎</Typography>
        </Pressable>
      </View>
    </View>
  );
}

function HeadlineMetrics({ summary }: { summary: PaymentsSummaryDto | undefined }) {
  const primaryRevenue = summary?.revenue[0] ?? null;

  const formatRevenue = (currency: string, amountCents: number): string => {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amountCents / 100);
    } catch {
      return `${(amountCents / 100).toFixed(2)} ${currency}`;
    }
  };

  return (
    <View className="flex-row flex-wrap gap-3 px-6">
      <Card className="min-w-[45%] flex-1">
        <Card.Body>
          <Typography type="body-xs" className="text-muted">
            Gross revenue
          </Typography>
          {primaryRevenue ? (
            <Typography.Heading type="h3" className="text-foreground">
              {formatRevenue(primaryRevenue.currency, primaryRevenue.amount_cents)}
            </Typography.Heading>
          ) : (
            <Typography.Heading type="h3" className="text-foreground">
              —
            </Typography.Heading>
          )}
        </Card.Body>
      </Card>

      <Card className="min-w-[45%] flex-1">
        <Card.Body>
          <Typography type="body-xs" className="text-muted">
            Payments
          </Typography>
          <Typography.Heading type="h3" className="text-foreground">
            {summary?.total ?? '—'}
          </Typography.Heading>
        </Card.Body>
      </Card>
    </View>
  );
}

function PaymentRow({ payment }: { payment: PaymentDto }) {
  const date = payment.purchased_at
    ? new Date(payment.purchased_at).toLocaleDateString('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <View className="flex-row items-center justify-between border-b border-border px-6 py-3">
      <View className="flex-1">
        <Typography type="body-sm" className="text-foreground">
          {payment.object_name ?? 'Payment'}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          {date ?? ''} · {payment.source ?? ''}
        </Typography>
      </View>

      <Typography.Heading type="h6" className="text-foreground">
        {payment.amount != null ? `$${payment.amount}` : '—'}
      </Typography.Heading>
    </View>
  );
}

/** itch.io's API hides revenue; users pick the dashboard CSV export. */
function PaymentsSyncCard({ userId }: { userId: string }) {
  const importMutation = useImportPayments();

  return (
    <Card className="mx-6 my-3">
      <Card.Body className="gap-2">
        <Typography className="text-foreground">Sync purchases</Typography>
        <Typography type="body-xs" className="text-muted">
          itch.io's API doesn't expose revenue. Download the CSV from
          itch.io/dashboard/export-purchases/all, then pick it here (deduplicated automatically).
        </Typography>
        <FileInput
          isDisabled={importMutation.isPending}
          onFile={(file) => importMutation.mutate({ userId, csv: file.text })}
        />
        {importMutation.isSuccess ? (
          <Typography type="body-xs" className="text-muted">
            Imported {importMutation.data?.imported ?? 0} new · {importMutation.data?.updated ?? 0}{' '}
            updated · {importMutation.data?.skipped ?? 0} unchanged
          </Typography>
        ) : null}
        {importMutation.isError ? (
          <Typography type="body-xs" className="text-danger">
            Import failed — {String(importMutation.error.message)}
          </Typography>
        ) : null}
      </Card.Body>
    </Card>
  );
}

export function DashboardScreen() {
  const { user, logout } = useAuth();
  const userId = user?.id ?? null;
  const insets = useSafeAreaInsets();
  const payments = usePayments(userId);
  const summary = usePaymentsSummary(userId);

  const items = useMemo(() => payments.data?.pages.flatMap((page) => page) ?? [], [payments.data]);

  const listFooter = (
    <View className="gap-4 pb-8">
      {userId ? <PaymentsSyncCard userId={userId} /> : null}

      <View className="px-6">
        <Button variant="secondary" onPress={logout}>
          Sign out
        </Button>
      </View>
    </View>
  );

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      data={items}
      keyExtractor={(payment) => payment.id}
      ListEmptyComponent={
        payments.isPending ? (
          <ActivityIndicator className="py-10" size="large" color="#8f8f99" />
        ) : (
          <Typography.Paragraph type="body-sm" className="py-10 text-center text-muted">
            No payments yet — sync your CSV below.
          </Typography.Paragraph>
        )
      }
      ListFooterComponent={listFooter}
      ListHeaderComponent={
        <View className="gap-6">
          <Hero userId={userId} />
          <HeadlineMetrics summary={summary.data} />

          <Typography.Heading type="h4" className="px-6 text-foreground">
            Payments
          </Typography.Heading>
        </View>
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (payments.hasNextPage && !payments.isFetchingNextPage) {
          void payments.fetchNextPage();
        }
      }}
      refreshing={payments.isRefetching}
      renderItem={({ item }) => <PaymentRow payment={item} />}
      onRefresh={() => void payments.refetch()}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#ffffff33',
    borderRadius: 999,
    height: 56,
    width: 56,
  },
  avatarFallback: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
