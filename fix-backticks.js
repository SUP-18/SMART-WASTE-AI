const fs = require('fs');
const path = require('path');

function fixBackticksInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
        fixBackticksInDir(fullPath);
      }
    } else if (entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('\\`')) {
        content = content.replace(/\\`/g, '`');
        fs.writeFileSync(fullPath, content);
        console.log('Fixed:', fullPath);
      }
    }
  }
}

fixBackticksInDir(path.join(__dirname, 'src'));
console.log('Done fixing backticks.');
