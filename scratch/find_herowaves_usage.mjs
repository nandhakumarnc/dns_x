import fs from 'fs';

const files = fs.readdirSync('scratch').filter(f => f.endsWith('.js'));
for (const file of files) {
  const content = fs.readFileSync(`scratch/${file}`, 'utf8');
  if (content.includes('HeroWaves')) {
    console.log(`Found HeroWaves in scratch/${file}`);
    let idx = 0;
    while ((idx = content.indexOf('HeroWaves', idx)) !== -1) {
      console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 200)));
      idx += 9;
    }
  }
}
