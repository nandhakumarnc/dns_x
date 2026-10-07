import fs from 'fs';

async function runTests() {
  console.log('--- 1. Testing Landing Page HTML & /auth Navigation Links ---');
  const resLanding = await fetch('http://localhost:5173/landing.html');
  if (resLanding.status !== 200) {
    throw new Error(`Landing page returned status ${resLanding.status}`);
  }
  const landingHtml = await resLanding.text();
  console.log('✓ /landing.html served with HTTP 200 OK (size:', landingHtml.length, 'bytes)');

  // Verify direct /auth links exist in landing.html
  const assertions = [
    { name: 'Canvas Elements', check: landingHtml.includes('<canvas') },
    { name: 'Sentinel Brand', check: landingHtml.includes('Sentinel') },
    { name: 'Direct /auth Link', check: landingHtml.includes('href="/auth"') },
    { name: 'Direct target=_top Link', check: landingHtml.includes('target="_top"') },
    { name: 'Coverage Grid WebP', check: landingHtml.includes('/grid/01.webp') },
    { name: 'Spotify Showcase SVG', check: landingHtml.includes('/logos/spotify_wordmark.svg') },
  ];

  for (const a of assertions) {
    if (!a.check) {
      throw new Error(`Assertion failed: missing ${a.name}`);
    }
    console.log(`✓ Assertion passed: ${a.name}`);
  }

  console.log('\n--- 2. Testing Google Auth Dedicated Page & Root SPA ---');
  const resRoot = await fetch('http://localhost:5173/');
  if (resRoot.status !== 200) throw new Error('Root returned ' + resRoot.status);
  console.log('✓ / served with HTTP 200 OK');

  const resAuth = await fetch('http://localhost:5173/auth');
  if (resAuth.status !== 200) throw new Error('/auth returned ' + resAuth.status);
  console.log('✓ /auth served with HTTP 200 OK');

  console.log('\n--- 3. Testing Component Files Integrity ---');
  const filesToCheck = [
    'src/components/landing/LandingPage.jsx',
    'src/pages/GoogleAuthPage.jsx',
    'src/components/auth/ProtectedRoute.jsx',
    'src/contexts/AuthContext.jsx',
    'src/components/layout/Navbar.jsx',
    'src/components/layout/Sidebar.jsx',
    'src/components/noc/TargetBar.jsx',
    'src/components/noc/TargetGatedPlaceholder.jsx',
    'src/App.jsx',
  ];

  for (const f of filesToCheck) {
    if (!fs.existsSync(f)) {
      throw new Error(`File missing: ${f}`);
    }
    console.log(`✓ Verified component: ${f}`);
  }

  console.log('\n--- ALL AUTOMATED CHECKS PASSED SUCCESSFULLY ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
