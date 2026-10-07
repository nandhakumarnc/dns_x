import fs from 'fs';

const js = fs.readFileSync('scratch/15ac4acf6b48e0d3.js', 'utf8');

// Find occurrences of "hero"
let idx = 0;
while ((idx = js.toLowerCase().indexOf('hero', idx)) !== -1) {
  console.log('\n--- Match around "hero" at', idx, '---');
  console.log(js.substring(Math.max(0, idx - 100), Math.min(js.length, idx + 200)));
  idx += 4;
}
