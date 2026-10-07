import fs from 'fs';

const liveHtml = fs.readFileSync('scratch/live_site.html', 'utf8');
const localHtml = fs.readFileSync('public/landing.html', 'utf8');

console.log('Live HTML length:', liveHtml.length);
console.log('Local HTML length:', localHtml.length);

// Compare head scripts
const liveScripts = liveHtml.match(/<script[\s\S]*?<\/script>/gi) || [];
const localScripts = localHtml.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('Live scripts count:', liveScripts.length);
console.log('Local scripts count:', localScripts.length);

// Compare style tags
const liveStyles = liveHtml.match(/<style[\s\S]*?<\/style>/gi) || [];
const localStyles = localHtml.match(/<style[\s\S]*?<\/style>/gi) || [];
console.log('Live styles count:', liveStyles.length);
console.log('Local styles count:', localStyles.length);
