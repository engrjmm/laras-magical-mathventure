import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Magical Mathventure',
    short_name: 'Mathventure',
    description:
      'A magical, child-friendly adventure for practicing addition, subtraction, multiplication, and division.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3edff',
    theme_color: '#8e68bd',
    orientation: 'any',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
