import fs from 'fs';

const code = fs.readFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', 'utf8');

const testIdx = code.indexOf('The flexibility is really');
console.log('Testimonials idx:', testIdx);
if (testIdx !== -1) {
  console.log('Testimonials start:', code.substring(testIdx - 60, testIdx + 30));
}

const starterIdx = code.indexOf('Starter');
console.log('Starter idx:', starterIdx);
if (starterIdx !== -1) {
  console.log('Starter context:', code.substring(starterIdx - 30, starterIdx + 100));
}

const faqIdx = code.indexOf('Frequently asked questions');
console.log('FAQ idx:', faqIdx);
if (faqIdx !== -1) {
  console.log('FAQ context before title:', code.substring(faqIdx - 2000, faqIdx - 1700));
}
