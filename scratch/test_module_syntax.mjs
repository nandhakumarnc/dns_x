import fs from 'fs';
import vm from 'vm';

const code = fs.readFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', 'utf8');

// The file is structured as (self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([[chunkId], { moduleId: fn, ... }])
// Let's find all module IDs and test parsing each module function!
const moduleRegex = /,([0-9]+):(e=>\{[\s\S]*?\}),/g;
// Or let's test substrings
let low = 0;
let high = code.length;

// Binary search for syntax error
function checkSyntax(snippet) {
  try {
    new vm.Script('(function(){\n' + snippet + '\n})');
    return true;
  } catch (e) {
    return false;
  }
}

// Let's test the modules we modified:
const testModules = ['Testimonials', 'Pricing', 'FAQ', 'Stats', 'Hero'];
console.log('Checking where the syntax error is:');

// Test Pricing
const pStart = code.indexOf(',31008,');
const pEnd = code.indexOf(',79266,');
console.log('Pricing module 31008 valid:', checkSyntax(code.substring(pStart + 7, pEnd)));

// Test Stats
const sStart = code.indexOf(',79266,');
const sEnd = code.indexOf(',10719,');
console.log('Stats module 79266 valid:', checkSyntax(code.substring(sStart + 7, sEnd)));

// Test Testimonials
const tStart = code.indexOf(',10719,');
const tEnd = code.indexOf(',81572,'); // or next module
console.log('Testimonials module 10719 snippet valid:', checkSyntax(code.substring(tStart + 7, tStart + 5000)));

// Test FAQ
const fStart = code.indexOf(',81572,');
console.log('FAQ module 81572 snippet valid:', checkSyntax(code.substring(fStart + 7, fStart + 5000)));
