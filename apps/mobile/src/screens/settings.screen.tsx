import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Uniwind, useUniwind } from 'uniwind';
import { CashIcon } from '../components/cash-icon.component';
import { CashSection } from '../components/cash-ui.component';
import { PageHeader } from '../components/page-header.component';
import { Button } from '../components/ui/button';
import { useAuth } from '../providers/auth.provider';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { theme, hasAdaptiveThemes } = useUniwind();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader title="Settings" />
      <View className="mx-auto w-full max-w-[640px] gap-7 px-5">
        <View>
          <CashSection title="Appearance" />
          <View className="flex-row gap-2 rounded-cash-card bg-cash-surface p-3">
            {(['light', 'dark', 'system'] as const).map((option) => {
              const selected =
                option === 'system' ? hasAdaptiveThemes : !hasAdaptiveThemes && theme === option;
              return (
                <Button
                  key={option}
                  variant="ghost"
                  size="sm"
                  className={`h-11 flex-1 rounded-full ${selected ? 'bg-cash-foreground' : ''}`}
                  accessibilityState={{ selected }}
                  onPress={() => Uniwind.setTheme(option)}
                >
                  <Button.Label className={selected ? 'text-cash-surface' : 'text-cash-muted'}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </Button.Label>
                </Button>
              );
            })}
          </View>
        </View>
        <Button variant="ghost" className="h-[52px] rounded-full bg-cash-surface" onPress={logout}>
          <CashIcon name="logout" size={18} />
          <Button.Label className="text-cash-foreground">Sign out</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}
