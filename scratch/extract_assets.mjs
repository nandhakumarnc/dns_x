import fs from 'fs';

const content = fs.readFileSync('landing page/index.html', 'utf8');
const urls = new Set();
const regex = /url\(([^)]+)\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  urls.add(match[1].trim().replace(/^['"]|['"]$/g, ''));
}
console.log('URLs inside url():');
for (const u of Array.from(urls).sort()) {
  console.log(u);
}
