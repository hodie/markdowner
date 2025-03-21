/**
 * Icon Setup Utility
 * Ensures icons are available at runtime by copying from different locations if needed
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Copy a file from source to destination, ensuring destination directory exists
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @returns {boolean} - Whether the copy was successful
 */
function copyFile(source, destination) {
  try {
    // Create the destination directory if it doesn't exist
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(source, destination);
    console.log(`✅ Copied ${source} to ${destination}`);
    return true;
  } catch (error) {
    console.error(`❌ Error copying ${source} to ${destination}:`, error);
    return false;
  }
}

/**
 * Find icons in alternative locations and copy them to the resources directory
 * @returns {Object} - Object containing information about the setup process
 */
function setupIcons() {
  console.log('Setting up application icons...');
  
  const appPath = app.getAppPath();
  const result = {
    success: false,
    iconsFound: [],
    errors: []
  };
  
  // Potential source locations for icons
  const potentialLocations = [
    // Standard resources location
    path.join(appPath, 'resources', 'icons'),
    
    // Root resources folder
    path.join(appPath, 'icons'),
    
    // Parent directory (for development)
    path.join(appPath, '..', 'resources', 'icons'),
    
    // Application resources (for production)
    path.join(process.resourcesPath, 'icons')
  ];
  
  // Target location for icons
  const targetIconsDir = path.join(app.getPath('userData'), 'resources', 'icons');
  
  // Icon types to look for
  const iconTypes = {
    mac: ['icon.icns', 'app.icns', 'markdowner.icns'],
    win: ['icon.ico', 'app.ico', 'markdowner.ico'],
    png: ['icon.png', 'app.png', 'markdowner.png', '512x512.png']
  };
  
  // Check each potential location
  potentialLocations.forEach(location => {
    if (!fs.existsSync(location)) return;
    
    console.log(`Checking for icons in: ${location}`);
    
    // Check for each icon type
    Object.entries(iconTypes).forEach(([type, fileNames]) => {
      const typeDir = path.join(location, type);
      
      // If type directory exists (e.g., mac, win, png)
      if (fs.existsSync(typeDir)) {
        fileNames.forEach(fileName => {
          const sourcePath = path.join(typeDir, fileName);
          
          if (fs.existsSync(sourcePath)) {
            // Create target directory and copy the file
            const targetDir = path.join(targetIconsDir, type);
            const targetPath = path.join(targetDir, fileName);
            
            if (copyFile(sourcePath, targetPath)) {
              result.iconsFound.push({ type, name: fileName, path: targetPath });
              result.success = true;
            }
          }
        });
      }
      
      // Some projects put PNG files directly in the icons folder
      if (type === 'png') {
        fileNames.forEach(fileName => {
          const sourcePath = path.join(location, fileName);
          
          if (fs.existsSync(sourcePath)) {
            const targetDir = path.join(targetIconsDir, 'png');
            const targetPath = path.join(targetDir, fileName);
            
            if (copyFile(sourcePath, targetPath)) {
              result.iconsFound.push({ type, name: fileName, path: targetPath });
              result.success = true;
            }
          }
        });
      }
    });
  });
  
  console.log('Icon setup results:', result);
  return result;
}

module.exports = {
  setupIcons
};