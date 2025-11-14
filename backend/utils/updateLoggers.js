/**
 * Script to replace all console.error/console.log with logger
 * Run this script: node utils/updateLoggers.js
 */

const fs = require('fs');
const path = require('path');

const logger = require('./logger');

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if file already uses logger
    if (content.includes('require(\'../utils/logger\')') || 
        content.includes('require(\'./utils/logger\')') ||
        content.includes('const logger')) {
      return { updated: false, reason: 'Already uses logger' };
    }

    // Add logger import
    const lines = content.split('\n');
    let importLine = -1;
    let lastRequire = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('require(')) {
        lastRequire = i;
      }
      if (lines[i].includes('const ') && lines[i].includes('require')) {
        importLine = i + 1;
      }
    }
    
    if (lastRequire >= 0) {
      // Determine relative path
      const relPath = path.relative(path.dirname(filePath), path.join(__dirname, 'logger.js'));
      const loggerPath = relPath.startsWith('.') ? relPath.replace(/\\/g, '/') : './' + relPath.replace(/\\/g, '/');
      lines.splice(lastRequire + 1, 0, `const logger = require('${loggerPath}');`);
      content = lines.join('\n');
    }

    // Replace console.error with logger.error
    content = content.replace(/console\.error\(/g, 'logger.error(');
    content = content.replace(/console\.log\(/g, 'logger.log(');
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    content = content.replace(/console\.info\(/g, 'logger.info(');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { updated: true };
    }
    
    return { updated: false, reason: 'No changes needed' };
  } catch (error) {
    return { updated: false, error: error.message };
  }
}

// Update controllers
const controllersDir = path.join(__dirname, '..', 'controllers');
const files = fs.readdirSync(controllersDir);

console.log('Updating controller files...');
files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(controllersDir, file);
    const result = updateFile(filePath);
    if (result.updated) {
      console.log(`✓ Updated ${file}`);
    } else if (result.error) {
      console.log(`✗ Error in ${file}: ${result.error}`);
    }
  }
});

console.log('Done!');

