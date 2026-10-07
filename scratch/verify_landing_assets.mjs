import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');

// Find all href and src and url() in public/landing.html
const urls = new Set();
const regex = /(?:src|href)=["']([^"'#][^"']*)["']/g;
let match;
while ((match = regex.exec(html)) !== null) {
  const u = match[1];
  if (!u.startsWith('http') && !u.startsWith('//') && !u.startsWith('data:')) {
    urls.add(u.startsWith('/') ? u : '/' + u);
  }
}

const urlRegex = /url\(([^)]+)\)/g;
while ((match = urlRegex.exec(html)) !== null) {
  const u = match[1].trim().replace(/^['"]|['"]$/g, '');
  if (u.startsWith('/') && !u.startsWith('//')) {
    urls.add(u);
  }
}

console.log(`Checking ${urls.size} assets against http://localhost:5173...`);

let failed = 0;
for (const u of Array.from(urls).sort()) {
  try {
    const res = await fetch(`http://localhost:5173${u}`);
    if (!res.ok) {
      console.error(`FAILED (${res.status}): ${u}`);
      failed++;
    } else {
      console.log(`OK (${res.status}): ${u} (${res.headers.get('content-length') || 'chunked'} bytes)`);
    }
  } catch (err) {
    console.error(`ERROR: ${u}`, err.message);
    failed++;
  }
}

if (failed === 0) {
  console.log('ALL ASSETS LOADED WITH HTTP 200 OK! Zero missing assets.');
} else {
  console.log(`${failed} assets failed to load.`);
}
