import fs from 'fs';

let html = fs.readFileSync('scratch/live_site.html', 'utf8');

// Strip deployment hashes so local files resolve directly
html = html.replace(/\?dpl=dpl_[a-zA-Z0-9_-]+/g, '');

// Point get-started and sign-in anchors directly to /auth target="_top"
html = html.replace(/href=["']#get-started["']/g, 'href="/auth" target="_top"');
html = html.replace(/href=["']#sign-in["']/g, 'href="/auth" target="_top"');

// Navigation hook script to ensure clicks directly navigate top window to /auth
const navScript = `
<script>
  (function() {
    function goToAuth() {
      if (window.top && window.top !== window) {
        window.top.location.href = '/auth';
      } else {
        window.location.href = '/auth';
      }
    }

    document.addEventListener('click', function(e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = (a.getAttribute('href') || '').toLowerCase();
      var text = (a.textContent || '').trim().toLowerCase();

      if (
        href === '#get-started' ||
        href === '#sign-in' ||
        href.includes('/auth') ||
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
  })();
</script>
`;

html = html.replace('</body>', `${navScript}\n</body>`);

fs.writeFileSync('public/landing.html', html, 'utf8');
fs.writeFileSync('landing page/index.html', html, 'utf8');

console.log('Restored authentic landing page with direct /auth routing.');
console.log('Final size in public/landing.html:', html.length, 'bytes');
