const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory() && f !== 'node_modules' && f !== '.next') {
      files = files.concat(walk(full));
    } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.css')) {
      files.push(full);
    }
  }
  return files;
}

const srcDir = path.join(__dirname, 'src');
const files = walk(srcDir);
let count = 0;

for (const file of files) {
  const orig = fs.readFileSync(file, 'utf8');
  // Remove all dark: prefixed Tailwind utility classes
  // Matches: one or more spaces + dark: + all non-whitespace chars until space/quote/backtick
  const updated = orig.replace(/\s+dark:[^\s"'`{}]+/g, '');
  if (orig !== updated) {
    fs.writeFileSync(file, updated, 'utf8');
    console.log('Stripped: ' + path.basename(file));
    count++;
  }
}

console.log('\nDone. Stripped dark: classes from ' + count + ' files.');
