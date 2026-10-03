import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native/provider';

import { AuthScreen } from './src/screens/auth.screen';
import { DashboardScreen } from './src/screens/dashboard.screen';
import { FullscreenSpinner } from './src/components/fullscreen-spinner.component';
import { AuthProvider, useAuth } from './src/providers/auth.provider';
import { QueryProvider } from './src/providers/query.provider';
import './global.css';

const AppRoutes = () => {
  const { isAuthenticated, isLoading, isRedirecting } = useAuth();

  if (isRedirecting) {
    return <FullscreenSpinner heading="Opening itch.io…" />;
  }

  if (isLoading) {
    return <FullscreenSpinner heading="Loading…" />;
  }

  return isAuthenticated ? <DashboardScreen /> : <AuthScreen />;
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
