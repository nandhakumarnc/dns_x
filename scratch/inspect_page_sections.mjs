import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');
const chunk = fs.readFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', 'utf8');
const inline = fs.readFileSync('public/js/inline_scripts.js', 'utf8');

console.log('HTML size:', html.length);
console.log('Chunk size:', chunk.length);
console.log('Inline size:', inline.length);

// Extract section tags or IDs from html
const sections = [...html.matchAll(/<(section|footer|header|nav)[^>]*>/g)].map(m => m[0]);
console.log('\nSections in landing.html:');
sections.forEach((s, i) => console.log(`${i}: ${s}`));

// Check what exports are defined in chunk
const exportMatches = [...chunk.matchAll(/e\.s\(\[([^\]]+)\]/g)].map(m => m[1]);
console.log('\ne.s exports in 15ac4acf6b48e0d3.js:');
exportMatches.forEach(m => console.log(m));
