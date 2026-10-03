import { ActivityIndicator } from 'react-native';
import { Button as HeroButton } from 'heroui-native/button';
import type { ButtonRootProps } from 'heroui-native/button';
import { useThemeColor, type ThemeColor } from 'heroui-native/hooks';

type ButtonProps = ButtonRootProps & {
  /** Replaces the label with a spinner and disables the button. */
  isLoading?: boolean;
};

/** Spinner tint per built-in variant — matches the variant's label color. */
const VARIANT_SPINNER_TOKEN: Record<NonNullable<ButtonRootProps['variant']>, ThemeColor> = {
  primary: 'accent-foreground',
  secondary: 'accent-soft-foreground',
  tertiary: 'default-foreground',
  outline: 'default-foreground',
  ghost: 'default-foreground',
  danger: 'danger-foreground',
  'danger-soft': 'danger-soft-foreground',
};

function ButtonImpl({ variant = 'primary', isLoading, children, isDisabled, ...props }: ButtonProps) {
  const spinnerColor = useThemeColor(VARIANT_SPINNER_TOKEN[variant]);

  return (
    <HeroButton {...props} variant={variant} isDisabled={isDisabled || isLoading}>
      {isLoading ? (
        <>
          <ActivityIndicator size="small" color={spinnerColor} />
          <HeroButton.Label>
            {typeof children === 'string' ? children : 'Loading…'}
          </HeroButton.Label>
        </>
      ) : (
        children
      )}
    </HeroButton>
  );
}

/**
 * Generic button wrapper over the built-in HeroUI variants (contrast-locked
 * by the theme). Injects a spinner while `isLoading` is set; the spinner
 * color is derived from the variant's label token.
 */
export const Button = Object.assign(ButtonImpl, {
  Label: HeroButton.Label,
});
