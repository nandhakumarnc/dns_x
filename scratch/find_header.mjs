import fs from 'fs';

const html = fs.readFileSync('public/landing.html', 'utf8');

// Look for header navigation in self.__next_f.push
const headerIdx = html.indexOf('Sentinel home');
console.log('Sentinel home at:', headerIdx);
if (headerIdx !== -1) {
  console.log(html.slice(headerIdx - 100, headerIdx + 1500));
}

// Also search in self.__next_f.push
const fPushHeader = html.indexOf('\\"Sentinel home\\"');
console.log('fPushHeader at:', fPushHeader);
if (fPushHeader !== -1) {
  console.log(html.slice(fPushHeader - 100, fPushHeader + 1500));
}
