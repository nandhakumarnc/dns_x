import fs from 'fs';

const js = fs.readFileSync('scratch/15ac4acf6b48e0d3.js', 'utf8');
const idx = 14979;
console.log(js.substring(idx - 2500, idx + 500));
