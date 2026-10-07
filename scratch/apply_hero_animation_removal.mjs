import fs from 'fs';

function cleanLandingHtml(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove the ferrofluid hero background container
  const containerStr = '<div id="hero-ferrofluid-container" class="pointer-events-none absolute inset-0 overflow-hidden" style="position: absolute; inset: 0; width: 100%; height: 100%; min-height: 680px; z-index: 1; pointer-events: none;"></div>';
  if (content.includes(containerStr)) {
    content = content.replace(containerStr, '');
    console.log(`Removed hero-ferrofluid-container from ${filePath}`);
  } else {
    // regex fallback if formatting differed
    const regex = /<div id="hero-ferrofluid-container"[^>]*><\/div>/gi;
    if (regex.test(content)) {
      content = content.replace(regex, '');
      console.log(`Regex removed hero-ferrofluid-container from ${filePath}`);
    }
  }

  // Also restore normal opacity to radial gradient behind hero title
  content = content.replace(/rgba\(10,10,10,0\.2\)/g, 'rgba(10,10,10,0.5)');

  // 2. Remove the ferrofluid script tag
  const scriptStr = '<script src="/js/ferrofluid-bundle.js" defer></script>';
  if (content.includes(scriptStr)) {
    content = content.replace(scriptStr, '');
    console.log(`Removed ferrofluid-bundle.js script tag from ${filePath}`);
  } else {
    const regexScript = /<script\s+src="[^"]*ferrofluid-bundle\.js"[^>]*><\/script>/gi;
    if (regexScript.test(content)) {
      content = content.replace(regexScript, '');
      console.log(`Regex removed ferrofluid-bundle.js script tag from ${filePath}`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated ${filePath}`);
}

cleanLandingHtml('public/landing.html');
cleanLandingHtml('landing page/index.html');

// Also empty public/js/ferrofluid-bundle.js to prevent any execution if cached
if (fs.existsSync('public/js/ferrofluid-bundle.js')) {
  fs.writeFileSync('public/js/ferrofluid-bundle.js', '// Hero background animation removed as requested\n', 'utf8');
  console.log('Emptied public/js/ferrofluid-bundle.js');
}
if (fs.existsSync('landing page/js/ferrofluid-bundle.js')) {
  fs.writeFileSync('landing page/js/ferrofluid-bundle.js', '// Hero background animation removed as requested\n', 'utf8');
  console.log('Emptied landing page/js/ferrofluid-bundle.js');
}
