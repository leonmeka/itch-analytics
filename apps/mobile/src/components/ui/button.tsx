import type { ButtonRootProps } from 'heroui-native/button';
import { Button as HeroButton } from 'heroui-native/button';
import { type ThemeColor, useThemeColor } from 'heroui-native/hooks';
import { Children, isValidElement } from 'react';
import { ActivityIndicator } from 'react-native';
import { usePressFeedbackAnimation } from '../pressable-feedback.component';

type ButtonProps = Omit<ButtonRootProps, 'animation' | 'feedbackVariant'> & {
  isLoading?: boolean;
};

const VARIANT_SPINNER_TOKEN: Record<NonNullable<ButtonRootProps['variant']>, ThemeColor> = {
  primary: 'accent-foreground',
  secondary: 'accent-soft-foreground',
  tertiary: 'default-foreground',
  outline: 'default-foreground',
  ghost: 'default-foreground',
  danger: 'danger-foreground',
  'danger-soft': 'danger-soft-foreground',
};

function ButtonImpl({
  variant = 'primary',
  isLoading,
  children,
  isDisabled,
  isIconOnly,
  ...props
}: ButtonProps) {
  const feedbackAnimation = usePressFeedbackAnimation();
  const spinnerColor = useThemeColor(VARIANT_SPINNER_TOKEN[variant]);

  const labels = Children.toArray(children).filter(
    (child) => isValidElement(child) && child.type === HeroButton.Label,
  );

  return (
    <HeroButton
      feedbackVariant="scale-highlight"
      animation={feedbackAnimation}
      {...props}
      variant={variant}
      isIconOnly={isIconOnly}
      accessibilityState={{
        ...props.accessibilityState,
        busy: Boolean(isLoading),
        disabled: Boolean(isDisabled || isLoading),
      }}
      isDisabled={isDisabled || isLoading}
    >
      {isLoading ? (
        <>
          <ActivityIndicator size="small" color={spinnerColor} />
          {isIconOnly ? null : labels.length > 0 ? (
            labels
          ) : (
            <HeroButton.Label>
              {typeof children === 'string' ? children : 'Loading…'}
            </HeroButton.Label>
          )}
        </>
      ) : (
        children
      )}
    </HeroButton>
  );
}

export const Button = Object.assign(ButtonImpl, {
  Label: HeroButton.Label,
});
