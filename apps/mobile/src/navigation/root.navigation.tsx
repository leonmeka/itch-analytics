import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../providers/auth.provider';
import { AuthScreen } from '../screens/auth.screen';
import { CreatorScreen } from '../screens/creator.screen';
import { GameDetailScreen } from '../screens/game-detail.screen';
import { GamesScreen } from '../screens/games.screen';
import { PaymentDetailScreen } from '../screens/payment-detail.screen';
import { PaymentsScreen } from '../screens/payments.screen';
import { TabsNavigator } from './tabs.navigation';
import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList, 'Root'>();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <RootStack.Navigator id="Root" screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <RootStack.Screen name="Tabs" component={TabsNavigator} />
          <RootStack.Screen name="Payments" component={PaymentsScreen} />
          <RootStack.Screen name="Games" component={GamesScreen} />
          <RootStack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
          <RootStack.Screen name="GameDetail" component={GameDetailScreen} />
          <RootStack.Screen name="Creator" component={CreatorScreen} />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthScreen} />
      )}
    </RootStack.Navigator>
  );
}
