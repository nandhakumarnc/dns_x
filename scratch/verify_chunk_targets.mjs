import fs from 'fs';

const code = fs.readFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', 'utf8');

function check(name, target) {
  const exists = code.includes(target);
  console.log(`[${exists ? 'FOUND' : 'MISSING'}] ${name}`);
  if (!exists) {
    console.log(`Target: "${target.slice(0, 80)}..."`);
  }
}

// 1. Hero text
check('Hero title', 'children:["Secure your Enterprise Stack"," ",(0,t.jsx)("span",{className:"font-sans font-medium tracking-tight",children:"at AI Speed"})]');
check('Hero subtext', 'Sentinel gives security teams the building blocks for a unified platform that meets complex compliance needs and adapts as fast as threats evolve.');
check('Hero CTAs', '(0,t.jsx)(n.CutButton,{variant:"solid",href:"#get-started",children:"Get Started"}),(0,t.jsx)(n.CutButton,{variant:"outline",href:"#talk-to-us",children:"Talk to Us"})');

// 2. FinalCta text
check('FinalCta title', 'Take control of every threat across your org');
check('FinalCta subtext', 'Unify detection, response, and governance on one platform — and give your team a single line of sight from day one.');
check('FinalCta buttons', '(0,t.jsx)(i.CutButton,{variant:"solid",href:"#get-started",children:"Get started"}),(0,t.jsx)(i.CutButton,{variant:"outline",href:"#demo",children:"Book a demo"})');

// 3. Nav brand
check('Nav brand', 'children:"Sentinel"');

// 4. Testimonials kicker
check('Testimonials kicker', 'children:"Real reviews from real customers"');

// 5. Stats title
check('Stats title', 'children:["Real outcomes from teams running"," ",(0,t.jsx)("span",{className:"font-sans font-semibold tracking-tight",children:"Sentinel"})]');

// 6. Pricing kicker
check('Pricing cards', 'name:"Starter",blurb:"For small teams locking down the basics."');
