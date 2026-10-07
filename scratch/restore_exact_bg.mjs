import fs from 'fs';

function restoreExactLiveBackground(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Ensure html tag has class="dark" and style="color-scheme: dark"
  html = html.replace(/<html[^>]*>/, '<html lang="en" class="dark" style="color-scheme: dark;">');

  // 2. Ensure theme script defaults to dark unconditionally
  html = html.replace(
    /["']theme["'],["']system["']/g,
    `"theme","dark"`
  );

  // 3. Restore exact hero ellipse background matching https://rbp-security-template.vercel.app/
  html = html.replace(
    /style="background:radial-gradient\(ellipse at center, rgba\(10,10,10,0\.5\) 0%, transparent 70%\); pointer-events: none;"/,
    'style="background:radial-gradient(ellipse at center, var(--background) 0%, color-mix(in srgb, var(--background) 78%, transparent) 45%, transparent 72%)"'
  );

  // Also handle any other variation
  html = html.replace(
    /style="background:radial-gradient\(ellipse at center[^"]*"/g,
    'style="background:radial-gradient(ellipse at center, var(--background) 0%, color-mix(in srgb, var(--background) 78%, transparent) 45%, transparent 72%)"'
  );

  // 4. Ensure the hero container classes match live site exactly
  html = html.replace(
    '<div class="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10 relative z-10" style="position: relative; z-index: 10;">',
    '<div class="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">'
  );

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Updated ${filePath} to match live site exactly.`);
}

restoreExactLiveBackground('public/landing.html');
restoreExactLiveBackground('landing page/index.html');
