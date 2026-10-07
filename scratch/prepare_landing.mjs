import fs from 'fs';

let html = fs.readFileSync('landing page/index.html', 'utf8');

// Remove injected extension artifact
html = html.replace(/<div id="volume-booster-visusalizer">[\s\S]*?<\/div>/g, '');
html = html.replace(/<audio class="audio-output"[^>]*><\/audio>/g, '');

// Ensure absolute paths for scripts and css so it works regardless of route
html = html.replace(/href="css\/inline_styles\.css"/g, 'href="/css/inline_styles.css"');
html = html.replace(/src="js\/inline_scripts\.js"/g, 'src="/js/inline_scripts.js"');
html = html.replace(/href="_next\/static\//g, 'href="/_next/static/');
html = html.replace(/src="_next\/static\//g, 'src="/_next/static/');

// Write to public/landing.html
fs.writeFileSync('public/landing.html', html, 'utf8');
console.log('Created public/landing.html successfully.');
