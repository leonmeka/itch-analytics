import { registerRootComponent } from 'expo';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/providers/auth.provider';
import { QueryProvider } from './src/providers/query.provider';
import { DashboardScreen } from './src/screens/DashboardScreen';

import './global.css';

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <QueryProvider>
          <AuthProvider>
            <DashboardScreen />
          </AuthProvider>
        </QueryProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
};

registerRootComponent(App);
