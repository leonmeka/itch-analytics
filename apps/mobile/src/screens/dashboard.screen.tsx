import '../../global.css';
import type { GameDto, PaymentDto } from '@itch/protocol';
import { StatusBar } from 'expo-status-bar';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Skeleton } from 'heroui-native/skeleton';
import { Typography } from 'heroui-native/text';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  RefreshControl,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable, useUniwind } from 'uniwind';
import RedLogo from '../../assets/itch-logo-red.svg';
import {
  useGames,
  useLastSynced,
  useOauthIdentity,
  usePayments,
  usePaymentsGraph,
  usePaymentsSummary,
  useSyncGames,
} from '../api/queries';
import { BottomNavigation, type NavigationTab } from '../components/bottom-navigation.component';
import { CashIcon } from '../components/cash-icon.component';
import {
  CashIconButton,
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
import {
  formatLastSynced,
  PaymentsSync,
  type PaymentsSyncHandle,
  type PaymentsSyncPhase,
} from '../components/payments-sync.component';
import { Button } from '../components/ui/button';
import { useAuth } from '../providers/auth.provider';
import { formatDate, formatMoney } from '../utils/payments.format';
import { CreatorScreen } from './creator.screen';
import { CreatorsScreen } from './creators.screen';
import { GameDetailScreen } from './game-detail.screen';
import { ItchSyncScreen } from './itch-sync.screen';
import { PaymentDetailScreen } from './payment-detail.screen';
import { SettingsScreen } from './settings.screen';

export function DashboardScreen() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const profile = useOauthIdentity(userId);
  const [tab, setTab] = useState<NavigationTab>('Home');
  const [detail, setDetail] = useState<PaymentDto | null>(null);
  const [gameDetail, setGameDetail] = useState<GameDto | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncPhase, setSyncPhase] = useState<PaymentsSyncPhase>('idle');
  const syncRef = useRef<PaymentsSyncHandle>(null);
  const [searchDraft, setSearchDraft] = useState('');
  const [isSearchFocused, setSearchFocused] = useState(false);
  const [search, setSearch] = useState('');
  const { theme } = useUniwind();
  const insets = useSafeAreaInsets();
  const [foreground, muted] = useCSSVariable(['--cash-foreground', '--cash-muted']) as string[];
  const lastSynced = useLastSynced();
  const summary = usePaymentsSummary(userId, search ? { search } : undefined);
  const graph = usePaymentsGraph(userId, search ? { search } : undefined);
  const payments = usePayments(userId, tab === 'Payments' && search ? { search } : undefined);
  const games = useGames(userId);
  const syncGames = useSyncGames();
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
  const navigate = (next: NavigationTab) => {
    setTab(next);
    setDetail(null);
    setGameDetail(null);
    setCreatorId(null);
    setSyncOpen(false);
  };
  const startSync = () => syncRef.current?.start();
  const refresh = async () => {
    await Promise.all([summary.refetch(), graph.refetch(), payments.refetch()]);
  };
  const busy = payments.isRefetching || summary.isRefetching || graph.isRefetching;
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (detail) {
        setDetail(null);
        return true;
      }
      if (gameDetail) {
        setGameDetail(null);
        return true;
      }
      if (creatorId) {
        setCreatorId(null);
        return true;
      }
      if (tab !== 'Home') {
        setTab('Home');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [creatorId, detail, gameDetail, tab]);
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
      onPress={() => userId && syncGames.mutate({ userId })}
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
      title={search ? 'No matching payments' : 'Your first sale starts here'}
      description={
        search
          ? 'Try another product name or purchase ID.'
          : 'Sync your itch.io purchase history to see your revenue and payments.'
      }
      action={search ? 'Clear search' : 'Sync purchases'}
      onPress={
        search
          ? () => {
              setSearch('');
              setSearchDraft('');
            }
          : startSync
      }
    />
  );
  return (
    <View className="flex-1 bg-cash-background">
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {detail ? (
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          <PaymentDetailScreen payment={detail} onBack={() => setDetail(null)} />
        </View>
      ) : gameDetail ? (
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          <GameDetailScreen game={gameDetail} onBack={() => setGameDetail(null)} />
        </View>
      ) : creatorId ? (
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          <CreatorScreen userId={creatorId} onBack={() => setCreatorId(null)} />
        </View>
      ) : tab === 'Settings' ? (
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          <SettingsScreen />
        </View>
      ) : tab === 'Creators' ? (
        <CreatorsScreen onSelect={setCreatorId} />
      ) : tab === 'Games' ? (
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          <View className="mx-auto w-full max-w-[640px] px-5">
            <View className="flex-row items-center gap-3 py-3">
              <CashIconButton name="back" label="Back to home" onPress={() => navigate('Home')} />
              <Typography className="flex-1 text-[20px] font-medium text-cash-foreground">
                Games
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                className="h-11 rounded-full bg-cash-surface px-4"
                accessibilityLabel="Sync games"
                isDisabled={syncGames.isPending}
                onPress={() => userId && syncGames.mutate({ userId })}
              >
                <CashIcon name="sync" size={17} />
                <Button.Label className="text-cash-foreground">
                  {syncGames.isPending
                    ? 'Syncing…'
                    : syncGames.isError
                      ? 'Sync failed'
                      : 'Sync now'}
                </Button.Label>
              </Button>
            </View>
          </View>
          <FlatList
            data={gameItems}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 24,
              maxWidth: 640,
              width: '100%',
              alignSelf: 'center',
            }}
            refreshControl={
              <RefreshControl
                refreshing={games.isRefetching}
                onRefresh={() => void games.refetch()}
                tintColor={foreground}
                colors={[foreground]}
              />
            }
            renderItem={({ item, index }) => (
              <View
                className={`mx-5 overflow-hidden bg-cash-surface ${index === 0 ? 'rounded-t-[24px]' : ''} ${index === gameItems.length - 1 ? 'rounded-b-[24px]' : ''}`}
              >
                <GameRow
                  game={item}
                  onPress={() => setGameDetail(item)}
                  last={index === gameItems.length - 1}
                />
              </View>
            )}
            ListEmptyComponent={
              <View className="mx-5 rounded-[24px] bg-cash-surface">{gamesState}</View>
            }
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (games.hasNextPage && !games.isFetchingNextPage) {
                void games.fetchNextPage();
              }
            }}
            ListFooterComponent={
              games.hasNextPage ? (
                <View className="h-16 items-center justify-center">
                  {games.isFetchNextPageError ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-9 px-3"
                      onPress={() => void games.fetchNextPage()}
                    >
                      <Button.Label className="text-[13px] text-cash-link">
                        Couldn't load more — tap to retry
                      </Button.Label>
                    </Button>
                  ) : (
                    <ActivityIndicator color={muted} />
                  )}
                </View>
              ) : gameItems.length > 0 ? (
                <Typography type="body-xs" className="py-6 text-center text-cash-muted">
                  You're all caught up.
                </Typography>
              ) : null
            }
          />
        </View>
      ) : tab === 'Payments' ? (
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          <View className="mx-auto w-full max-w-[640px] px-5">
            <View className="flex-row items-center gap-3 py-3">
              <CashIconButton name="back" label="Back to home" onPress={() => navigate('Home')} />
              <Typography className="flex-1 text-[20px] font-medium text-cash-foreground">
                Payments
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                className="h-11 rounded-full bg-cash-surface px-4"
                accessibilityLabel="Sync purchases"
                isDisabled={syncPhase === 'running'}
                onPress={startSync}
              >
                <CashIcon name="sync" size={17} />
                <Button.Label className="text-cash-foreground">
                  {syncPhase === 'running'
                    ? 'Syncing…'
                    : syncPhase === 'error'
                      ? 'Sync failed'
                      : lastSynced.data
                        ? `Sync · ${formatLastSynced(lastSynced.data)}`
                        : 'Sync now'}
                </Button.Label>
              </Button>
            </View>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: 24,
              maxWidth: 640,
              width: '100%',
              alignSelf: 'center',
            }}
            refreshControl={
              <RefreshControl
                refreshing={busy}
                onRefresh={() => void refresh()}
                tintColor={foreground}
                colors={[foreground]}
              />
            }
            ListHeaderComponent={
              <View className="gap-5 px-5 pb-5">
                {userId ? (
                  <PaymentsSync
                    ref={syncRef}
                    userId={userId}
                    onNeedsVisible={() => setSyncOpen(true)}
                    onPhaseChange={setSyncPhase}
                  />
                ) : null}
                <View
                  className={`flex-row items-center gap-2 rounded-full border bg-cash-surface pl-4 ${isSearchFocused ? 'border-cash-accent' : 'border-transparent'}`}
                >
                  <CashIcon name="search" size={19} color={muted} />
                  <Input
                    variant="secondary"
                    background={null}
                    className="h-12 flex-1 rounded-none border-0 bg-transparent px-1 text-[15px] text-cash-foreground ios:shadow-none ios:outline-0 ios:focus:outline-0 android:shadow-none android:border-0 android:focus:border-0"
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Product or purchase ID"
                    placeholderTextColor={muted}
                    value={searchDraft}
                    maxLength={128}
                    returnKeyType="search"
                    onChangeText={(value) => {
                      setSearchDraft(value);
                      if (!value) setSearch('');
                    }}
                    onSubmitEditing={() => setSearch(searchDraft.trim())}
                    accessibilityLabel="Search payments by product or purchase ID"
                  />
                  <Button
                    isIconOnly
                    variant="ghost"
                    accessibilityLabel={searchDraft ? 'Search payments' : 'Search'}
                    onPress={() => setSearch(searchDraft.trim())}
                    className="h-11 w-11 rounded-full"
                  >
                    <CashIcon name="arrow" size={18} />
                  </Button>
                </View>
                <View className="flex-row items-center justify-between">
                  <Typography type="body-sm" className="text-cash-muted">
                    {search ? `Results for “${search}”` : `${summary.data?.total ?? '—'} items`}
                  </Typography>
                </View>
              </View>
            }
            renderItem={({ item, index }) => (
              <View
                className={`mx-5 overflow-hidden bg-cash-surface ${index === 0 ? 'rounded-t-[24px]' : ''} ${index === items.length - 1 ? 'rounded-b-[24px]' : ''}`}
              >
                <PaymentRow
                  payment={item}
                  onPress={() => setDetail(item)}
                  last={index === items.length - 1}
                />
              </View>
            )}
            ListEmptyComponent={
              <View className="mx-5 rounded-[24px] bg-cash-surface">{paymentsState}</View>
            }
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (payments.hasNextPage && !payments.isFetchingNextPage) {
                void payments.fetchNextPage();
              }
            }}
            ListFooterComponent={
              payments.hasNextPage ? (
                <View className="h-16 items-center justify-center">
                  {payments.isFetchNextPageError ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-9 px-3"
                      onPress={() => void payments.fetchNextPage()}
                    >
                      <Button.Label className="text-[13px] text-cash-link">
                        Couldn't load more — tap to retry
                      </Button.Label>
                    </Button>
                  ) : (
                    <ActivityIndicator color={muted} />
                  )}
                </View>
              ) : items.length > 0 ? (
                <Typography type="body-xs" className="py-6 text-center text-cash-muted">
                  You're all caught up.
                </Typography>
              ) : null
            }
          />
        </View>
      ) : (
        <DashboardScrollView
          key="dashboard"
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
            <View className="mx-auto w-full max-w-[640px] px-5 pb-3 pt-3">
              <View className="min-h-11 flex-row items-center justify-between">
                <View className="flex-1">
                  <Typography
                    type="body-xs"
                    className="text-[12px] leading-[16px] text-cash-hero-foreground"
                  >
                    {formatDate(new Date())}
                  </Typography>
                  <Typography
                    accessibilityRole="header"
                    numberOfLines={1}
                    className="text-[30px] font-medium leading-[38px] tracking-[-1px] text-cash-hero-foreground"
                  >
                    {profile.data?.username
                      ? `@${profile.data.username}`
                      : (profile.data?.name ?? 'Welcome')}
                  </Typography>
                </View>
                <Button
                  isIconOnly
                  variant="ghost"
                  className="h-11 w-11 rounded-full bg-cash-surface p-0"
                  accessibilityLabel="Open your creator profile"
                  onPress={() => {
                    if (userId) setCreatorId(userId);
                  }}
                >
                  {profile.data?.avatar_url ? (
                    <Image
                      source={{ uri: profile.data.avatar_url }}
                      className="h-11 w-11 rounded-full"
                    />
                  ) : (
                    <RedLogo width={23} height={21} />
                  )}
                </Button>
              </View>
            </View>
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
                      onPress={() => navigate('Payments')}
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
                    <StatCard
                      label="Tip revenue"
                      points={graph.data.tips}
                      formatValue={formatMoney}
                    />
                  </View>
                </>
              )}
              <View>
                <CashSection title="Games" action="See all" onPress={() => navigate('Games')} />
                <Card className="gap-0 overflow-hidden rounded-[24px] bg-cash-surface p-0 shadow-none">
                  {gameItems.length
                    ? gameItems
                        .slice(0, 4)
                        .map((game, index) => (
                          <GameRow
                            key={game.id}
                            game={game}
                            onPress={() => setGameDetail(game)}
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
                  onPress={() => navigate('Payments')}
                />
                <Card className="gap-0 overflow-hidden rounded-[24px] bg-cash-surface p-0 shadow-none">
                  {items.length
                    ? items
                        .slice(0, 4)
                        .map((payment, index) => (
                          <PaymentRow
                            key={payment.id}
                            payment={payment}
                            onPress={() => setDetail(payment)}
                            last={index === Math.min(items.length, 4) - 1}
                          />
                        ))
                    : paymentsState}
                </Card>
              </View>
            </View>
          </View>
        </DashboardScrollView>
      )}
      <BottomNavigation selectedTab={tab} onSelect={navigate} />
      {syncOpen && userId ? (
        <ItchSyncScreen userId={userId} onClose={() => setSyncOpen(false)} />
      ) : null}
    </View>
  );
}
