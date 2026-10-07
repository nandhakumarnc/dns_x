import fs from 'fs';

async function fetchChunks() {
  const html = fs.readFileSync('scratch/live_site.html', 'utf8');
  const scriptMatches = [...html.matchAll(/src="([^"]*\.js[^"]*)"/g)].map(m => m[1]);
  console.log('Script matches:', scriptMatches);

  for (const src of scriptMatches) {
    const fullUrl = src.startsWith('http') ? src : `https://rbp-security-template.vercel.app${src}`;
    try {
      const res = await fetch(fullUrl);
      const text = await res.text();
      const filename = src.split('/').pop().split('?')[0];
      fs.writeFileSync(`scratch/${filename}`, text, 'utf8');
      console.log(`Saved scratch/${filename}, length: ${text.length}`);

      // Check if it has any reactbits background component (like Particles, Squares, Aurora, Hyperspeed, Noise, Grid, Waves, DotPattern, LightRays, Spline, Three, WebGL, Shader, Canvas, etc.)
      const keywords = ['reactbits', 'particle', 'shader', 'webgl', 'three', 'canvas', 'grid', 'dots', 'beam', 'aurora', 'waves', 'noise', 'background', 'hero'];
      for (const kw of keywords) {
        if (text.toLowerCase().includes(kw)) {
          const count = (text.toLowerCase().match(new RegExp(kw, 'g')) || []).length;
          console.log(`  found keyword "${kw}" (${count} times) in ${filename}`);
        }
      }
    } catch (e) {
      console.error('Error fetching', fullUrl, e.message);
    }
  }
}

fetchChunks().catch(console.error);
