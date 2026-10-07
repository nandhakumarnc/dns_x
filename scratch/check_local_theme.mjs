import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');
console.log('html tag:', html.substring(0, 100));
console.log('has class="dark" on html:', html.includes('class="dark"'));
console.log('has dark in html tag:', html.match(/<html[^>]*class="[^"]*dark[^"]*"[^>]*>/) !== null);
