import fs from 'fs';

async function fetchCss() {
  const url = 'https://rbp-security-template.vercel.app/_next/static/chunks/9a04468060cfff78.css';
  const res = await fetch(url);
  const css = await res.text();
  fs.writeFileSync('scratch/live_css.css', css, 'utf8');
  console.log('Saved scratch/live_css.css, length:', css.length);

  // Check background definitions
  const bgRules = css.match(/[^{}]*background[^{}]*\{[^}]*\}/gi);
  console.log('Sample background rules count:', bgRules ? bgRules.length : 0);

  // Check :root variables
  const rootMatch = css.match(/:root\s*\{[^}]*\}/i);
  console.log(':root vars:', rootMatch ? rootMatch[0].slice(0, 500) : null);

  const darkMatch = css.match(/\.dark\s*\{[^}]*\}/i);
  console.log('.dark vars:', darkMatch ? darkMatch[0].slice(0, 500) : null);
}

fetchCss().catch(console.error);
