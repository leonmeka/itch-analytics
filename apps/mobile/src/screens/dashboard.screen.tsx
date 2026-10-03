import '../../global.css';

import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Typography } from 'heroui-native/text';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  useHealth,
  useItchClaimedRewards,
  useItchGames,
  useItchGraphs,
  useItchKeyStatus,
  useItchProfile,
  useSaveItchKey,
} from '../api/queries';
import type { ItchGame, MetricPoint, MetricsOverview } from '../api/types';
import { Button } from '../components/ui/button';
import { useAuth } from '../providers/auth.provider';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex-1">
      <Card.Body>
        <Typography type="body-xs" className="text-muted">
          {label}
        </Typography>
        <Typography type="h6" className="text-foreground">
          {value}
        </Typography>
      </Card.Body>
    </Card>
  );
}

function StatCardLoading({ label }: { label: string }) {
  return (
    <Card className="flex-1">
      <Card.Body>
        <Typography type="body-xs" className="text-muted">
          {label}
        </Typography>
        <ActivityIndicator size="small" color="#8f8f99" />
      </Card.Body>
    </Card>
  );
}

/** One game with its analytics + claimed-rewards count (game:view:rewards). */
function GameCard({ game }: { game: ItchGame }) {
  const { itchToken } = useAuth();
  const rewards = useItchClaimedRewards(itchToken, game.id);

  const revenue =
    game.earnings.find((earning) => earning.currency === 'USD')?.amount_formatted ?? null;

  return (
    <Card>
      <Card.Body>
        <View className="flex-row items-center justify-between">
          <Typography className="text-foreground">{game.title ?? `Game ${game.id}`}</Typography>
          {game.published ? null : (
            <Typography type="body-xs" className="text-muted">
              unpublished
            </Typography>
          )}
        </View>

        <Typography type="body-xs" className="mt-1 text-muted">
          {game.views_count ?? 0} views · {game.downloads_count ?? 0} downloads ·{' '}
          {game.purchases_count ?? 0} purchases
        </Typography>

        <View className="mt-1 flex-row items-center justify-between">
          <Typography type="body-xs" className="text-foreground">
            {game.earnings[0] ? `${game.earnings[0].amount_formatted} revenue` : 'no revenue data'}
          </Typography>
          <Typography type="body-xs" className="text-muted">
            {rewards.isPending ? '…' : `${rewards.data?.total_items ?? 0} rewards claimed`}
          </Typography>
        </View>
      </Card.Body>
    </Card>
  );
}

/** Account-wide activity over the recent window, from itch's graph series. */
function ActivityCard({ graphs }: { graphs: MetricsOverview | undefined }) {
  const sumLastDays = (series: MetricPoint[] | undefined, days: number): number => {
    if (!series) return 0;

    const cutoff = Date.now() - days * 86_400_000;

    return series
      .filter((point) => new Date(point.date).getTime() >= cutoff)
      .reduce((sum, point) => sum + point.value, 0);
  };

  const window = 14;

  return (
    <Card>
      <Card.Body>
        <Typography className="text-foreground">Last {window} days</Typography>
        <Typography type="body-xs" className="mt-1 text-muted">
          {sumLastDays(graphs?.views_series, window)} views ·{' '}
          {sumLastDays(graphs?.downloads_series, window)} downloads ·{' '}
          {sumLastDays(graphs?.purchases_series, window)} purchases
        </Typography>
      </Card.Body>
    </Card>
  );
}

/** itch.io hides revenue from OAuth tokens; users add their own API key. */ function RevenueKeyCard() {
  const { itchToken } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const save = useSaveItchKey();

  return (
    <Card>
      <Card.Body className="gap-2">
        <Typography className="text-foreground">Unlock revenue</Typography>
        <Typography type="body-xs" className="text-muted">
          itch.io hides revenue from OAuth sign-ins. Paste your account API key from
          itch.io/user/settings/api-keys — stored encrypted, revocable anytime.
        </Typography>
        <Input
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="itch.io API key"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Button
          variant="secondary"
          isLoading={save.isPending}
          isDisabled={apiKey.trim().length === 0}
          onPress={() => {
            save.mutate(apiKey.trim(), {
              onSuccess: () => setApiKey(''),
            });
          }}
        >
          Save key
        </Button>
      </Card.Body>
    </Card>
  );
}

export function DashboardScreen() {
  const { itchToken, isAuthenticated, logout } = useAuth();

  const health = useHealth();
  const itchProfile = useItchProfile(itchToken);
  const games = useItchGames(itchToken);
  const graphs = useItchGraphs(itchToken);
  const keyStatus = useItchKeyStatus(itchToken);

  if (health.isPending) {
    return null;
  }

  if (health.isError) {
    return (
      <View className="flex-1 gap-4 bg-background px-6 pt-24">
        <Typography.Heading type="h1" className="text-foreground">
          itch
        </Typography.Heading>
        <Typography.Paragraph type="body-sm" className="text-danger">
          API unreachable — {String(health.error.message)}
        </Typography.Paragraph>
        <Button variant="secondary" onPress={() => void health.refetch()}>
          Retry
        </Button>
      </View>
    );
  }

  const totalViews = games.data?.reduce((sum, game) => sum + (game.views_count ?? 0), 0) ?? 0;
  const totalDownloads =
    games.data?.reduce((sum, game) => sum + (game.downloads_count ?? 0), 0) ?? 0;
  const totalPurchases =
    games.data?.reduce((sum, game) => sum + (game.purchases_count ?? 0), 0) ?? 0;

  // Revenue grouped per currency (itch pays out in the account's currency —
  // never assume USD). Amounts are in minor units (cents).
  const revenueByCurrency = new Map<string, number>();

  for (const game of games.data ?? []) {
    for (const earning of game.earnings) {
      revenueByCurrency.set(
        earning.currency,
        (revenueByCurrency.get(earning.currency) ?? 0) + earning.amount,
      );
    }
  }

  const primaryRevenue = [...revenueByCurrency.entries()][0] ?? null;

  const formatRevenue = (currency: string, amount: number): string => {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount / 100);
    } catch {
      return `${(amount / 100).toFixed(2)} ${currency}`;
    }
  };

  return (
    <View className="flex-1 gap-6 bg-background px-6 pt-24">
      <Typography.Heading type="h1" className="text-foreground">
        {itchProfile.data?.display_name ?? itchProfile.data?.username ?? 'itch'}
      </Typography.Heading>

      <View className="flex-row flex-wrap gap-3">
        {games.isPending ? (
          <StatCardLoading label="Games" />
        ) : (
          <StatCard label="Games" value={String(games.data?.length ?? 0)} />
        )}
        {games.isPending ? (
          <StatCardLoading label="Total views" />
        ) : (
          <StatCard label="Total views" value={String(totalViews)} />
        )}
        {games.isPending ? (
          <StatCardLoading label="Total downloads" />
        ) : (
          <StatCard label="Total downloads" value={String(totalDownloads)} />
        )}
        {games.isPending ? (
          <StatCardLoading label="Total purchases" />
        ) : (
          <StatCard label="Total purchases" value={String(totalPurchases)} />
        )}
        {games.isPending ? (
          <StatCardLoading label="Revenue" />
        ) : (
          <StatCard
            label="Revenue"
            value={primaryRevenue ? formatRevenue(primaryRevenue[0], primaryRevenue[1]) : '—'}
          />
        )}
      </View>

      <View className="gap-2">
        {(games.data ?? []).map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </View>

      <ActivityCard graphs={graphs.data} />

      {keyStatus.data?.configured === false ? <RevenueKeyCard /> : null}

      {games.isError ? (
        <Typography.Paragraph type="body-sm" className="text-danger">
          {String(games.error.message)}
        </Typography.Paragraph>
      ) : null}

      <Button variant="secondary" onPress={logout}>
        Sign out
      </Button>
    </View>
  );
}
