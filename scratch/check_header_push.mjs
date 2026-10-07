import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');

// Look for header in self.__next_f.push
// In the HTML: <header class="fixed inset-x-0 top-0 ...
const headerChunk = html.slice(100000, 160000);
const m = headerChunk.match(/header/gi);
console.log('Header matches in 100k-160k:', m ? m.length : 0);

// Search for "Sign In" case-insensitive in self.__next_f.push (after index 50000)
const post50k = html.slice(50000);
console.log('Does post50k have Sign In?', /sign in/i.test(post50k));
console.log('Does post50k have Get Started?', /get started/i.test(post50k));
