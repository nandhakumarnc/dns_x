import fs from 'fs';

const live = fs.readFileSync('scratch/live_site.html', 'utf8');

// Find all <script> tags without src in live
const inlineLive = [];
const regex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
let m;
while ((m = regex.exec(live)) !== null) {
  inlineLive.push(m[1].trim());
}

console.log('Number of inline scripts in live site:', inlineLive.length);
for (let i = 0; i < inlineLive.length; i++) {
  console.log(`\n--- Inline Script ${i + 1} (length: ${inlineLive[i].length}) ---`);
  console.log(inlineLive[i].slice(0, 300));
}
