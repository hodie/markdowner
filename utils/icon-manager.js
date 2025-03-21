/**
 * Icon Manager Module
 * Handles loading and managing application icons from the resources folder
 */
const fs = require('fs');
const path = require('path');

/**
 * Get the appropriate app icon path based on platform
 * @returns {string|null} Path to the appropriate icon file or null if not found
 */
function getAppIcon() {
  // Base resources path
  const resourcesPath = path.join(__dirname, '..', 'resources');
  
  // Choose icon based on platform
  let iconPath;
  
  switch (process.platform) {
    case 'darwin': // macOS
      iconPath = path.join(resourcesPath, 'icons', 'mac', 'icon.icns');
      break;
    case 'win32': // Windows
      iconPath = path.join(resourcesPath, 'icons', 'win', 'icon.ico');
      break;
    case 'linux': // Linux
      // On Linux, electron prefers PNG icons at different resolutions
      iconPath = path.join(resourcesPath, 'icons', 'png', '512x512.png');
      break;
    default:
      // Fallback to PNG
      iconPath = path.join(resourcesPath, 'icons', 'png', 'icon.png');
  }
  
  // Check if the icon file exists
  if (fs.existsSync(iconPath)) {
    console.log(`Using app icon: ${iconPath}`);
    return iconPath;
  }
  
  // If the platform-specific icon doesn't exist, try using a generic PNG
  const fallbackIcon = path.join(resourcesPath, 'icons', 'png', 'icon.png');
  if (fs.existsSync(fallbackIcon)) {
    console.log(`Platform icon not found, using fallback icon: ${fallbackIcon}`);
    return fallbackIcon;
  }
  
  // No icon found
  console.warn('No application icon found in resources folder');
  return null;
}

/**
 * Check if icons are available in the resources folder
 * @returns {boolean} Whether icons are available
 */
function hasAppIcons() {
  const resourcesPath = path.join(__dirname, '..', 'resources');
  const icnsPath = path.join(resourcesPath, 'icons', 'mac', 'icon.icns');
  const icoPath = path.join(resourcesPath, 'icons', 'win', 'icon.ico');
  const pngPath = path.join(resourcesPath, 'icons', 'png', 'icon.png');
  
  // Check if at least one icon format exists
  return fs.existsSync(icnsPath) || fs.existsSync(icoPath) || fs.existsSync(pngPath);
}

module.exports = {
  getAppIcon,
  hasAppIcons
};