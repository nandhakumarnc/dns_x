import fs from 'fs';

const html = fs.readFileSync('scratch/live_site.html', 'utf8');

const themeMatches = [...html.matchAll(/theme/gi)];
console.log('theme matches count:', themeMatches.length);
for (const m of themeMatches) {
  const idx = m.index;
  console.log(html.substring(Math.max(0, idx - 50), Math.min(html.length, idx + 100)));
}
