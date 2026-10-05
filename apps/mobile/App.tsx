import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { registerRootComponent } from 'expo';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCSSVariable, useUniwind } from 'uniwind';
import { RootNavigator } from './src/navigation/root.navigation';
import { AuthProvider, useAuth } from './src/providers/auth.provider';
import { QueryProvider } from './src/providers/query.provider';
import { SyncProvider } from './src/providers/sync.provider';
import './global.css';

const AppRoutes = () => {
  const { user } = useAuth();
  const { theme } = useUniwind();
  const [background, surface, foreground, border, accent] = useCSSVariable([
    '--cash-background',
    '--cash-surface',
    '--cash-foreground',
    '--cash-border',
    '--cash-accent',
  ]) as string[];
  const baseTheme = theme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background,
      card: surface,
      text: foreground,
      border,
      primary: accent,
      notification: accent,
    },
  };
  const userId = user?.id ?? null;

  return (
    <NavigationContainer theme={navigationTheme}>
      <SyncProvider userId={userId}>
        <RootNavigator />
      </SyncProvider>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HeroUINativeProvider>
          <QueryProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </QueryProvider>
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

registerRootComponent(App);
