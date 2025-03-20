const { app, BrowserWindow } = require('electron');
const path = require('path');
const server = require('./server');

/**
 * Create the main application window
 */
function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            // Use secure contextIsolation with preload script
            contextIsolation: true, 
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true, // Enable web security in production
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
}

// Note: Removed clipboard:copy IPC handler

// App lifecycle event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});