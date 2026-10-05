import '../../global.css';

import * as WebBrowser from 'expo-web-browser';
import { Typography } from 'heroui-native/text';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RedLogo from '../../assets/itch-logo-red.svg';
import WhiteLogo from '../../assets/itch-logo-white.svg';
import { AuthBackground } from '../components/auth-background.component';
import { Button } from '../components/ui/button';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../constants';
import { useAuth } from '../providers/auth.provider';

export function AuthScreen() {
  const { login, isRedirecting } = useAuth();
  const insets = useSafeAreaInsets();

  const openBrowser = (url: string) => () => void WebBrowser.openBrowserAsync(url);

  return (
    <View className="flex-1 bg-accent">
      <AuthBackground />

      <View className="flex-1 items-center justify-center px-8">
        <WhiteLogo width={72} height={65} />
      </View>

      <View className="absolute inset-x-0 px-6" style={{ bottom: insets.bottom }}>
        <Button
          variant="secondary"
          size="md"
          isLoading={isRedirecting}
          onPress={() => void login()}
        >
          <RedLogo width={18} height={16} />
          <Button.Label>Sign in with itch.io</Button.Label>
        </Button>

        <View className="mt-3 items-center">
          <Typography type="body-xs" className="text-center text-white/80">
            By continuing, you agree to our{' '}
            <Typography
              type="body-xs"
              accessibilityRole="link"
              onPress={openBrowser(TERMS_OF_SERVICE_URL)}
              className="text-white/80 underline"
            >
              Terms and Conditions
            </Typography>{' '}
            and{' '}
            <Typography
              type="body-xs"
              accessibilityRole="link"
              onPress={openBrowser(PRIVACY_POLICY_URL)}
              className="text-white/80 underline"
            >
              Privacy Policy
            </Typography>
            .
          </Typography>
        </View>
      </View>
    </View>
  );
}
