import fs from 'fs';

const js = fs.readFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', 'utf8');

const str = 'intensity:0,elementSize:10,videoUrl:"/sample-video-2.mp4"';
const idx = js.indexOf(str);
console.log('Found HeroWaves config at', idx);
if (idx !== -1) {
  console.log(js.substring(idx - 100, idx + 150));
}
