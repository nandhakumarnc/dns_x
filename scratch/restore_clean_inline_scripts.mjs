import fs from 'fs';

const html = fs.readFileSync('scratch/live_site.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

// Concatenate the inline scripts (theme initialization + self.__next_f pushes)
const cleanInlineJs = scripts.join('\n;\n');

fs.writeFileSync('public/js/inline_scripts.js', cleanInlineJs, 'utf8');
if (fs.existsSync('landing page/js/inline_scripts.js')) {
  fs.writeFileSync('landing page/js/inline_scripts.js', cleanInlineJs, 'utf8');
}

console.log('Restored clean original inline_scripts.js (length: ' + cleanInlineJs.length + ')');
