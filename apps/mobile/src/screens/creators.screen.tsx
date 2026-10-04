import type { UserWithRevenueDto } from '@itch/protocol';
import { Typography } from 'heroui-native/text';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { useCreators } from '../api/queries';
import { CashState, PaymentSkeletons } from '../components/cash-ui.component';
import { PageHeader } from '../components/page-header.component';
import { Button } from '../components/ui/button';
import { formatMoney } from '../utils/payments.format';

function CreatorRow({ creator, last }: { creator: UserWithRevenueDto; last: boolean }) {
  return (
    <View
      accessibilityLabel={`@${creator.username}, gross revenue ${formatMoney(creator.revenue_cents)}`}
      className={`min-h-[64px] flex-row items-center justify-between gap-3 px-4 py-3 ${last ? '' : 'border-b border-cash-border'}`}
    >
      <Typography numberOfLines={1} className="flex-1 text-[15px] font-medium text-cash-foreground">
        @{creator.username}
      </Typography>
      <Typography
        numberOfLines={1}
        className="text-[16px] font-medium text-cash-foreground"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatMoney(creator.revenue_cents)}
      </Typography>
    </View>
  );
}

export function CreatorsScreen() {
  const insets = useSafeAreaInsets();
  const [foreground, muted] = useCSSVariable(['--cash-foreground', '--cash-muted']) as string[];
  const creators = useCreators();
  const items = useMemo(() => creators.data?.pages.flat() ?? [], [creators.data]);

  const state = creators.isPending ? (
    <PaymentSkeletons />
  ) : creators.isError ? (
    <CashState
      title="Couldn't load creators"
      description="Try loading the creator list again."
      icon="info"
      action="Retry"
      onPress={() => void creators.refetch()}
    />
  ) : !items.length ? (
    <CashState
      title="No creators yet"
      description="The list fills in as creators join."
      icon="account"
    />
  ) : null;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: 24,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}
      refreshControl={
        <RefreshControl
          refreshing={creators.isRefetching}
          onRefresh={() => void creators.refetch()}
          tintColor={foreground}
          colors={[foreground]}
          progressViewOffset={insets.top}
        />
      }
      ListHeaderComponent={<PageHeader title="Creators" />}
      renderItem={({ item, index }) => (
        <View
          className={`mx-5 overflow-hidden bg-cash-surface ${index === 0 ? 'rounded-t-[24px]' : ''} ${index === items.length - 1 ? 'rounded-b-[24px]' : ''}`}
        >
          <CreatorRow creator={item} last={index === items.length - 1} />
        </View>
      )}
      ListEmptyComponent={<View className="mx-5 rounded-[24px] bg-cash-surface">{state}</View>}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (creators.hasNextPage && !creators.isFetchingNextPage) {
          void creators.fetchNextPage();
        }
      }}
      ListFooterComponent={
        creators.hasNextPage ? (
          <View className="h-16 items-center justify-center">
            {creators.isFetchNextPageError ? (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-9 px-3"
                onPress={() => void creators.fetchNextPage()}
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
  );
}
