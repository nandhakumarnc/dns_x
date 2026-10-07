import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');

const regex = /<a[^>]+href=["']#([^"']+)["'][^>]*>(.*?)<\/a>/gi;
let m;
while ((m = regex.exec(html)) !== null) {
  const text = m[2].replace(/<[^>]+>/g, '').trim().toLowerCase();
  const href = m[1];
  if (href.includes('get-started') || href.includes('sign-in') || text.includes('get started') || text.includes('sign in')) {
    console.log(`Found: href="#${href}" text="${text}" snippet="${m[0].slice(0, 100)}"`);
  }
}
