import { type ScrollViewProps, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthBackground } from './auth-background.component';

export function DashboardScrollView({
  children,
  refreshControl,
}: Pick<ScrollViewProps, 'children' | 'refreshControl'>) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.max(0, scrollY.value) }],
  }));

  return (
    <View className="flex-1 overflow-hidden bg-app-background">
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 240 },
          backgroundStyle,
        ]}
      >
        <AuthBackground bandHeight={insets.top + 240} />
      </Animated.View>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 28 }}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}
