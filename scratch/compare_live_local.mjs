import fs from 'fs';

const live = fs.readFileSync('scratch/live_site.html', 'utf8');
const local = fs.readFileSync('landing page/index.html', 'utf8');

console.log('Live size:', live.length);
console.log('Local size:', local.length);

function getTags(html, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, 'gi');
  const list = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    list.push(m[1]);
  }
  return list;
}

console.log('\n--- Scripts in Live Site ---');
console.log(getTags(live, 'script', 'src'));

console.log('\n--- Scripts in Local landing page ---');
console.log(getTags(local, 'script', 'src'));

console.log('\n--- Stylesheets in Live Site ---');
console.log(getTags(live, 'link', 'href').filter(h => h.includes('.css')));

console.log('\n--- Stylesheets in Local landing page ---');
console.log(getTags(local, 'link', 'href').filter(h => h.includes('.css')));
