const fs = require('fs');
const path = require('path');

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== 'scripts') walk(p);
    else if (/\.(jsx|tsx|js|ts)$/.test(e.name)) files.push(p);
  }
}
walk('.');

function alertImportPath(file) {
  let rel = path.relative(path.dirname(file), 'utils/appAlert.js').replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace(/\.js$/, '');
}

for (const file of files) {
  if (file.includes('utils/appAlert') || file.includes('AppAlertProvider')) continue;
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('Alert')) continue;
  if (!src.includes('react-native') && !src.includes('Alert.alert')) continue;

  const ap = alertImportPath(file);

  src = src.replace(
    /import\s*\{([^}]*),\s*Alert\s*,([^}]*)\}\s*from\s*['"]react-native['"]/g,
    "import {$1,$2} from 'react-native'"
  );
  src = src.replace(
    /import\s*\{([^}]*),\s*Alert\s*\}\s*from\s*['"]react-native['"]/g,
    "import {$1} from 'react-native'"
  );
  src = src.replace(
    /import\s*\{\s*Alert\s*,([^}]*)\}\s*from\s*['"]react-native['"]/g,
    "import {$1} from 'react-native'"
  );
  src = src.replace(/import\s*\{\s*Alert\s*\}\s*from\s*['"]react-native['"];?\n?/g, '');

  if (!src.includes('utils/appAlert') && (src.includes('Alert.alert') || src.match(/\bAlert\b/))) {
    const importLine = `import { Alert } from '${ap}';\n`;
    const m = src.match(/^import .+ from ['"]react-native['"];?\n/m);
    if (m) {
      src = src.slice(0, m.index + m[0].length) + importLine + src.slice(m.index + m[0].length);
    } else {
      src = importLine + src;
    }
  }

  fs.writeFileSync(file, src);
  console.log('Updated:', file);
}
