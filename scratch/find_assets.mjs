import fs from 'fs';

const files = fs.readdirSync('scratch').filter(f => f.endsWith('.js'));
const assets = new Set();
for (const file of files) {
  const content = fs.readFileSync(`scratch/${file}`, 'utf8');
  const matches = content.match(/["']\/[^"']*\.(?:mp4|webm|webp|png|jpg|jpeg|svg|woff2|woff|ico)["']/g) || [];
  for (const m of matches) {
    assets.add(m.replace(/["']/g, ''));
  }
}

console.log('Discovered assets in chunks:');
for (const a of assets) {
  const exists = fs.existsSync(`public${a}`) || fs.existsSync(`public/${a}`);
  console.log(`  ${a}: ${exists ? 'EXISTS LOCALLY' : 'MISSING'}`);
}
