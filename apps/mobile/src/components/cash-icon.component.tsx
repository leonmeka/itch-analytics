import Svg, { Circle, Path } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

export type CashIconName =
  | 'home'
  | 'account'
  | 'arrow'
  | 'back'
  | 'down'
  | 'upload'
  | 'download'
  | 'sync'
  | 'search'
  | 'check'
  | 'receipt'
  | 'info'
  | 'logout';
const paths: Record<CashIconName, string> = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  account: 'M4 21v-2a8 8 0 0 1 16 0v2',
  arrow: 'm9 5 7 7-7 7',
  back: 'm14 5-7 7 7 7M7 12h14',
  down: 'm6 9 6 6 6-6',
  upload: 'M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5',
  download: 'M12 3v13m-5-5 5 5 5-5M4 18v3h16v-3',
  sync: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5',
  search: 'm16 16 5 5',
  check: 'm5 12 4 4L19 6',
  receipt: 'M5 3h14v19l-3-2-4 2-4-2-3 2ZM9 8h6M9 12h6',
  info: 'M12 11v6M12 7v.1',
  logout: 'M9 3H4v18h5m-1-9h13m-4-4 4 4-4 4',
};
export function CashIcon({
  name,
  size = 22,
  color,
}: {
  name: CashIconName;
  size?: number;
  color?: string;
}) {
  const foreground = useCSSVariable('--cash-foreground') as string;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? foreground}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={paths[name]} />
      {name === 'account' ? <Circle cx={12} cy={7} r={4} /> : null}
      {name === 'search' ? <Circle cx={10.5} cy={10.5} r={6.5} /> : null}
      {name === 'info' ? <Circle cx={12} cy={12} r={9} /> : null}
    </Svg>
  );
}
