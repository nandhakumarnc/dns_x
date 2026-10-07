import fs from 'fs';
import path from 'path';

const baseUrl = 'https://rbp-security-template.vercel.app';
const live = fs.readFileSync('scratch/live_site.html', 'utf8');

// Find all src and href
const urls = new Set();
const regex = /(?:src|href)=["']([^"'#][^"']*)["']/g;
let m;
while ((m = regex.exec(live)) !== null) {
  const u = m[1];
  if (!u.startsWith('http') && !u.startsWith('//') && !u.startsWith('data:')) {
    urls.add(u);
  }
}

console.log('Downloading all live assets, total:', urls.size);

for (const u of urls) {
  const cleanPath = u.split('?')[0];
  const destPublic = path.join('public', cleanPath);
  const destLanding = path.join('landing page', cleanPath);

  fs.mkdirSync(path.dirname(destPublic), { recursive: true });
  fs.mkdirSync(path.dirname(destLanding), { recursive: true });

  const fetchUrl = baseUrl + cleanPath;
  try {
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(destPublic, buf);
      fs.writeFileSync(destLanding, buf);
      console.log(`Downloaded ${cleanPath} (${buf.length} bytes)`);
    } else {
      console.warn(`Failed ${fetchUrl}: ${res.status}`);
    }
  } catch (e) {
    console.error(`Error ${fetchUrl}:`, e.message);
  }
}
