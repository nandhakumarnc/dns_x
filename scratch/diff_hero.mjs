import fs from 'fs';

const liveHtml = fs.readFileSync('scratch/live_site.html', 'utf8');
const localHtml = fs.readFileSync('public/landing.html', 'utf8');

// Check the hero section in live vs local
const liveHero = liveHtml.match(/<section class="relative overflow-hidden">[\s\S]*?<\/section>/)?.[0];
const localHero = localHtml.match(/<section class="relative overflow-hidden">[\s\S]*?<\/section>/)?.[0];

console.log('Live Hero:');
console.log(liveHero);
console.log('\nLocal Hero:');
console.log(localHero);
