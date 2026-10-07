import fs from 'fs';

const content = fs.readFileSync('landing page/js/inline_scripts.js', 'utf8');
const regex = /([a-zA-Z0-9_\-\.\/]+\.(?:png|jpg|jpeg|webp|svg|woff2|ico))/g;
let match;
const found = new Set();
while ((match = regex.exec(content)) !== null) {
  found.add(match[1]);
}
console.log('Found in inline_scripts.js:', Array.from(found));
