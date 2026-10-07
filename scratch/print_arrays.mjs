import fs from 'fs';

const code = fs.readFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', 'utf8');

const testStart = code.indexOf('let h=[{quote:"The flexibility');
console.log('Testimonials 1500 chars:');
console.log(code.substring(testStart, testStart + 1500));

const priceStart = code.indexOf('let u=[{name:"Starter"');
console.log('\nPricing 1500 chars:');
console.log(code.substring(priceStart, priceStart + 1500));
