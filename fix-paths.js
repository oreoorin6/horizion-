const fs = require('fs');
const path = require('path');

function fixHtmlPaths(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixHtmlPaths(filePath);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Calculate depth (number of ../ needed)
      const relativePath = path.relative(process.cwd(), filePath);
      const depth = relativePath.split(path.sep).length - 2; // -2 for 'out' and filename
      const prefix = depth > 0 ? '../'.repeat(depth) : './';
      
      // Replace absolute paths with relative
      content = content.replace(/href="\/_next\//g, `href="${prefix}_next/`);
      content = content.replace(/src="\/_next\//g, `src="${prefix}_next/`);
      
      fs.writeFileSync(filePath, content);
      console.log(`Fixed paths in: ${filePath} (depth: ${depth}, prefix: ${prefix})`);
    }
  });
}

console.log('Fixing HTML paths for Electron file:// protocol...');
fixHtmlPaths(path.join(__dirname, 'out'));
console.log('Done!');
