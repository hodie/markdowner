/**
 * Preload script for the Electron app
 * Securely exposes Node.js/Electron APIs to the renderer process
 */
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
// Note: Removed clipboard-related API methods
contextBridge.exposeInMainWorld(
  'electronAPI', 
  {
    // Include only necessary APIs here
    // No clipboard functions needed
  }
);

// Add console log to confirm preload script execution
console.log('Preload script loaded successfully');