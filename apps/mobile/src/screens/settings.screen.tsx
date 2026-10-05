import * as WebBrowser from 'expo-web-browser';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Uniwind, useUniwind } from 'uniwind';
import { Icon } from '../components/icon.component';
import { PageHeader } from '../components/page-header.component';
import { SectionHeader } from '../components/screen-ui.component';
import { Button } from '../components/ui/button';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../constants';
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
          <SectionHeader title="Appearance" />
          <View className="flex-row gap-2 rounded-app-card bg-app-surface p-3">
            {(['light', 'dark', 'system'] as const).map((option) => {
              const selected =
                option === 'system' ? hasAdaptiveThemes : !hasAdaptiveThemes && theme === option;
              return (
                <Button
                  key={option}
                  variant="ghost"
                  size="sm"
                  className={`h-11 flex-1 rounded-full ${selected ? 'bg-app-foreground' : ''}`}
                  accessibilityState={{ selected }}
                  onPress={() => Uniwind.setTheme(option)}
                >
                  <Button.Label className={selected ? 'text-app-surface' : 'text-app-muted'}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </Button.Label>
                </Button>
              );
            })}
          </View>
        </View>
        <View>
          <SectionHeader title="Legal" />
          <View className="gap-2">
            {[
              ['Terms and Conditions', TERMS_OF_SERVICE_URL],
              ['Privacy Policy', PRIVACY_POLICY_URL],
            ].map(([label, url]) => (
              <Button
                key={url}
                variant="ghost"
                className="h-[52px] rounded-full bg-app-surface"
                accessibilityRole="link"
                onPress={() => void WebBrowser.openBrowserAsync(url)}
              >
                <Button.Label className="text-app-foreground underline">{label}</Button.Label>
              </Button>
            ))}
          </View>
        </View>
        <Button variant="ghost" className="h-[52px] rounded-full bg-app-surface" onPress={logout}>
          <Icon name="logout" size={18} />
          <Button.Label className="text-app-foreground">Sign out</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}
