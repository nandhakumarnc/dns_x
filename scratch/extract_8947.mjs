import fs from 'fs';

const js = fs.readFileSync('scratch/15ac4acf6b48e0d3.js', 'utf8');

// Find module 8947
const start = js.indexOf(',8947,e=>{');
const end = js.indexOf(',48083,e=>{');
console.log('Module 8947 length:', end - start);
fs.writeFileSync('scratch/module_8947.js', js.substring(start, end));
console.log('Saved scratch/module_8947.js');
