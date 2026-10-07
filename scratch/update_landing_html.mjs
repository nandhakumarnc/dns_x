import fs from 'fs';

function updateLandingHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Replace any href="#get-started" with href="/auth" target="_top"
  html = html.replaceAll('href="#get-started"', 'href="/auth" target="_top"');
  html = html.replaceAll('href="#sign-in"', 'href="/auth" target="_top"');

  // Also in JSON self.__next_f.push
  html = html.replaceAll('\\"href\\":\\"#get-started\\"', '\\"href\\":\\"/auth\\"');
  html = html.replaceAll('\\"href\\":\\"#sign-in\\"', '\\"href\\":\\"/auth\\"');

  // Update the bottom script for bulletproof direct auth navigation
  const newScript = `<script>
  (function() {
    function goToAuth() {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'DNS_X_AUTH_REQUEST' }, '*');
        }
      } catch (err) {}
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = '/auth';
        } else {
          window.location.href = '/auth';
        }
      } catch (err) {
        window.location.href = '/auth';
      }
    }

    // Expose globally in case any button calls it
    window.goToAuth = goToAuth;

    document.addEventListener('click', function(e) {
      var el = e.target.closest('a, button');
      if (!el) return;
      var href = (el.getAttribute('href') || '').toLowerCase();
      var text = (el.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase();

      if (
        href === '#get-started' ||
        href === '#sign-in' ||
        href.includes('/auth') ||
        href.includes('/login') ||
        text.includes('get started') ||
        text.includes('sign in') ||
        text.includes('start for free') ||
        text.includes('start free trial')
      ) {
        e.preventDefault();
        e.stopPropagation();
        goToAuth();
      }
    }, true);
  })();
</script>`;

  // Replace existing script if present
  if (html.includes('(function() {\n    function goToAuth() {')) {
    html = html.replace(/<script>\s*\(function\(\)\s*\{\s*function goToAuth\(\)[\s\S]*?<\/script>/, newScript);
  } else if (html.includes('</body>')) {
    html = html.replace('</body>', `${newScript}\n</body>`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Successfully updated ${filePath}, new size: ${fs.statSync(filePath).size}`);
}

updateLandingHtml('public/landing.html');
updateLandingHtml('landing page/index.html');
