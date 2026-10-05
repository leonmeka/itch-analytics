import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from 'heroui-native/card';
import { Typography } from 'heroui-native/text';
import { Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CashIcon } from '../components/cash-icon.component';
import { DetailRow } from '../components/cash-ui.component';
import { PageHeader } from '../components/page-header.component';
import type { RootStackParamList } from '../navigation/types';
import { formatDate, formatMoney } from '../utils/payments.format';

export function GameDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'GameDetail'>) {
  const insets = useSafeAreaInsets();
  const { game } = route.params;
  const platforms = (game.traits ?? [])
    .filter((trait) => trait.startsWith('p_'))
    .map((trait) => trait[2].toUpperCase() + trait.slice(3));
  const otherTraits = (game.traits ?? []).filter((trait) => !trait.startsWith('p_'));

  return (
    <View className="flex-1 bg-cash-background" style={{ paddingTop: insets.top }}>
      <PageHeader title="Game" backLabel="Back" onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View className="mx-auto w-full max-w-[640px] px-5">
          <View className="items-center pb-8 pt-7">
            {game.cover_url ? (
              <Image
                source={{ uri: game.cover_url }}
                accessibilityLabel={`${game.title} cover`}
                className="mb-5 h-[72px] w-[72px] rounded-2xl bg-cash-well"
              />
            ) : (
              <View className="mb-5 h-[72px] w-[72px] items-center justify-center rounded-2xl bg-cash-accent-soft">
                <CashIcon name="game" size={30} />
              </View>
            )}
            <Typography className="text-center text-[18px] font-medium text-cash-foreground">
              {game.title}
            </Typography>
          </View>
          {game.short_text ? (
            <Card className="rounded-[24px] bg-cash-surface p-5 shadow-none">
              <Typography type="body-sm" className="text-cash-foreground">
                {game.short_text}
              </Typography>
            </Card>
          ) : null}
          <Card className="mt-3 rounded-[24px] bg-cash-surface px-5 py-1 shadow-none">
            <DetailRow label="Status">
              {game.published ? `Published ${formatDate(game.published_at)}` : 'Unpublished draft'}
            </DetailRow>
            <DetailRow label="Type">
              {[game.classification, game.type].filter(Boolean).join(' · ') || '—'}
            </DetailRow>
            {platforms.length ? (
              <DetailRow label="Platforms">{platforms.join(', ')}</DetailRow>
            ) : null}
            {otherTraits.length ? (
              <DetailRow label="Traits">{otherTraits.join(', ')}</DetailRow>
            ) : null}
            <DetailRow label="Created">{formatDate(game.external_created_at)}</DetailRow>
            <DetailRow label="Game ID">{game.external_id}</DetailRow>
            <DetailRow label="Views">{game.views_count ?? '—'}</DetailRow>
            <DetailRow label="Downloads">{game.downloads_count ?? '—'}</DetailRow>
            <DetailRow label="Purchases">{game.purchases_count ?? '—'}</DetailRow>
            <DetailRow label="Minimum price">
              {game.min_price != null ? formatMoney(game.min_price) : '—'}
            </DetailRow>
            <DetailRow label="URL" last>
              {game.url}
            </DetailRow>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
