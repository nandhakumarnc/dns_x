import fs from 'fs';

let html = fs.readFileSync('scratch/live_site.html', 'utf8');

// Strip deployment query strings so local files serve directly:
// e.g. ?dpl=dpl_E2H9q4drqXDkvcVw3KqJMtmjSQVW
html = html.replace(/\?dpl=dpl_[a-zA-Z0-9_-]+/g, '');

// Append our auth trigger hook before </body>
const authHook = `
<script>
  (function() {
    function notifyParent() {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'DNS_X_AUTH_REQUEST' }, '*');
      } else {
        window.location.href = '/noc';
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
        text === 'get started' || 
        text === 'sign in' ||
        text === 'start for free' ||
        text === 'start free trial'
      ) {
        e.preventDefault();
        e.stopPropagation();
        notifyParent();
      }
    }, true);

    window.triggerAuth = notifyParent;
  })();
</script>
`;

if (!html.includes('DNS_X_AUTH_REQUEST')) {
  html = html.replace('</body>', `${authHook}\n</body>`);
}

// Write to public/landing.html and landing page/index.html
fs.writeFileSync('public/landing.html', html, 'utf8');
fs.writeFileSync('landing page/index.html', html, 'utf8');

console.log('Successfully wrote authentic landing page to public/landing.html and landing page/index.html');
console.log('File size:', html.length, 'bytes');
