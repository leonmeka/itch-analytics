import type { UserProfileDto } from '@itch/protocol';
import { Skeleton } from 'heroui-native/skeleton';
import { Typography } from 'heroui-native/text';
import type { ReactNode } from 'react';
import { Image, ScrollView, View } from 'react-native';
import RedLogo from '../../assets/itch-logo-red.svg';
import { useCreatorProfile } from '../api/queries';
import { CashIconButton, CashState } from '../components/cash-ui.component';
import { formatMoney } from '../utils/payments.format';

export function CreatorScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const profile = useCreatorProfile(userId);

  let content: ReactNode;
  if (profile.isPending) {
    content = (
      <View className="items-center pb-8 pt-4">
        <Skeleton className="mb-4 h-20 w-20 rounded-full" />
        <Skeleton className="h-7 w-44 rounded-lg" />
        <Skeleton className="mt-1 h-5 w-28 rounded-md" />
        <Skeleton className="mt-5 h-16 w-36 rounded-xl" />
        <Skeleton className="mt-1 h-5 w-24 rounded-md" />
      </View>
    );
  } else if (profile.isError) {
    content = (
      <CashState
        title="Couldn't load creator"
        description="Try loading the profile again."
        icon="info"
        action="Retry"
        onPress={() => void profile.refetch()}
      />
    );
  } else if (!profile.data) {
    content = (
      <CashState
        title="Creator unavailable"
        description="This creator's profile is no longer available."
        icon="account"
      />
    );
  } else {
    content = <ProfileHero profile={profile.data} />;
  }

  return (
    <View className="flex-1">
      <View className="mx-auto w-full max-w-[640px] px-5">
        <View className="flex-row items-center gap-3 py-3">
          <CashIconButton name="back" label="Back to creators" onPress={onBack} />
          <Typography className="text-[20px] font-medium text-cash-foreground">Creator</Typography>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mx-auto w-full max-w-[640px] px-5">{content}</View>
      </ScrollView>
    </View>
  );
}

function ProfileHero({ profile }: { profile: UserProfileDto }) {
  return (
    <View className="items-center pb-8 pt-4">
      {profile.avatar_url ? (
        <Image
          source={{ uri: profile.avatar_url }}
          accessibilityLabel={`@${profile.username}'s itch.io avatar`}
          className="mb-4 h-20 w-20 rounded-full bg-cash-well"
        />
      ) : (
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-cash-accent-soft">
          <RedLogo width={38} height={34} />
        </View>
      )}
      <Typography className="text-center text-[23px] font-medium tracking-[-0.5px] text-cash-foreground">
        {profile.username ? `@${profile.username}` : (profile.name ?? 'Creator')}
      </Typography>
      {profile.name && profile.username ? (
        <Typography type="body-sm" className="mt-1 text-cash-muted">
          {profile.name}
        </Typography>
      ) : null}
      <Typography
        adjustsFontSizeToFit
        numberOfLines={1}
        className="mt-5 text-[52px] font-medium leading-[64px] tracking-[-2px] text-cash-foreground"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatMoney(profile.revenue_cents)}
      </Typography>
      <Typography type="body-sm" className="mt-1 text-cash-muted">
        Gross revenue
      </Typography>
    </View>
  );
}
