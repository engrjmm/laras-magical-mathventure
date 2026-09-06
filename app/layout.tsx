import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://laras-magical-mathventure.joycemalasa062897.chatgpt.site'),
  title: 'Lara’s Magical Mathventure',
  description: 'Add, subtract, multiply, divide, explore magical worlds, and collect delightful treasures with Lara.',
  openGraph: {
    title: 'Lara’s Magical Mathventure',
    description: 'Multiply • Explore • Collect',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lara’s Magical Mathventure',
    description: 'Multiply • Explore • Collect',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f3edff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
