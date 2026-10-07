import fs from 'fs';

const content = fs.readFileSync('public/landing.html', 'utf8');
const start = content.indexOf('<section class="relative overflow-hidden">');
const end = content.indexOf('</section>', start);
console.log('Hero section content:');
console.log(content.substring(start, end + 10));
