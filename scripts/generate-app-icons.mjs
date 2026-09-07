import sharp from 'sharp';

const source = 'public/magical-mathventure-icon.png';
const icons = [
  ['public/favicon-32.png', 32],
  ['public/apple-touch-icon.png', 180],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
];

await Promise.all(
  icons.map(([path, size]) =>
    sharp(source).resize(size, size, { fit: 'cover' }).png().toFile(path),
  ),
);
