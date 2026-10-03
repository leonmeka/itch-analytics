import '../../global.css';

import { Typography } from 'heroui-native/text';
import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/ui/button';
import { AuthBackground } from '../components/auth-background.component';
import { useAuth } from '../providers/auth.provider';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../constants';
import WhiteLogo from '../../assets/itch-logo-white.svg';
import RedLogo from '../../assets/itch-logo-red.svg';

export function AuthScreen() {
  const { login, isRedirecting } = useAuth();
  const insets = useSafeAreaInsets();

  const openBrowser = (url: string) => () => void WebBrowser.openBrowserAsync(url);

  return (
    <View className="flex-1 bg-accent">
      <AuthBackground />

      <View className="flex-1 items-center justify-center px-8">
        <WhiteLogo width={72} height={65} />

        <Typography.Paragraph className="mt-8 text-center text-2xl font-semibold text-white">
          itch.io analytics
        </Typography.Paragraph>
      </View>

      <View className="absolute inset-x-0 px-6" style={{ bottom: insets.bottom }}>
        <Button variant="secondary" size="md" isLoading={isRedirecting} onPress={() => void login()}>
          <RedLogo width={18} height={16} />
          <Button.Label>Sign in with itch.io</Button.Label>
        </Button>

        <Typography type="body-xs" className="mt-3 text-center text-white/80">
          By clicking continue, you agree to our{' '}
          <Typography
            type="body-xs"
            className="text-white underline"
            onPress={openBrowser(TERMS_OF_SERVICE_URL)}
          >
            Terms of Service
          </Typography>{' '}
          and{' '}
          <Typography
            type="body-xs"
            className="text-white underline"
            onPress={openBrowser(PRIVACY_POLICY_URL)}
          >
            Privacy Policy
          </Typography>
          .
        </Typography>
      </View>
    </View>
  );
}
