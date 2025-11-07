// app/layout.tsx
import { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Based Vice Toads',
  description: 'Mint the coolest Based Vice Toads NFT collection on Base.',
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://your‑domain.com/images/based‑vice‑toads‑embed.png',
      button: {
        title: 'Launch Based Vice Toads',
        action: {
          type: 'launch_miniapp',
          name: 'Based Vice Toads',
          url: 'https://your‑domain.com',
          splashImageUrl: 'https://your‑domain.com/images/splash‑image.png',
          splashBackgroundColor: '#000000'
        }
      }
    })
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
