import type { OauthIdentityDto } from '@itch/protocol';
import { Typography } from 'heroui-native/text';
import { Image, ScrollView, View } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';
import RedLogo from '../../assets/itch-logo-red.svg';
import { CashIcon } from '../components/cash-icon.component';
import { CashSection } from '../components/cash-ui.component';
import { PageHeader } from '../components/page-header.component';
import { Button } from '../components/ui/button';
import { useAuth } from '../providers/auth.provider';

export function AccountScreen({
  profile,
  profileFailed,
  retryProfile,
}: {
  profile: OauthIdentityDto | null | undefined;
  profileFailed: boolean;
  retryProfile: () => void;
}) {
  const { logout } = useAuth();
  const { theme, hasAdaptiveThemes } = useUniwind();
  const name = profile?.name || profile?.username || 'Your itch.io account';
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader title="Account" />
      <View className="mx-auto w-full max-w-[640px] gap-7 px-5">
        <View className="items-center rounded-[24px] bg-cash-surface px-5 py-7">
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              accessibilityLabel="Your itch.io avatar"
              className="mb-4 h-20 w-20 rounded-full bg-cash-well"
            />
          ) : (
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-cash-accent-soft">
              <RedLogo width={38} height={34} />
            </View>
          )}
          <Typography className="text-center text-[23px] font-medium tracking-[-0.5px] text-cash-foreground">
            {name}
          </Typography>
          <Typography type="body-sm" className="mt-1 text-cash-muted">
            {profile?.username ? `@${profile.username}` : 'Connected with itch.io'}
          </Typography>
          {profileFailed ? (
            <Button variant="ghost" size="sm" onPress={retryProfile}>
              <Button.Label className="text-cash-link">Reload profile</Button.Label>
            </Button>
          ) : null}
        </View>
        <View>
          <CashSection title="Appearance" />
          <View className="flex-row gap-2 rounded-[24px] bg-cash-surface p-3">
            {(['light', 'dark', 'system'] as const).map((option) => {
              const selected =
                option === 'system' ? hasAdaptiveThemes : !hasAdaptiveThemes && theme === option;
              return (
                <Button
                  key={option}
                  variant="ghost"
                  size="sm"
                  className={`h-11 flex-1 rounded-full ${selected ? 'bg-cash-foreground' : ''}`}
                  accessibilityState={{ selected }}
                  onPress={() => Uniwind.setTheme(option)}
                >
                  <Button.Label className={selected ? 'text-cash-surface' : 'text-cash-muted'}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </Button.Label>
                </Button>
              );
            })}
          </View>
        </View>
        <Button variant="ghost" className="h-[52px] rounded-full bg-cash-surface" onPress={logout}>
          <CashIcon name="logout" size={18} />
          <Button.Label className="text-cash-foreground">Sign out</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}
