import fs from 'fs';

const content = fs.readFileSync('public/landing.html', 'utf8');
const anims = content.match(/animation[^;"'}]*/gi);
console.log('Animations in landing.html:', anims);
