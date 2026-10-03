import '../../global.css';

import { Button } from 'heroui-native/button';
import { Typography } from 'heroui-native/text';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../providers/auth.provider';
import { ItchLogo } from '../components/itch-logo.component';

export function AuthScreen() {
  const { login, isRedirecting } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 overflow-hidden bg-background">
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <View style={{ backgroundColor: '#0b0b0d', height: '100%', width: '100%' }} />
      </View>

      <View className="flex-1 items-center justify-center pb-[42%]">
        <ItchLogo size={88} color="#ffffff" />
      </View>

      <View
        className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-surface px-7 pt-4 rounded-t-3xl"
        style={{ paddingBottom: insets.bottom }}
      >
        <View className="mb-5 h-1 w-10 self-center rounded-full bg-white/20" />

        <Typography.Heading type="h2" className="text-foreground">
          Itch.analytics
        </Typography.Heading>
        <Typography.Paragraph type="body" className="mt-1 text-muted">
          Track views, downloads and purchases for the games you develop.
        </Typography.Paragraph>

        <View className="mt-6">
          <Button
            variant="primary"
            size="lg"
            className="bg-[#fa5c5c]"
            isDisabled={isRedirecting}
            onPress={() => void login()}
          >
            <ItchLogo size={20} color="#ffffff" />
            <Button.Label>Sign in with itch.io</Button.Label>
          </Button>
        </View>
      </View>
    </View>
  );
}
