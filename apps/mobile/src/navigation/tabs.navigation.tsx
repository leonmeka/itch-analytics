import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomNavigation, type NavigationTab } from '../components/bottom-navigation.component';
import { CreatorsScreen } from '../screens/creators.screen';
import { HomeScreen } from '../screens/home.screen';
import { SettingsScreen } from '../screens/settings.screen';
import type { TabsParamList } from './types';

const Tabs = createBottomTabNavigator<TabsParamList, 'Tabs'>();

export function TabsNavigator() {
  return (
    <Tabs.Navigator
      id="Tabs"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <BottomNavigation
          selectedTab={props.state.routeNames[props.state.index] as NavigationTab}
          onSelect={(tab) => props.navigation.navigate(tab)}
        />
      )}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Creators" component={CreatorsScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}
