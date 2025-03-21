/**
 * App Icons Module
 * Handles loading and verifying application icons for all platforms
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Get the absolute path to resources directory
 * @returns {string} - Absolute path to resources
 */
function getResourcesPath() {
  // In development, resources are in project root
  let resourcesPath = path.join(__dirname, '..', 'resources');
  
  // In production, resources might be in different locations depending on platform
  if (app.isPackaged) {
    if (process.platform === 'darwin') {
      // macOS: Resources are in Content/Resources within the app bundle
      resourcesPath = path.join(process.resourcesPath);
    } else {
      // Windows/Linux: Resources are in resources directory next to the executable
      resourcesPath = path.join(process.resourcesPath);
    }
  }
  
  return resourcesPath;
}

/**
 * Log details about an icon file
 * @param {string} iconPath - Path to check
 * @param {string} iconType - Type of icon being checked
 */
function logIconDetails(iconPath, iconType) {
  try {
    const exists = fs.existsSync(iconPath);
    if (exists) {
      const stats = fs.statSync(iconPath);
      console.log(`✅ ${iconType} icon found: ${iconPath} (${stats.size} bytes)`);
    } else {
      console.warn(`⚠️ ${iconType} icon not found at: ${iconPath}`);
    }
  } catch (error) {
    console.error(`❌ Error checking ${iconType} icon:`, error.message);
  }
}

/**
 * Determine the appropriate icon path based on platform
 * @returns {string|null} - Path to icon or null if none found
 */
function getAppIconPath() {
  const resourcesPath = getResourcesPath();
  console.log('Resources path resolved to:', resourcesPath);
  
  // Define paths for different icon types
  const iconPaths = {
    darwin: path.join(resourcesPath, 'icons', 'mac', 'icon.icns'),
    win32: path.join(resourcesPath, 'icons', 'win', 'icon.ico'),
    linux: path.join(resourcesPath, 'icons', 'png', '512x512.png'),
    fallback: path.join(resourcesPath, 'icons', 'png', 'icon.png')
  };
  
  // Log all icon paths for debugging
  Object.entries(iconPaths).forEach(([platform, iconPath]) => {
    logIconDetails(iconPath, platform);
  });
  
  // Select appropriate icon based on platform
  let selectedIcon = null;
  
  // First try platform-specific icon
  const platformIcon = iconPaths[process.platform];
  if (platformIcon && fs.existsSync(platformIcon)) {
    selectedIcon = platformIcon;
  } 
  // Then try fallback
  else if (fs.existsSync(iconPaths.fallback)) {
    console.log('Using fallback icon');
    selectedIcon = iconPaths.fallback;
  }
  
  // If no icon found, check for any PNG in the icons folder
  if (!selectedIcon) {
    const pngDir = path.join(resourcesPath, 'icons', 'png');
    try {
      if (fs.existsSync(pngDir) && fs.statSync(pngDir).isDirectory()) {
        const pngFiles = fs.readdirSync(pngDir).filter(f => f.endsWith('.png'));
        if (pngFiles.length > 0) {
          selectedIcon = path.join(pngDir, pngFiles[0]);
          console.log('Found alternative PNG icon:', selectedIcon);
        }
      }
    } catch (error) {
      console.error('Error finding alternative PNG icon:', error.message);
    }
  }
  
  // Result
  if (selectedIcon) {
    console.log('✅ Selected app icon:', selectedIcon);
  } else {
    console.warn('❌ No suitable icon found');
  }
  
  return selectedIcon;
}

/**
 * Test if icons can be properly loaded
 * @returns {boolean} - True if at least one icon is accessible
 */
function testIconAvailability() {
  const resourcesPath = getResourcesPath();
  const iconsDir = path.join(resourcesPath, 'icons');
  
  try {
    console.log('Testing icon availability...');
    console.log('Icons directory:', iconsDir);
    
    // Check if icons directory exists
    if (!fs.existsSync(iconsDir)) {
      console.warn('Icons directory not found');
      return false;
    }
    
    // List available icons
    let iconFound = false;
    const iconTypes = ['mac', 'win', 'png'];
    
    iconTypes.forEach(type => {
      const typeDir = path.join(iconsDir, type);
      if (fs.existsSync(typeDir)) {
        try {
          const files = fs.readdirSync(typeDir);
          console.log(`Found ${files.length} files in ${type} icon directory:`, files);
          if (files.length > 0) iconFound = true;
        } catch (err) {
          console.error(`Error reading ${type} icon directory:`, err.message);
        }
      } else {
        console.log(`${type} icon directory not found`);
      }
    });
    
    return iconFound;
  } catch (error) {
    console.error('Error testing icon availability:', error);
    return false;
  }
}

module.exports = {
  getAppIconPath,
  testIconAvailability
};