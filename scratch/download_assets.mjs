import fs from 'fs';
import path from 'path';

const baseUrl = 'https://rbp-security-template.vercel.app';

const assetsToDownload = [
  // Grid images
  '/grid/01.webp', '/grid/02.webp', '/grid/03.webp', '/grid/04.webp',
  '/grid/05.webp', '/grid/06.webp', '/grid/07.webp', '/grid/08.webp',
  '/grid/09.webp', '/grid/10.webp', '/grid/11.webp', '/grid/12.webp',
  
  // Logos
  '/logos/anthropic_black_wordmark.svg',
  '/logos/dropbox_wordmark.svg',
  '/logos/spotify_wordmark.svg',
  '/logos/stripe_wordmark.svg',
  '/logos/vercel_wordmark.svg',

  // Favicons & manifest
  '/favicon.ico',
  '/favicon-16x16.png',
  '/apple-icon.png',
  '/site.webmanifest',

  // Font files from CSS and HTML
  '/_next/static/media/68d403cf9f2c68c5-s.p.f9f15f61.woff2',
  '/_next/static/media/797e433ab948586e-s.p.29207c2f.woff2',
  '/_next/static/media/caa3a2e1cccd8315-s.p.3b6cae6d.woff2',
  '/_next/static/media/fef07dbb0973bf53-s.518e079e.woff2',
  '/_next/static/media/8a480f0b521d4e75-s.ea323500.woff2',
  '/_next/static/media/53b9e256198e5412-s.853d50a3.woff2',
  '/_next/static/media/7178b3e590c64307-s.55554cd0.woff2',
  '/_next/static/media/5ce348bf30bf5439-s.56c1f21e.woff2',
  '/_next/static/media/4fa387ec64143e14-s.3b336396.woff2',
  '/_next/static/media/6306c77e7c8268e4-s.e3369375.woff2',
  '/_next/static/media/7d817b4c03b0c5f1-s.a40b9a8b.woff2',
  '/_next/static/media/bbc41e54d2fcbd21-s.fe42ddf4.woff2',
  '/_next/static/media/20aee433927f7d4b-s.a2c089c6.woff2',
  '/_next/static/media/256e1f7f180674ba-s.afa27594.woff2',
  '/_next/static/media/be3bf58b83159894-s.7b13a9eb.woff2',
  '/_next/static/media/753b6407f468151f-s.504826d2.woff2',
  '/_next/static/media/292081311a6a8abc-s.2a17492d.woff2'
];

async function downloadAll() {
  for (const assetPath of assetsToDownload) {
    const url = baseUrl + assetPath;
    const destInPublic = path.join('public', assetPath);
    const destInLanding = path.join('landing page', assetPath);

    fs.mkdirSync(path.dirname(destInPublic), { recursive: true });
    fs.mkdirSync(path.dirname(destInLanding), { recursive: true });

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed ${url}: ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(destInPublic, buffer);
      fs.writeFileSync(destInLanding, buffer);
      console.log(`Downloaded: ${assetPath} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`Error downloading ${url}:`, err.message);
    }
  }
}

downloadAll().then(() => console.log('All asset downloads complete.'));
