import fs from 'fs';

const html = fs.readFileSync('scratch/live_site.html', 'utf8');
const mainIdx = html.indexOf('<main id="main-content"');
console.log('From <main id="main-content":');
console.log(html.substring(mainIdx, mainIdx + 2000));
