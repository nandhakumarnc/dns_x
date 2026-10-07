import fs from 'fs';

const files = fs.readdirSync('scratch').filter(f => f.endsWith('.js'));
for (const file of files) {
  const content = fs.readFileSync(`scratch/${file}`, 'utf8');
  const matches = [...content.matchAll(/85161/g)];
  if (matches.length > 1) {
    console.log(`Found multiple occurrences in ${file}: count = ${matches.length}`);
    for (const m of matches) {
      const idx = m.index;
      console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 100)));
    }
  }
}
