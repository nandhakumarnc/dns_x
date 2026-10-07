import fs from 'fs';

const chunk = fs.readFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', 'utf8');

const targets = [
  'Hero',
  'Frequently asked questions',
  'One platform, priced to scale',
  'Take control of every threat',
  'One platform that sees',
  'Spotify replaced six',
  'Real reviews from real customers',
  'Real outcomes from teams'
];

for (const t of targets) {
  const pos = chunk.indexOf(t);
  console.log(`"${t}": pos=${pos}`);
}
