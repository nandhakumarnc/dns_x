import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');

// Find canvas tags
const regex = /<canvas[^>]*>/gi;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log('Canvas found:', m[0]);
}

// Find chunk 15ac4acf6b48e0d3.js mentions of Three.js / shader
const chunk = fs.readFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', 'utf8');
console.log('15ac4acf6b48e0d3.js contains THREE:', chunk.includes('THREE') || chunk.includes('three'));
console.log('15ac4acf6b48e0d3.js contains ShaderMaterial:', chunk.includes('ShaderMaterial'));
console.log('15ac4acf6b48e0d3.js contains HeroWaves:', chunk.includes('HeroWaves'));
