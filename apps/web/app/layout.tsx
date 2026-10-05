import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../src/landing.styles.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://getscratch.app'),
  title: 'Scratch: Your itch.io companion.',
  description:
    'Your itch.io companion for iOS and Android. Keep up with your sales and the creators around you, wherever you take your phone.',
  icons: { icon: '/itch-logo.svg' },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-itch font-sans leading-[normal] text-cream [font-synthesis:none]">
        {children}
      </body>
    </html>
  );
}
