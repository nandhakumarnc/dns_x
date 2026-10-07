import fs from 'fs';

const html = fs.readFileSync('landing page/index.html', 'utf8');
const regex = /<img[^>]+src=["']([^"']+)["']/g;
let match;
const imgSources = [];
while ((match = regex.exec(html)) !== null) {
  imgSources.push(match[1]);
}
console.log('Image src in HTML:', imgSources);
