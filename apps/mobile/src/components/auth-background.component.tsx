import Svg, { Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import ScratchWatermark from '../../assets/scratch-logo-watermark.svg';

// Full-screen accent wash with a giant logo watermark. With `bandHeight`,
// renders as a top band that fades into the page background (hero sections).
export function AuthBackground({ bandHeight }: { bandHeight?: number } = {}) {
  const [accent, heroShade] = useCSSVariable(['--color-accent', '--app-hero-shade']);

  const frame = bandHeight
    ? { top: 0, left: 0, right: 0, height: bandHeight }
    : { top: 0, left: 0, right: 0, bottom: 0 };

  return (
    <>
      <Svg
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', ...frame }}
        viewBox="0 0 1080 1920"
      >
        <Rect fill={accent as string} height="1920" width="1080" x="0" y="0" />
        <G transform="translate(0 -200) scale(8) rotate(20)">
          <ScratchWatermark width={256} height={256} />
        </G>
      </Svg>
      <Svg pointerEvents="none" style={{ position: 'absolute', ...frame }}>
        <Defs>
          <LinearGradient id="hero-depth" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0" stopColor={heroShade as string} stopOpacity={0.8} />
            <Stop offset="0.55" stopColor={heroShade as string} stopOpacity={0.45} />
            <Stop offset="0.9" stopColor={heroShade as string} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#hero-depth)" height="100%" width="100%" />
      </Svg>
    </>
  );
}
