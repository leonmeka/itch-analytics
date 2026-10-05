import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Typography } from 'heroui-native/text';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { useGames } from '../api/queries';
import { PageHeader } from '../components/page-header.component';
import { ContentState, GameRow, GameSkeletons } from '../components/screen-ui.component';
import { Button } from '../components/ui/button';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../providers/auth.provider';
import { useSync } from '../providers/sync.provider';

type GamesNavigation = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export function GamesScreen() {
  const navigation = useNavigation<GamesNavigation>();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { startSync } = useSync();
  const [foreground, muted] = useCSSVariable(['--app-foreground', '--app-muted']) as string[];
  const insets = useSafeAreaInsets();
  const games = useGames(userId);
  const gameItems = useMemo(() => games.data?.pages.flat() ?? [], [games.data]);
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
  return (
    <FlatList
      data={gameItems}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
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
          progressViewOffset={insets.top}
        />
      }
      ListHeaderComponent={<PageHeader title="Games" onBack={() => navigation.goBack()} />}
      renderItem={({ item, index }) => (
        <View
          className={`mx-5 overflow-hidden bg-app-surface ${index === 0 ? 'rounded-t-app-card' : ''} ${index === gameItems.length - 1 ? 'rounded-b-app-card' : ''}`}
        >
          <GameRow
            game={item}
            onPress={() => navigation.navigate('GameDetail', { game: item })}
            last={index === gameItems.length - 1}
          />
        </View>
      )}
      ListEmptyComponent={
        <View className="mx-5 overflow-hidden rounded-app-card bg-app-surface">{gamesState}</View>
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
                className="min-h-11 px-4"
                onPress={() => void games.fetchNextPage()}
              >
                <Button.Label className="text-[13px] text-app-link">
                  Couldn't load more — tap to retry
                </Button.Label>
              </Button>
            ) : games.isFetchingNextPage ? (
              <ActivityIndicator color={muted} />
            ) : null}
          </View>
        ) : gameItems.length > 0 ? (
          <Typography type="body-xs" className="py-6 text-center text-app-muted">
            You're all caught up.
          </Typography>
        ) : null
      }
    />
  );
}
