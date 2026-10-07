import fs from 'fs';

const js = fs.readFileSync('scratch/15ac4acf6b48e0d3.js', 'utf8');

// Look for JSX references or export arrays
const matches = [...js.matchAll(/HeroWaves/g)];
console.log('HeroWaves matches count:', matches.length);
for (const m of matches) {
  const idx = m.index;
  console.log('Match at', idx);
  console.log(js.substring(Math.max(0, idx - 150), Math.min(js.length, idx + 200)));
}
