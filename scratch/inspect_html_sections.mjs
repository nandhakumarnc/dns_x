import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');

// Split HTML by main sections
const regex = /<(section|footer|header|nav)[^>]*>([\s\S]*?)<\/\1>/gi;
let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
  count++;
  const tag = match[1];
  const inner = match[2];
  const textSample = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  console.log(`\n--- Section ${count}: <${tag}> ---`);
  console.log('Class/Attrs:', match[0].split('>')[0] + '>');
  console.log('Text preview:', textSample);
}
