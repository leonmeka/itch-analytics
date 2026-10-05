import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input } from 'heroui-native/input';
import { Typography } from 'heroui-native/text';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { usePayments, usePaymentsSummary } from '../api/queries';
import { Icon } from '../components/icon.component';
import { PageHeader } from '../components/page-header.component';
import { ContentState, PaymentRow, PaymentSkeletons } from '../components/screen-ui.component';
import { Button } from '../components/ui/button';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../providers/auth.provider';
import { useSync } from '../providers/sync.provider';

type PaymentsNavigation = NativeStackNavigationProp<RootStackParamList, 'Payments'>;

export function PaymentsScreen() {
  const navigation = useNavigation<PaymentsNavigation>();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { startSync } = useSync();
  const [foreground, muted] = useCSSVariable(['--app-foreground', '--app-muted']) as string[];
  const insets = useSafeAreaInsets();
  const [searchDraft, setSearchDraft] = useState('');
  const [isSearchFocused, setSearchFocused] = useState(false);
  const [search, setSearch] = useState('');
  const summary = usePaymentsSummary(userId, search ? { search } : undefined);
  const payments = usePayments(userId, search ? { search } : undefined);
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
  const busy = payments.isRefetching || summary.isRefetching;
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
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}
      refreshControl={
        <RefreshControl
          refreshing={busy}
          onRefresh={() => {
            void payments.refetch();
            void summary.refetch();
          }}
          tintColor={foreground}
          colors={[foreground]}
          progressViewOffset={insets.top}
        />
      }
      ListHeaderComponent={
        <>
          <PageHeader title="Payments" onBack={() => navigation.goBack()} />
          <View className="gap-5 px-5 pb-5">
            <View
              className={`flex-row items-center gap-2 rounded-full border bg-app-surface pl-4 ${isSearchFocused ? 'border-app-accent' : 'border-transparent'}`}
            >
              <Icon name="search" size={19} color={muted} />
              <Input
                variant="secondary"
                background={null}
                className="h-12 flex-1 rounded-none border-0 bg-transparent px-1 text-[15px] text-app-foreground ios:shadow-none ios:outline-0 ios:focus:outline-0 android:shadow-none android:border-0 android:focus:border-0"
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
                <Icon name="arrow" size={18} />
              </Button>
            </View>
            <View className="flex-row items-center justify-between">
              <Typography type="body-sm" className="text-app-muted">
                {search ? `Results for “${search}”` : `${summary.data?.total ?? '—'} items`}
              </Typography>
            </View>
          </View>
        </>
      }
      renderItem={({ item, index }) => (
        <View
          className={`mx-5 overflow-hidden bg-app-surface ${index === 0 ? 'rounded-t-app-card' : ''} ${index === items.length - 1 ? 'rounded-b-app-card' : ''}`}
        >
          <PaymentRow
            payment={item}
            onPress={() => navigation.navigate('PaymentDetail', { payment: item })}
            last={index === items.length - 1}
          />
        </View>
      )}
      ListEmptyComponent={
        <View className="mx-5 overflow-hidden rounded-app-card bg-app-surface">
          {paymentsState}
        </View>
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
                className="min-h-11 px-4"
                onPress={() => void payments.fetchNextPage()}
              >
                <Button.Label className="text-[13px] text-app-link">
                  Couldn't load more — tap to retry
                </Button.Label>
              </Button>
            ) : payments.isFetchingNextPage ? (
              <ActivityIndicator color={muted} />
            ) : null}
          </View>
        ) : items.length > 0 ? (
          <Typography type="body-xs" className="py-6 text-center text-app-muted">
            You're all caught up.
          </Typography>
        ) : null
      }
    />
  );
}
