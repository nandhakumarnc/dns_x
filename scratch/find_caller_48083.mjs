import fs from 'fs';

const files = fs.readdirSync('scratch').filter(f => f.endsWith('.js'));
for (const file of files) {
  const content = fs.readFileSync(`scratch/${file}`, 'utf8');
  const matches = [...content.matchAll(/e\.i\(48083\)|e\.r\(48083\)/g)];
  if (matches.length > 0) {
    console.log(`Found call to 48083 in ${file}: count = ${matches.length}`);
    for (const m of matches) {
      const idx = m.index;
      console.log(content.substring(Math.max(0, idx - 150), Math.min(content.length, idx + 200)));
    }
  }
}
