import fs from 'fs';

const js = fs.readFileSync('scratch/15ac4acf6b48e0d3.js', 'utf8');

const str = 'main-content';
let idx = 0;
while ((idx = js.indexOf(str, idx)) !== -1) {
  console.log('Found main-content at', idx);
  console.log(js.substring(idx - 200, idx + 1500));
  idx += str.length;
}
