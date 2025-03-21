/**
 * Resource Validator Module
 * Checks if required resources are available and logs appropriate messages
 */
const fs = require('fs');
const path = require('path');

/**
 * Check if the resources directory has the expected structure
 * @returns {Object} Object with validation results
 */
function validateResources() {
  const resourcesPath = path.join(__dirname, '..', 'resources');
  
  // Check if resources directory exists
  if (!fs.existsSync(resourcesPath)) {
    console.warn('Resources directory not found at:', resourcesPath);
    return { 
      valid: false, 
      error: 'Resources directory not found' 
    };
  }
  
  // Expected icon paths
  const expectedPaths = {
    mac: path.join(resourcesPath, 'icons', 'mac', 'icon.icns'),
    win: path.join(resourcesPath, 'icons', 'win', 'icon.ico'),
    png: path.join(resourcesPath, 'icons', 'png', 'icon.png')
  };
  
  // Check which icon types exist
  const foundIcons = {
    mac: fs.existsSync(expectedPaths.mac),
    win: fs.existsSync(expectedPaths.win),
    png: fs.existsSync(expectedPaths.png)
  };
  
  // Log results
  console.log('Resource validation results:');
  Object.entries(foundIcons).forEach(([type, exists]) => {
    console.log(`- ${type} icon: ${exists ? 'Found' : 'Not found'} (${expectedPaths[type]})`);
  });
  
  // Validation is successful if at least one icon type exists
  const valid = Object.values(foundIcons).some(exists => exists);
  
  return {
    valid,
    foundIcons,
    error: valid ? null : 'No application icons found'
  };
}

module.exports = {
  validateResources
};