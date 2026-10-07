import fs from 'fs';

const files = fs.readdirSync('scratch').filter(f => f.endsWith('.js'));
for (const file of files) {
  const content = fs.readFileSync(`scratch/${file}`, 'utf8');
  if (content.includes('48083')) {
    console.log(`Found 48083 in scratch/${file}`);
    let idx = 0;
    while ((idx = content.indexOf('48083', idx)) !== -1) {
      console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 150)));
      idx += 5;
    }
  }
}
