import fs from 'fs';

const files = fs.readdirSync('scratch').filter(f => f.endsWith('.js'));
for (const file of files) {
  const content = fs.readFileSync(`scratch/${file}`, 'utf8');
  if (content.includes('85161')) {
    console.log(`Found 85161 in scratch/${file}`);
    let idx = 0;
    while ((idx = content.indexOf('85161', idx)) !== -1) {
      console.log(content.substring(Math.max(0, idx - 150), Math.min(content.length, idx + 250)));
      idx += 5;
    }
  }
}
