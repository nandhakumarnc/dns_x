import fs from 'fs';

const html = fs.readFileSync('scratch/live_site.html', 'utf8');

const heroStart = html.indexOf('<main id="main-content"');
const heroEnd = html.indexOf('</section>', heroStart);
console.log('=== HERO IN LIVE SITE HTML ===');
console.log(html.substring(heroStart, heroEnd + 10));
