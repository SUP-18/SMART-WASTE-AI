const fs = require('fs');
const files = ['src/lib/db.js', 'src/lib/duplicates.js', 'src/lib/priority.js'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\`/g, '`');
  fs.writeFileSync(f, content);
});
