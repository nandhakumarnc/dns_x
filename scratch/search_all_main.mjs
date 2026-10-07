import fs from 'fs';

const files = fs.readdirSync('scratch').filter(f => f.endsWith('.js'));
for (const file of files) {
  const content = fs.readFileSync(`scratch/${file}`, 'utf8');
  if (content.includes('main-content')) {
    console.log(`Found main-content in scratch/${file}`);
    const idx = content.indexOf('main-content');
    console.log(content.substring(idx - 200, idx + 1500));
  }
}
