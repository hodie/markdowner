/**
 * Icon Verification Tool
 * Checks if icons exist and have the correct format
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Root directory
const rootDir = path.join(__dirname, '..');
const resourcesDir = path.join(rootDir, 'resources');

/**
 * Check if a file exists and log details
 * @param {string} filePath - Path to check
 * @returns {boolean} - Whether the file exists
 */
function checkFile(filePath) {
  try {
    const exists = fs.existsSync(filePath);
    if (exists) {
      const stats = fs.statSync(filePath);
      const sizeKb = (stats.size / 1024).toFixed(2);
      console.log(`✅ Found: ${filePath} (${sizeKb} KB)`);
    } else {
      console.log(`❌ Missing: ${filePath}`);
    }
    return exists;
  } catch (error) {
    console.error(`Error checking ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Check if an image file is valid by getting its dimensions
 * @param {string} filePath - Path to image file
 */
function checkImageFormat(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  try {
    // Try to use file command to determine image type and dimensions
    try {
      const result = execSync(`file "${filePath}"`).toString();
      console.log(`  Format: ${result.trim()}`);
    } catch (err) {
      console.log(`  Unable to determine format using 'file' command`);
    }
    
    // Additional logging of file details
    const stats = fs.statSync(filePath);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`  Created: ${stats.birthtime}`);
    console.log(`  Modified: ${stats.mtime}`);
    
    // Read first few bytes to check format
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);
    
    // Log hex values for manual inspection
    console.log(`  Header: ${buffer.toString('hex')}`);
    
  } catch (error) {
    console.error(`  Error analyzing ${filePath}:`, error.message);
  }
}

/**
 * Main verification function
 */
function verifyIcons() {
  console.log('Verifying application icons...');
  console.log('Resources directory:', resourcesDir);
  
  if (!fs.existsSync(resourcesDir)) {
    console.error('❌ Resources directory does not exist!');
    return;
  }
  
  // Check directory structure
  const iconsDir = path.join(resourcesDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    console.error('❌ Icons directory does not exist!');
    return;
  }
  
  console.log('\nDirectory structure:');
  listDirectoryContents(resourcesDir, 2);
  
  console.log('\nChecking icon files:');
  
  // Check macOS icon
  const macIconPath = path.join(iconsDir, 'mac', 'icon.icns');
  if (checkFile(macIconPath)) {
    checkImageFormat(macIconPath);
  }
  
  // Check Windows icon
  const winIconPath = path.join(iconsDir, 'win', 'icon.ico');
  if (checkFile(winIconPath)) {
    checkImageFormat(winIconPath);
  }
  
  // Check PNG icons
  const pngDir = path.join(iconsDir, 'png');
  if (fs.existsSync(pngDir)) {
    const pngFiles = fs.readdirSync(pngDir).filter(f => f.endsWith('.png'));
    pngFiles.forEach(file => {
      const pngPath = path.join(pngDir, file);
      checkFile(pngPath);
      checkImageFormat(pngPath);
    });
  } else {
    console.log(`❌ Missing: PNG icons directory`);
  }
  
  console.log('\nVerification complete!');
}

/**
 * List contents of a directory recursively up to a certain depth
 * @param {string} dirPath - Directory to list
 * @param {number} maxDepth - Maximum recursion depth
 * @param {number} currentDepth - Current recursion depth
 */
function listDirectoryContents(dirPath, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return;
  
  try {
    const indentation = '  '.repeat(currentDepth);
    const dirName = path.basename(dirPath);
    console.log(`${indentation}/${dirName}`);
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const entryPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        listDirectoryContents(entryPath, maxDepth, currentDepth + 1);
      } else {
        console.log(`${indentation}  ${entry.name}`);
      }
    });
  } catch (error) {
    console.error(`Error listing directory ${dirPath}:`, error.message);
  }
}

// Run verification
verifyIcons();