const fs = require('fs');
const path = require('path');

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walk(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      const fileDir = path.dirname(fullPath);
      
      content = content.replace(/(import|export|from)\s+['"](\.\.?\/[^'"]+)['"]/g, (match, type, importPath) => {
        // Remove .js or /index.js if we already added it incorrectly
        let cleanPath = importPath;
        if (cleanPath.endsWith('/index.js')) cleanPath = cleanPath.slice(0, -9);
        else if (cleanPath.endsWith('.js')) cleanPath = cleanPath.slice(0, -3);
        
        // Target path on disk
        const targetTsPath = path.resolve(fileDir, cleanPath + ".ts");
        const targetTsxPath = path.resolve(fileDir, cleanPath + ".tsx");
        const targetDirPath = path.resolve(fileDir, cleanPath);
        
        if (fs.existsSync(targetTsPath) || fs.existsSync(targetTsxPath)) {
          // It's a file
          changed = true;
          return `${type} "${cleanPath}.js"`;
        } else if (fs.existsSync(targetDirPath) && fs.statSync(targetDirPath).isDirectory()) {
          // It's a directory
          changed = true;
          return `${type} "${cleanPath}/index.js"`;
        }
        
        return match;
      });
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed:', fullPath);
      }
    }
  });
}

walk('server');
walk('shared');
walk('api');
