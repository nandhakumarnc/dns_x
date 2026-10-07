import fs from 'fs';

async function fetchLiveSite() {
  const url = 'https://rbp-security-template.vercel.app/';
  const res = await fetch(url);
  const html = await res.text();
  fs.writeFileSync('scratch/live_site.html', html, 'utf8');
  console.log('Saved scratch/live_site.html, length:', html.length);

  // Check background elements
  const bodyMatch = html.match(/<body[^>]*>/);
  console.log('Body tag:', bodyMatch ? bodyMatch[0] : null);

  const mainMatch = html.match(/<main[^>]*>[\s\S]*?<\/section>/);
  console.log('Hero section preview:');
  if (mainMatch) {
    console.log(mainMatch[0].slice(0, 1500));
  }

  // Look for canvas, svg, or background divs
  const canvasMatches = html.match(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi);
  console.log('Canvas tags in initial HTML:', canvasMatches);

  // Check script files
  const scriptMatches = [...html.matchAll(/src="([^"]*\.js[^"]*)"/g)].map(m => m[1]);
  console.log('Script files:', scriptMatches);
}

fetchLiveSite().catch(console.error);
