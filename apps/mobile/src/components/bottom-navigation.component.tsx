import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { Icon, type IconName } from './icon.component';
import { Button } from './ui/button';

export type NavigationTab = 'Home' | 'Creators' | 'Settings';

const tabs: { label: NavigationTab; icon: IconName }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Creators', icon: 'users' },
  { label: 'Settings', icon: 'settings' },
];

export function BottomNavigation({
  selectedTab,
  onSelect,
}: {
  selectedTab: NavigationTab;
  onSelect: (tab: NavigationTab) => void;
}) {
  const insets = useSafeAreaInsets();
  const [foreground, muted] = useCSSVariable(['--app-foreground', '--app-muted']) as string[];

  return (
    <View
      className="border-t border-app-border bg-app-surface px-3 pt-1"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="mx-auto w-full max-w-[480px] flex-row gap-1">
        {tabs.map((tab) => {
          const selected = tab.label === selectedTab;
          return (
            <Button
              key={tab.label}
              variant="ghost"
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected }}
              onPress={() => onSelect(tab.label)}
              className={`h-auto min-h-12 flex-1 flex-col gap-0.5 rounded-app-control px-1.5 py-1.5 ${selected ? 'bg-app-well' : ''}`}
            >
              <Icon name={tab.icon} size={20} color={selected ? foreground : muted} />
              <Button.Label
                className={`text-center text-[12px] ${selected ? 'font-semibold text-app-foreground' : 'font-medium text-app-muted'}`}
              >
                {tab.label}
              </Button.Label>
            </Button>
          );
        })}
      </View>
    </View>
  );
}
