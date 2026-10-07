import fs from 'fs';

const files = fs.readdirSync('scratch').filter(f => f.endsWith('.js'));
for (const file of files) {
  const content = fs.readFileSync(`scratch/${file}`, 'utf8');
  let idx = 0;
  while ((idx = content.indexOf('48083', idx)) !== -1) {
    console.log(`Match in ${file} at ${idx}:`);
    console.log(content.substring(Math.max(0, idx - 80), Math.min(content.length, idx + 100)));
    idx += 5;
  }
}
