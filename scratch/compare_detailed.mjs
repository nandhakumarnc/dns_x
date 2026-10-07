import fs from 'fs';

const liveHtml = fs.readFileSync('scratch/live_site.html', 'utf8');
const localHtml = fs.readFileSync('public/landing.html', 'utf8');

// Let's check what scripts or assets liveHtml has that localHtml doesn't
const liveScripts = [...liveHtml.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
const localScripts = [...localHtml.matchAll(/src="([^"]+)"/g)].map(m => m[1]);

console.log('Live scripts:', liveScripts);
console.log('Local scripts:', localScripts);

// Check links
const liveLinks = [...liveHtml.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
const localLinks = [...localHtml.matchAll(/href="([^"]+)"/g)].map(m => m[1]);

console.log('Live links count:', liveLinks.length);
console.log('Local links count:', localLinks.length);
