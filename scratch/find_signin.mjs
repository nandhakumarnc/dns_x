import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');

const regex = /Sign In/gi;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log('--- FOUND AT', m.index, '---');
  console.log(html.slice(Math.max(0, m.index - 200), Math.min(html.length, m.index + 200)));
}
