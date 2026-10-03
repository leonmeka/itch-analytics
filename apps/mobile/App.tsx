import { registerRootComponent } from 'expo';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/providers/auth.provider';
import { QueryProvider } from './src/providers/query.provider';
import { AuthScreen } from './src/screens/auth.screen';
import { DashboardScreen } from './src/screens/dashboard.screen';
import './global.css';

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
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
