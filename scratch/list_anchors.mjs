import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');
const regex = /<a[^>]+href=["']#([^"']+)["'][^>]*>(.*?)<\/a>/gi;
let match;
const anchors = [];
while ((match = regex.exec(html)) !== null) {
  anchors.push({ href: '#' + match[1], text: match[2].replace(/<[^>]+>/g, '').trim() });
}
console.log('Anchors found in landing.html:');
console.table(anchors);
