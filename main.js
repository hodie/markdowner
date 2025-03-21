const { app, BrowserWindow } = require('electron');
const path = require('path');
const server = require('./server');
const { getAppIconPath, testIconAvailability } = require('./utils/app-icons');
const { setupIcons } = require('./utils/icon-setup');

/**
 * Initialize the application and ensure resources are available
 */
async function initializeApp() {
  console.log('Initializing Markdowner application...');
  
  // Set application information
  app.setName('Markdowner');
  app.setAboutPanelOptions({
    applicationName: 'Markdowner',
    applicationVersion: app.getVersion(),
    copyright: '© 2023 hodie Meyers'
  });
  
  // Test if icons are available
  const hasIcons = testIconAvailability();
  
  // If icons aren't found, try to copy them from alternative locations
  if (!hasIcons) {
    console.log('Icons not found. Attempting to set up icons from alternative locations...');
    await setupIcons();
  }
}

/**
 * Create the main application window
 */
function createWindow() {
  console.log('Creating main window...');
  
  // Get the application icon path
  const iconPath = getAppIconPath();
  
  // Window options
  const windowOptions = {
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    backgroundColor: '#FFFFFF',
    show: false, // Don't show until ready-to-show
    title: 'Markdowner',
  };
  
  // Only add icon if one was found
  if (iconPath) {
    console.log('Setting window icon to:', iconPath);
    windowOptions.icon = iconPath;
  }
  
  // Create the window
  const win = new BrowserWindow(windowOptions);
  
  // Show window when ready
  win.once('ready-to-show', () => {
    win.show();
    
    // On Linux, setting the window icon might need to be done after showing the window
    if (process.platform === 'linux' && iconPath) {
      win.setIcon(iconPath);
    }
  });

  // Add retry logic for server connection
  let retries = 0;
  const maxRetries = 5;
  
  async function connectToServer() {
    try {
      const port = await server.startServer();
      console.log('Server started successfully on port:', port);
      win.loadURL(`http://localhost:${port}`);
      
      // Enable DevTools only in development
      if (process.env.NODE_ENV === 'development') {
        win.webContents.openDevTools({ mode: 'detach' });
      }
    } catch (error) {
      console.error('Failed to connect to server:', error);
      if (retries < maxRetries) {
        retries++;
        console.log(`Retrying connection (${retries}/${maxRetries})...`);
        setTimeout(connectToServer, 1000);
      } else {
        console.error('Failed to start server after', maxRetries, 'attempts');
        app.quit();
      }
    }
  }

  connectToServer();
  
  // Quit the app when the window is closed (macOS specific behavior change)
  win.on('closed', () => {
    app.quit();
  });
  
  return win;
}

// App lifecycle event handlers
app.whenReady()
  .then(initializeApp)
  .then(createWindow)
  .catch(error => {
    console.error('Error during application startup:', error);
  });

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});