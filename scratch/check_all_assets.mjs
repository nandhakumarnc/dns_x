import fs from 'fs';

const html = fs.readFileSync('landing page/index.html', 'utf8');
const regex = /([a-zA-Z0-9_\-\.\/]+\.(?:png|jpg|jpeg|webp|svg|woff2|ico|webmanifest))/g;
let match;
const allAssets = new Set();
while ((match = regex.exec(html)) !== null) {
  allAssets.add(match[1]);
}
console.log('All image/font assets in HTML:');
for (const a of Array.from(allAssets).sort()) {
  console.log(a);
}
