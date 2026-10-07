import fs from 'fs';

const code = fs.readFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', 'utf8');

// 1. Testimonials quotes array h
const testStart = code.indexOf('let h=[{quote:"The flexibility');
const testEnd = code.indexOf('}],u=', testStart);
console.log('Testimonials quotes:', testStart, 'to', testEnd);
console.log('Testimonials snippet:', code.substring(testStart, testStart + 80), '...', code.substring(testEnd - 40, testEnd + 10));

// 2. Pricing array u
const priceStart = code.indexOf('let u=[{name:"Starter"');
const priceEnd = code.indexOf('}],p=', priceStart);
console.log('Pricing array:', priceStart, 'to', priceEnd);
console.log('Pricing snippet:', code.substring(priceStart, priceStart + 80), '...', code.substring(priceEnd - 40, priceEnd + 10));

// 3. FAQ array
const faqSub = 'question:"Is our data secure and compliant?"';
const faqSubIdx = code.indexOf(faqSub);
console.log('FAQ sub idx:', faqSubIdx);
if (faqSubIdx !== -1) {
  const faqArrayStart = code.lastIndexOf('let l=[{question:', faqSubIdx);
  const faqArrayEnd = code.indexOf('}],u=', faqSubIdx);
  console.log('FAQ array:', faqArrayStart, 'to', faqArrayEnd);
  console.log('FAQ snippet:', code.substring(faqArrayStart, faqArrayStart + 80), '...', code.substring(faqArrayEnd - 40, faqArrayEnd + 10));
}
