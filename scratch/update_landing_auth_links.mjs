import fs from 'fs';

const files = ['public/landing.html', 'landing page/index.html'];

const scriptTag = `
<script>
  (function() {
    function goToAuth() {
      if (window.top) {
        window.top.location.href = '/auth';
      } else {
        window.location.href = '/auth';
      }
    }

    document.addEventListener('click', function(e) {
      var target = e.target.closest('a, button');
      if (!target) return;
      var href = (target.getAttribute('href') || '').toLowerCase();
      var text = (target.textContent || '').trim().toLowerCase();

      if (
        href === '#get-started' || 
        href === '#sign-in' || 
        href === '#start-free' ||
        href.includes('/auth') ||
        href.includes('/login') ||
        text === 'get started' || 
        text === 'sign in' ||
        text === 'start for free' ||
        text === 'start free trial'
      ) {
        e.preventDefault();
        e.stopPropagation();
        goToAuth();
      }
    }, true);

    window.triggerAuth = goToAuth;
  })();
</script>
`;

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f, 'utf8');

  // Replace existing DNS_X_AUTH_REQUEST script if present
  html = html.replace(/<script>[\s\S]*?DNS_X_AUTH_REQUEST[\s\S]*?<\/script>/gi, '');

  // Point anchors directly to /auth target="_top"
  html = html.replace(/href=["']#(?:get-started|sign-in)["']/gi, 'href="/auth" target="_top"');

  // Insert updated script before </body>
  html = html.replace('</body>', `${scriptTag}\n</body>`);

  fs.writeFileSync(f, html, 'utf8');
  console.log(`Updated ${f} with direct /auth links and navigation hook.`);
}
