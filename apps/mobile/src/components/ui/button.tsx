import { ActivityIndicator } from 'react-native';
import { Button as HeroButton } from 'heroui-native/button';
import type { ButtonRootProps } from 'heroui-native/button';

type ButtonProps = ButtonRootProps & {
  /** Replaces the label with a spinner and disables the button. */
  isLoading?: boolean;
  /** ActivityIndicator color; defaults to the label color on filled variants. */
  spinnerColor?: string;
};

function ButtonImpl({ isLoading, spinnerColor = '#ffffff', children, isDisabled, ...props }: ButtonProps) {
  return (
    <HeroButton {...props} isDisabled={isDisabled || isLoading}>
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
 * Generic button wrapper: injects a spinner while `isLoading` is set and
 * disables press handling for that time. Compound parts (`Button.Label`)
 * pass through to the HeroUI button.
 */
export const Button = Object.assign(ButtonImpl, {
  Label: HeroButton.Label,
});
