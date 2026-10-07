import fs from 'fs';

const css = fs.readFileSync('landing page/_next/static/chunks/9a04468060cfff78.css', 'utf8');
const urls = new Set();
const regex = /url\(([^)]+)\)/g;
let match;
while ((match = regex.exec(css)) !== null) {
  urls.add(match[1].trim().replace(/^['"]|['"]$/g, ''));
}
console.log('URLs in CSS:', Array.from(urls));
