import fs from 'fs';

async function downloadVideo() {
  const url = 'https://rbp-security-template.vercel.app/sample-video-2.mp4';
  console.log('Downloading from', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync('public/sample-video-2.mp4', buf);
  fs.writeFileSync('landing page/sample-video-2.mp4', buf);
  console.log(`Saved sample-video-2.mp4 (${buf.length} bytes) to public/ and landing page/`);
}

downloadVideo().catch(console.error);
