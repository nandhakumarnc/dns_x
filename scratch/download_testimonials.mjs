import fs from 'fs';

async function downloadMissing() {
  const images = [
    '/testimonials/person-1.jpg',
    '/testimonials/person-2.jpg',
    '/testimonials/person-3.jpg'
  ];

  fs.mkdirSync('public/testimonials', { recursive: true });
  fs.mkdirSync('landing page/testimonials', { recursive: true });

  for (const img of images) {
    const url = `https://rbp-security-template.vercel.app${img}`;
    const res = await fetch(url);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(`public${img}`, buf);
      fs.writeFileSync(`landing page${img}`, buf);
      console.log(`Saved ${img}`);
    }
  }
}

downloadMissing().catch(console.error);
