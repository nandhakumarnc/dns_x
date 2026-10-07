import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');

const jsonHrefs = [...html.matchAll(/\\"href\\":\\"([^\\"]+)\\"/g)].map(m => m[1]);
console.log('Escaped JSON hrefs:', [...new Set(jsonHrefs)]);
