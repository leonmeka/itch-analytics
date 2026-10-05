import type { UserWithRevenueDto } from '@itch/protocol';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Typography } from 'heroui-native/text';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import RedLogo from '../../assets/itch-logo-red.svg';
import { useCreators } from '../api/queries';
import { Icon } from '../components/icon.component';
import { PageHeader } from '../components/page-header.component';
import { PressableFeedback } from '../components/pressable-feedback.component';
import { ContentState, CreatorsSkeletons } from '../components/screen-ui.component';
import { Button } from '../components/ui/button';
import type { RootStackParamList } from '../navigation/types';
import { formatMoney } from '../utils/payments.format';

function CreatorRow({
  creator,
  last,
  onPress,
}: {
  creator: UserWithRevenueDto;
  last: boolean;
  onPress: () => void;
}) {
  const muted = useCSSVariable('--app-muted') as string;
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`@${creator.username}, gross revenue ${formatMoney(creator.revenue_cents)}. View profile.`}
      onPress={onPress}
      className={`min-h-[64px] flex-row items-center gap-3 px-4 py-3 ${last ? '' : 'border-b border-app-border'}`}
    >
      {creator.avatar_url ? (
        <Image
          source={{ uri: creator.avatar_url }}
          accessibilityLabel={`@${creator.username}'s itch.io avatar`}
          className="h-11 w-11 rounded-full bg-app-well"
        />
      ) : (
        <View className="h-11 w-11 items-center justify-center rounded-full bg-app-accent-soft">
          <RedLogo width={23} height={21} />
        </View>
      )}
      <Typography numberOfLines={1} className="flex-1 text-[15px] font-medium text-app-foreground">
        @{creator.username}
      </Typography>
      <View className="max-w-[45%] flex-row items-center gap-2">
        <Typography
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          className="shrink text-[16px] font-medium text-app-foreground"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatMoney(creator.revenue_cents)}
        </Typography>
        <Icon name="arrow" size={13} color={muted} />
      </View>
    </PressableFeedback>
  );
}

export function CreatorsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [foreground, muted] = useCSSVariable(['--app-foreground', '--app-muted']) as string[];
  const creators = useCreators();
  const items = useMemo(() => creators.data?.pages.flat() ?? [], [creators.data]);

  const state = creators.isPending ? (
    <CreatorsSkeletons />
  ) : creators.isError ? (
    <ContentState
      title="Couldn't load creators"
      description="Try loading the creator list again."
      icon="info"
      action="Retry"
      onPress={() => void creators.refetch()}
    />
  ) : !items.length ? (
    <ContentState
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
          className={`mx-5 overflow-hidden bg-app-surface ${index === 0 ? 'rounded-t-app-card' : ''} ${index === items.length - 1 ? 'rounded-b-app-card' : ''}`}
        >
          <CreatorRow
            creator={item}
            last={index === items.length - 1}
            onPress={() => navigation.navigate('Creator', { userId: item.id })}
          />
        </View>
      )}
      ListEmptyComponent={
        <View className="mx-5 overflow-hidden rounded-app-card bg-app-surface">{state}</View>
      }
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
                className="min-h-11 px-4"
                onPress={() => void creators.fetchNextPage()}
              >
                <Button.Label className="text-[13px] text-app-link">
                  Couldn't load more — tap to retry
                </Button.Label>
              </Button>
            ) : creators.isFetchingNextPage ? (
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
