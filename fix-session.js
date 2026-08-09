const fs = require('fs');
const path = require('path');

// Fix auth.js
const authPath = path.join(__dirname, 'src', 'lib', 'auth.js');
let authContent = fs.readFileSync(authPath, 'utf8');
authContent = authContent.replace('export function getSession()', 'export async function getSession()');
authContent = authContent.replace('const cookieStore = cookies();', 'const cookieStore = await cookies();');
fs.writeFileSync(authPath, authContent);
console.log('Fixed auth.js');

// Fix API routes
function fixGetSessionCalls(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixGetSessionCalls(fullPath);
    } else if (entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('getSession()')) {
        content = content.replace(/getSession\(\)/g, 'await getSession()');
        fs.writeFileSync(fullPath, content);
        console.log('Fixed getSession in:', fullPath);
      }
    }
  }
}

fixGetSessionCalls(path.join(__dirname, 'src', 'app', 'api'));
console.log('Done fixing getSession calls.');
