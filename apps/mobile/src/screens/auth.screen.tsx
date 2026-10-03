import '../../global.css';

import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/ui/button';
import { useAuth } from '../providers/auth.provider';

const PLACEHOLDER_BACKGROUND = {
  uri: 'https://picsum.photos/seed/itch-dashboard/1080/1920',
};

export function AuthScreen() {
  const { login, isRedirecting } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <Image source={PLACEHOLDER_BACKGROUND} style={StyleSheet.absoluteFill} resizeMode="cover" />

      <View className="absolute inset-x-0 px-6" style={{ bottom: insets.bottom }}>
        <Button
          variant="primary"
          size="md"
          isLoading={isRedirecting}
          onPress={() => void login()}
        >
          Sign in with itch.io
        </Button>
      </View>
    </View>
  );
}
