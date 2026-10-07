import fs from 'fs';

const live = fs.readFileSync('scratch/live_site.html', 'utf8');

// Find all script src
const regex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
let m;
const scripts = [];
while ((m = regex.exec(live)) !== null) {
  scripts.push(m[1]);
}
console.log('Scripts in live site:', scripts);

for (const s of scripts) {
  const cleanPath = s.split('?')[0].replace(/^\//, '');
  const existsInPublic = fs.existsSync(`public/${cleanPath}`);
  console.log(`public/${cleanPath}: ${existsInPublic ? 'EXISTS' : 'MISSING'}`);
}
