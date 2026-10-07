import fs from 'fs';

const js = fs.readFileSync('scratch/15ac4acf6b48e0d3.js', 'utf8');

// Find all occurrences of "videoUrl" or "sample-video-2.mp4"
const str = 'sample-video-2.mp4';
let idx = 0;
while ((idx = js.indexOf(str, idx)) !== -1) {
  console.log('Found video url at', idx);
  console.log(js.substring(idx - 400, idx + 400));
  idx += str.length;
}
