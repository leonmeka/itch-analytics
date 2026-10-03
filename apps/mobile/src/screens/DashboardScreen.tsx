import '../../global.css';

import { ActivityIndicator } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Typography } from 'heroui-native/text';
import { View } from 'react-native';

import { useHealth, useItchGames, useItchProfile } from '../api/queries';
import { useAuth } from '../providers/auth.provider';

function FullscreenSpinner({ heading }: { heading?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background">
      <ActivityIndicator size="large" color="#8f8f99" />
      <Typography.Paragraph type="body-sm" className="text-muted">
        {heading ?? 'Loading…'}
      </Typography.Paragraph>
    </View>
  );
}

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

export function DashboardScreen() {
  const { itchToken, isAuthenticated, isRedirecting, login, logout } = useAuth();

  const health = useHealth();
  const itchProfile = useItchProfile(itchToken);
  const games = useItchGames(itchToken);

  if (isRedirecting) {
    return <FullscreenSpinner heading="Opening itch.io…" />;
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 gap-4 bg-background px-6 pt-24">
        <Typography.Heading type="h1" className="text-foreground">
          itch
        </Typography.Heading>
        <Typography.Paragraph type="body-sm" className="text-muted">
          Sign in with itch.io to see your games.
        </Typography.Paragraph>
        <Button variant="primary" onPress={() => void login()}>
          Sign in with itch.io
        </Button>
      </View>
    );
  }

  if (health.isPending) {
    return <FullscreenSpinner heading="Loading dashboard…" />;
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

  return (
    <View className="flex-1 gap-6 bg-background px-6 pt-24">
      <Typography.Heading type="h1" className="text-foreground">
        {itchProfile.data?.display_name ?? itchProfile.data?.username ?? 'itch'}
      </Typography.Heading>

      <View className="flex-row flex-wrap gap-3">
        <StatCard label="API status" value={health.data.status} />
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
      </View>

      <View className="gap-2">
        {(games.data ?? []).map((game) => (
          <Card key={game.id}>
            <Card.Body>
              <Typography className="text-foreground">
                {game.title ?? `Game ${game.id}`}
              </Typography>
              <Typography type="body-xs" className="text-muted">
                {game.views_count ?? 0} views · {game.downloads_count ?? 0} downloads
              </Typography>
            </Card.Body>
          </Card>
        ))}
      </View>

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
