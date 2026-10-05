import type { UserProfileDto } from '@itch/protocol';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Skeleton } from 'heroui-native/skeleton';
import { Typography } from 'heroui-native/text';
import type { ReactNode } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RedLogo from '../../assets/itch-logo-red.svg';
import { useCreatorProfile } from '../api/queries';
import { PageHeader } from '../components/page-header.component';
import { ContentState } from '../components/screen-ui.component';
import type { RootStackParamList } from '../navigation/types';
import { formatMoney } from '../utils/payments.format';

export function CreatorScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Creator'>) {
  const insets = useSafeAreaInsets();
  const { userId } = route.params;
  const profile = useCreatorProfile(userId);

  let content: ReactNode;
  if (profile.isPending) {
    content = (
      <View className="items-center pb-8">
        <Skeleton className="mb-4 h-20 w-20 overflow-hidden rounded-full" />
        <Skeleton className="h-7 w-44 rounded-app-placeholder" />
        <Skeleton className="mt-1 h-5 w-28 rounded-app-placeholder" />
        <Skeleton className="mt-5 h-16 w-36 rounded-app-placeholder" />
        <Skeleton className="mt-1 h-5 w-24 rounded-app-placeholder" />
      </View>
    );
  } else if (profile.isError) {
    content = (
      <ContentState
        title="Couldn't load creator"
        description="Try loading the profile again."
        icon="info"
        action="Retry"
        onPress={() => void profile.refetch()}
      />
    );
  } else if (!profile.data) {
    content = (
      <ContentState
        title="Creator unavailable"
        description="This creator's profile is no longer available."
        icon="account"
      />
    );
  } else {
    content = <ProfileHero profile={profile.data} />;
  }

  return (
    <View className="flex-1 bg-app-background" style={{ paddingTop: insets.top }}>
      <PageHeader title="Creator" backLabel="Back to creators" onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View className="mx-auto w-full max-w-[640px] px-5">{content}</View>
      </ScrollView>
    </View>
  );
}

function ProfileHero({ profile }: { profile: UserProfileDto }) {
  return (
    <View className="items-center pb-8">
      {profile.avatar_url ? (
        <Image
          source={{ uri: profile.avatar_url }}
          accessibilityLabel={`@${profile.username}'s itch.io avatar`}
          className="mb-4 h-20 w-20 overflow-hidden rounded-full bg-app-well"
        />
      ) : (
        <View className="mb-4 h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-app-accent-soft">
          <RedLogo width={38} height={34} />
        </View>
      )}
      <Typography className="text-center text-[23px] font-medium tracking-[-0.5px] text-app-foreground">
        {profile.username ? `@${profile.username}` : (profile.name ?? 'Creator')}
      </Typography>
      {profile.name && profile.username ? (
        <Typography type="body-sm" className="mt-1 text-app-muted">
          {profile.name}
        </Typography>
      ) : null}
      <Typography
        adjustsFontSizeToFit
        numberOfLines={1}
        className="mt-5 text-[52px] font-medium leading-[64px] tracking-[-2px] text-app-foreground"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatMoney(profile.revenue_cents)}
      </Typography>
      <Typography type="body-sm" className="mt-1 text-app-muted">
        Gross revenue
      </Typography>
    </View>
  );
}
