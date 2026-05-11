const fs = require('fs');
const path = require('path');

const distRoot = path.join(__dirname, '..', 'dist', 'fantasy-contest-tracker');
const browserDir = path.join(distRoot, 'browser');
const distDir = fs.existsSync(browserDir) ? browserDir : distRoot;
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found in dist output:', indexPath);
  process.exit(1);
}

fs.copyFileSync(indexPath, notFoundPath);
console.log('Created 404.html for GitHub Pages SPA fallback.');
