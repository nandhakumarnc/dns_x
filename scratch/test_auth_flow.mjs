import fs from 'fs';
import http from 'http';

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log('--- 1. Testing Landing Page endpoint (http://localhost:5173/) ---');
  const landingRes = await checkUrl('http://localhost:5173/');
  console.log('Landing page HTTP status:', landingRes.status);
  if (landingRes.status !== 200) {
    throw new Error(`Landing page returned status ${landingRes.status}`);
  }

  console.log('--- 2. Verifying public/landing.html auth targets ---');
  const landingHtml = fs.readFileSync('public/landing.html', 'utf8');

  // Verify all 9 auth buttons/links
  const matches = [...landingHtml.matchAll(/href="\/auth"/g)];
  console.log(`Found ${matches.length} occurrences of href="/auth" in public/landing.html`);
  if (matches.length < 9) {
    throw new Error(`Expected at least 9 href="/auth" targets, found ${matches.length}`);
  }

  // Verify postMessage integration
  if (!landingHtml.includes("DNS_X_AUTH_REQUEST")) {
    throw new Error('public/landing.html missing DNS_X_AUTH_REQUEST message dispatch');
  }

  console.log('--- 3. Verifying landing page/index.html parity ---');
  const indexHtml = fs.readFileSync('landing page/index.html', 'utf8');
  const indexMatches = [...indexHtml.matchAll(/href="\/auth"/g)];
  console.log(`Found ${indexMatches.length} occurrences of href="/auth" in landing page/index.html`);
  if (indexMatches.length < 9) {
    throw new Error(`Expected at least 9 href="/auth" targets in landing page/index.html, found ${indexMatches.length}`);
  }

  console.log('--- 4. Verifying LandingPage.jsx handles direct /auth navigation ---');
  const landingJsx = fs.readFileSync('src/components/landing/LandingPage.jsx', 'utf8');
  if (!landingJsx.includes("navigate('/auth')")) {
    throw new Error('LandingPage.jsx missing direct navigate("/auth")');
  }
  if (landingJsx.includes("if (isAuthenticated) {\n      navigate('/noc')")) {
    throw new Error('LandingPage.jsx still bypassing /auth if authenticated!');
  }

  console.log('--- 5. Verifying GoogleAuthPage.jsx Glassmorphic UI & Direct NOC target ---');
  const authJsx = fs.readFileSync('src/pages/GoogleAuthPage.jsx', 'utf8');
  if (authJsx.includes("if (isAuthenticated) {\n      navigate('/noc'")) {
    throw new Error('GoogleAuthPage.jsx still auto-redirecting on mount without interaction!');
  }
  if (!authJsx.includes("NOC WORKSPACE GATED")) {
    throw new Error('GoogleAuthPage.jsx missing NOC WORKSPACE GATED target reference');
  }
  if (!authJsx.includes("navigate('/noc', { replace: true })")) {
    throw new Error('GoogleAuthPage.jsx missing direct navigate to /noc after verification');
  }

  console.log('--- 6. Verifying TargetGatedPlaceholder.jsx ---');
  const placeholderJsx = fs.readFileSync('src/components/noc/TargetGatedPlaceholder.jsx', 'utf8');
  if (!placeholderJsx.includes("NOC WORKSPACE GATED")) {
    throw new Error('TargetGatedPlaceholder.jsx missing NOC WORKSPACE GATED badge');
  }

  console.log('\n>>> ALL 6 AUTH FLOW VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<');
}

runVerification().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
