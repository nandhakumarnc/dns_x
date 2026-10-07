import fs from 'fs';

const html = fs.readFileSync('scratch/live_site.html', 'utf8');

const regex = /<canvas[\s\S]*?<\/canvas>/gi;
let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
  count++;
  const idx = match.index;
  console.log(`\n=== Canvas #${count} ===`);
  console.log(html.substring(Math.max(0, idx - 150), Math.min(html.length, idx + match[0].length + 150)));
}
