import { useThemeColor } from 'heroui-native/hooks';
import {
  PressableFeedback as HeroPressableFeedback,
  type PressableFeedbackHighlightProps,
  type PressableFeedbackProps,
} from 'heroui-native/pressable-feedback';

export function usePressFeedbackAnimation() {
  const accent = useThemeColor('accent');
  const highlight: PressableFeedbackHighlightProps['animation'] = {
    backgroundColor: { value: accent },
    opacity: { value: [0, 0.1] },
  };
  return { highlight };
}

export function PressableFeedback({ children, ...props }: PressableFeedbackProps) {
  const animation = usePressFeedbackAnimation();
  return (
    <HeroPressableFeedback accessibilityRole="button" {...props}>
      <HeroPressableFeedback.Highlight animation={animation.highlight} />
      {children}
    </HeroPressableFeedback>
  );
}
