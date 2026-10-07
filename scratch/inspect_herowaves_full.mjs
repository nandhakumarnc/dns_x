import fs from 'fs';

const js = fs.readFileSync('scratch/15ac4acf6b48e0d3.js', 'utf8');
const idx = 918179;
console.log(js.substring(idx - 400, idx + 400));
