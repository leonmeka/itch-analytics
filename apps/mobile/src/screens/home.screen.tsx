import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from 'heroui-native/card';
import { Skeleton } from 'heroui-native/skeleton';
import { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import {
  useGames,
  useLastSynced,
  useOauthIdentity,
  usePayments,
  usePaymentsGraph,
  usePaymentsSummary,
  useViewsGraph,
} from '../api/queries';
import { CashIcon } from '../components/cash-icon.component';
import {
  CashSection,
  CashState,
  GameRow,
  GameSkeletons,
  PaymentRow,
  PaymentSkeletons,
} from '../components/cash-ui.component';
import { StatCard } from '../components/charts/stat-card.component';
import { TimeSeriesChart } from '../components/charts/time-series-chart.component';
import { DashboardScrollView } from '../components/dashboard-scroll-view.component';
import { PageHeader } from '../components/page-header.component';
import { formatLastSynced } from '../components/payments-sync.component';
import { Button } from '../components/ui/button';
import type { RootStackParamList, TabsParamList } from '../navigation/types';
import { useAuth } from '../providers/auth.provider';
import { useSync } from '../providers/sync.provider';
import { formatMoney } from '../utils/payments.format';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavigation>();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { startSync, phase: syncPhase, gamesSyncing } = useSync();
  const syncing = syncPhase === 'running' || gamesSyncing;
  const profile = useOauthIdentity(userId);
  const lastSynced = useLastSynced();
  const summary = usePaymentsSummary(userId);
  const graph = usePaymentsGraph(userId);
  const payments = usePayments(userId);
  const games = useGames(userId);
  const viewsGraph = useViewsGraph(userId);
  const [foreground] = useCSSVariable(['--cash-foreground']) as string[];
  const gameItems = useMemo(() => games.data?.pages.flat() ?? [], [games.data]);
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (
      payments.data?.pages.flat().filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      }) ?? []
    );
  }, [payments.data]);
  const refresh = async () => {
    await Promise.all([
      summary.refetch(),
      graph.refetch(),
      payments.refetch(),
      viewsGraph.refetch(),
    ]);
  };
  const busy =
    payments.isRefetching || summary.isRefetching || graph.isRefetching || viewsGraph.isRefetching;
  const gamesState = games.isPending ? (
    <GameSkeletons />
  ) : games.isError ? (
    <CashState
      title="Games couldn't load"
      description="Check your connection and try again."
      icon="info"
      action="Try again"
      onPress={() => void games.refetch()}
    />
  ) : (
    <CashState
      title="No games yet"
      description="Sync your itch.io account to pull in your games."
      icon="game"
      action="Sync now"
      onPress={startSync}
    />
  );
  const paymentsState = payments.isPending ? (
    <PaymentSkeletons />
  ) : payments.isError ? (
    <CashState
      title="Payments couldn't load"
      description="Check your connection and try again."
      icon="info"
      action="Try again"
      onPress={() => void payments.refetch()}
    />
  ) : (
    <CashState
      title="Your first sale starts here"
      description="Sync your itch.io purchase history to see your revenue and payments."
      action="Sync purchases"
      onPress={startSync}
    />
  );
  return (
    <DashboardScrollView
      refreshControl={
        <RefreshControl
          refreshing={busy}
          onRefresh={() => void refresh()}
          tintColor={foreground}
          colors={[foreground]}
          progressViewOffset={insets.top}
        />
      }
    >
      <View className="relative">
        <PageHeader
          hero
          title={
            profile.data?.username ? `@${profile.data.username}` : (profile.data?.name ?? 'Welcome')
          }
          action={
            <Button
              variant="ghost"
              className="h-11 min-w-[100px] shrink-0 rounded-full bg-cash-surface px-4"
              accessibilityLabel={syncPhase === 'error' ? 'Retry sync' : 'Sync everything'}
              accessibilityHint={
                lastSynced.data
                  ? `Last synced ${formatLastSynced(lastSynced.data)}`
                  : 'Sync your account data'
              }
              isLoading={syncing}
              isDisabled={syncing}
              onPress={startSync}
            >
              <CashIcon name="sync" size={20} />
              <Button.Label className="text-[14px] font-medium text-cash-foreground">
                Sync
              </Button.Label>
            </Button>
          }
        />
        <View className="mx-auto w-full max-w-[640px] gap-3 px-5">
          <Card className="rounded-[28px] bg-cash-surface p-5 shadow-none">
            {graph.isPending ? (
              <View>
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="mt-0.5 h-8 w-52 rounded-lg" />
                <View className="mt-3">
                  <Skeleton className="h-[176px] w-full rounded-2xl" />
                </View>
              </View>
            ) : graph.isError ? (
              <CashState
                title="Chart unavailable"
                description="Try loading your revenue history again."
                icon="info"
                action="Retry"
                onPress={() => void graph.refetch()}
              />
            ) : graph.data.revenue.length ? (
              <TimeSeriesChart
                label="Gross revenue"
                points={graph.data.revenue.map((point) => ({
                  date: point.date,
                  value: point.value,
                }))}
                formatValue={(value) => formatMoney(value)}
                aspectRatio={2.5}
              />
            ) : (
              <View className="gap-5">
                <CashState
                  title="Your first sale starts here"
                  description="Sync your itch.io purchase history to see your revenue over time."
                  icon="receipt"
                  action="Sync purchases"
                  onPress={startSync}
                />
                <Button
                  onPress={() => navigation.navigate('Payments')}
                  className="h-[50px] rounded-full bg-cash-accent"
                >
                  <Button.Label className="text-[14px] font-medium text-cash-accent-ink">
                    View payments
                  </Button.Label>
                </Button>
              </View>
            )}
          </Card>
          {graph.isPending ? (
            <>
              <View className="flex-row gap-3">
                <Skeleton className="h-[128px] flex-1 rounded-[24px]" />
                <Skeleton className="h-[128px] flex-1 rounded-[24px]" />
              </View>
              <View className="flex-row gap-3">
                <Skeleton className="h-[128px] flex-1 rounded-[24px]" />
                <Skeleton className="h-[128px] flex-1 rounded-[24px]" />
              </View>
            </>
          ) : graph.isError || !graph.data ? (
            <Card className="rounded-[24px] bg-cash-surface shadow-none">
              <CashState
                title="Stats unavailable"
                description="Try loading your revenue history again."
                icon="info"
                action="Retry"
                onPress={() => void graph.refetch()}
              />
            </Card>
          ) : (
            <>
              <View className="flex-row gap-3">
                <StatCard
                  label="Total payments"
                  points={graph.data.payments}
                  formatValue={(value) => String(Math.round(value))}
                />
                <StatCard
                  label="Total customers"
                  points={graph.data.customers}
                  formatValue={(value) => String(Math.round(value))}
                />
              </View>
              <View className="flex-row gap-3">
                <StatCard
                  label="Average payment"
                  points={graph.data.average}
                  formatValue={formatMoney}
                />
                <StatCard label="Tip revenue" points={graph.data.tips} formatValue={formatMoney} />
              </View>
            </>
          )}
          {viewsGraph.isPending ? (
            <View className="flex-row gap-3">
              <Skeleton className="h-[128px] flex-1 rounded-[24px]" />
            </View>
          ) : viewsGraph.isError ? (
            <Card className="rounded-[24px] bg-cash-surface shadow-none">
              <CashState
                title="Views couldn't load"
                description="Try loading your views again."
                icon="info"
                action="Retry"
                onPress={() => void viewsGraph.refetch()}
              />
            </Card>
          ) : viewsGraph.data?.views.length ? (
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-[24px] bg-cash-surface p-4">
                <TimeSeriesChart
                  label="Total Views"
                  points={viewsGraph.data.views.map((point) => ({
                    date: point.date,
                    value: point.value,
                  }))}
                  formatValue={(value) => String(Math.round(value))}
                  aspectRatio={5}
                />
              </View>
            </View>
          ) : null}
          <View>
            <CashSection
              title="Games"
              action="See all"
              onPress={() => navigation.navigate('Games')}
            />
            <Card className="gap-0 overflow-hidden rounded-[24px] bg-cash-surface p-0 shadow-none">
              {gameItems.length
                ? gameItems
                    .slice(0, 4)
                    .map((game, index) => (
                      <GameRow
                        key={game.id}
                        game={game}
                        onPress={() => navigation.navigate('GameDetail', { game })}
                        last={index === Math.min(gameItems.length, 4) - 1}
                      />
                    ))
                : gamesState}
            </Card>
          </View>
          <View>
            <CashSection
              title="Payments"
              action="See all"
              onPress={() => navigation.navigate('Payments')}
            />
            <Card className="gap-0 overflow-hidden rounded-[24px] bg-cash-surface p-0 shadow-none">
              {items.length
                ? items
                    .slice(0, 4)
                    .map((payment, index) => (
                      <PaymentRow
                        key={payment.id}
                        payment={payment}
                        onPress={() => navigation.navigate('PaymentDetail', { payment })}
                        last={index === Math.min(items.length, 4) - 1}
                      />
                    ))
                : paymentsState}
            </Card>
          </View>
        </View>
      </View>
    </DashboardScrollView>
  );
}
