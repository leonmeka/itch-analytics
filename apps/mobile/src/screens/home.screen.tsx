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
import { StatCard } from '../components/charts/stat-card.component';
import { TimeSeriesChart } from '../components/charts/time-series-chart.component';
import { DashboardScrollView } from '../components/dashboard-scroll-view.component';
import { Icon } from '../components/icon.component';
import { PageHeader } from '../components/page-header.component';
import { formatLastSynced } from '../components/payments-sync.component';
import {
  ContentState,
  GameRow,
  GameSkeletons,
  PaymentRow,
  PaymentSkeletons,
  SectionHeader,
} from '../components/screen-ui.component';
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
  const [foreground] = useCSSVariable(['--app-foreground']) as string[];
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
      games.refetch(),
    ]);
  };
  const busy =
    payments.isRefetching ||
    summary.isRefetching ||
    graph.isRefetching ||
    viewsGraph.isRefetching ||
    games.isRefetching;
  const gamesState = games.isPending ? (
    <GameSkeletons />
  ) : games.isError ? (
    <ContentState
      title="Games couldn't load"
      description="Check your connection and try again."
      icon="info"
      action="Try again"
      onPress={() => void games.refetch()}
    />
  ) : (
    <ContentState
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
    <ContentState
      title="Payments couldn't load"
      description="Check your connection and try again."
      icon="info"
      action="Try again"
      onPress={() => void payments.refetch()}
    />
  ) : (
    <ContentState
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
              className="h-11 min-w-[100px] shrink-0 rounded-full bg-app-surface px-4"
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
              <Icon name="sync" size={20} />
              <Button.Label className="text-[14px] font-medium text-app-foreground">
                Sync
              </Button.Label>
            </Button>
          }
        />
        <View className="mx-auto w-full max-w-[640px] gap-3 px-5">
          <Card className="rounded-app-card bg-app-surface p-5 shadow-none">
            {graph.isPending ? (
              <View>
                <Skeleton className="h-4 w-24 rounded-app-placeholder" />
                <Skeleton className="mt-0.5 h-8 w-52 rounded-app-placeholder" />
                <View className="mt-3">
                  <Skeleton className="h-[176px] w-full rounded-app-media" />
                </View>
              </View>
            ) : graph.isError ? (
              <ContentState
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
                <ContentState
                  title="Your first sale starts here"
                  description="Sync your itch.io purchase history to see your revenue over time."
                  icon="receipt"
                  action="Sync purchases"
                  onPress={startSync}
                />
                <Button
                  onPress={() => navigation.navigate('Payments')}
                  className="h-[50px] rounded-full bg-app-accent"
                >
                  <Button.Label className="text-[14px] font-medium text-app-accent-ink">
                    View payments
                  </Button.Label>
                </Button>
              </View>
            )}
          </Card>
          {graph.isPending ? (
            <>
              <View className="flex-row gap-3">
                <Skeleton className="h-[128px] flex-1 rounded-app-card" />
                <Skeleton className="h-[128px] flex-1 rounded-app-card" />
              </View>
              <View className="flex-row gap-3">
                <Skeleton className="h-[128px] flex-1 rounded-app-card" />
                <Skeleton className="h-[128px] flex-1 rounded-app-card" />
              </View>
            </>
          ) : graph.isError || !graph.data ? (
            <Card className="rounded-app-card bg-app-surface shadow-none">
              <ContentState
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
              <Skeleton className="h-[128px] flex-1 rounded-app-card" />
            </View>
          ) : viewsGraph.isError ? (
            <Card className="rounded-app-card bg-app-surface shadow-none">
              <ContentState
                title="Views couldn't load"
                description="Try loading your views again."
                icon="info"
                action="Retry"
                onPress={() => void viewsGraph.refetch()}
              />
            </Card>
          ) : viewsGraph.data?.views.length ? (
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-app-card bg-app-surface p-4">
                <TimeSeriesChart
                  label="Total views"
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
            <SectionHeader
              title="Games"
              action="See all"
              onPress={() => navigation.navigate('Games')}
            />
            <Card className="gap-0 overflow-hidden rounded-app-card bg-app-surface p-0 shadow-none">
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
            <SectionHeader
              title="Payments"
              action="See all"
              onPress={() => navigation.navigate('Payments')}
            />
            <Card className="gap-0 overflow-hidden rounded-app-card bg-app-surface p-0 shadow-none">
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
