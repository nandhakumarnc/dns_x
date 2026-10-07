import fs from 'fs';

const js = fs.readFileSync('scratch/15ac4acf6b48e0d3.js', 'utf8');

// Find module 8947 definition
const str = ',8947,';
const idx = js.indexOf(str);
if (idx !== -1) {
  console.log('Found 8947 at', idx);
  console.log(js.substring(idx - 100, idx + 2500));
} else {
  const str2 = '8947:';
  const idx2 = js.indexOf(str2);
  console.log('Found 8947: at', idx2);
  if (idx2 !== -1) console.log(js.substring(idx2 - 100, idx2 + 2500));
}
