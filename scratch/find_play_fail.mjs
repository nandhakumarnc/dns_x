import fs from 'fs';

const js = fs.readFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', 'utf8');

// Find "Video play failed"
const str = 'Video play failed';
const idx = js.indexOf(str);
console.log('Found Video play failed at', idx);
console.log(js.substring(idx - 200, idx + 400));
