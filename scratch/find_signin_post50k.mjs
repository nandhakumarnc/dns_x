import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');

const regex = /sign in/gi;
let m;
while ((m = regex.exec(html)) !== null) {
  if (m.index > 50000) {
    console.log('Match at', m.index);
    console.log(html.slice(m.index - 100, m.index + 100));
  }
}
