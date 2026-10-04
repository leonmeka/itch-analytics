import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { CashIcon, type CashIconName } from './cash-icon.component';
import { Button } from './ui/button';

export type NavigationTab = 'Home' | 'Payments' | 'Creators' | 'Settings';

const tabs: { label: NavigationTab; icon: CashIconName }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Payments', icon: 'receipt' },
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
  const [foreground, muted] = useCSSVariable(['--cash-foreground', '--cash-muted']) as string[];

  return (
    <View
      className="border-t border-cash-border bg-cash-surface px-3 pt-1"
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
              className={`h-auto min-h-12 flex-1 flex-col gap-0.5 rounded-xl px-1.5 py-1.5 ${selected ? 'bg-cash-well' : ''}`}
            >
              <CashIcon name={tab.icon} size={20} color={selected ? foreground : muted} />
              <Button.Label
                className={`text-center text-[12px] ${selected ? 'font-semibold text-cash-foreground' : 'font-medium text-cash-muted'}`}
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
