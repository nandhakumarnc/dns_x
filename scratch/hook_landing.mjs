import fs from 'fs';

let html = fs.readFileSync('public/landing.html', 'utf8');

const hookScript = `
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

    // Expose global trigger for parent window
    window.triggerAuth = notifyParent;
  })();
</script>
`;

if (!html.includes('DNS_X_AUTH_REQUEST')) {
  html = html.replace('</body>', `${hookScript}\n</body>`);
  fs.writeFileSync('public/landing.html', html, 'utf8');
  console.log('Appended DNS_X_AUTH_REQUEST script to public/landing.html');
} else {
  console.log('Script already present in public/landing.html');
}
