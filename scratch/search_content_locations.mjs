import fs from 'fs';
import path from 'path';

function searchInDir(dir, query) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist' && entry.name !== 'scratch') {
      searchInDir(full, query);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.html') || entry.name.endsWith('.jsx'))) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(query)) {
        console.log(`Found "${query}" in: ${full}`);
      }
    }
  }
}

searchInDir('public', 'Security Overview');
searchInDir('public', 'Threats Blocked');
searchInDir('public', 'Frequently');
searchInDir('public', 'Sentinel');
