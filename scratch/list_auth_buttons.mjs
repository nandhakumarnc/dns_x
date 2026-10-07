import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');

// Find all <a> or <button> tags with their contents and attributes
const tagRegex = /<(a|button)\b([^>]*)>(.*?)<\/\1>/gis;
let match;
let count = 0;
while ((match = tagRegex.exec(html)) !== null) {
  const [full, tag, attrs, content] = match;
  const text = content.replace(/<[^>]+>/g, '').trim();
  if (
    /sign\s*in/i.test(text) ||
    /get\s*started/i.test(text) ||
    /start/i.test(text) ||
    /auth/i.test(attrs)
  ) {
    count++;
    console.log(`[#${count}] <${tag} ${attrs}>`);
    console.log(`   Text: "${text}"`);
    console.log(`   Full snippet:`, full.slice(0, 150));
    console.log('---');
  }
}
console.log(`Total matching buttons/links: ${count}`);
