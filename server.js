const isDev = process.env.NODE_ENV === 'development';

// Create a logger that only logs in development mode
const logger = {
    log: (...args) => isDev && console.log(...args),
    info: (...args) => console.info(...args),
    error: (...args) => console.error(...args),
    warn: (...args) => console.warn(...args)
};

logger.info('Starting server initialization...');

const express = require('express');
const fileUpload = require('express-fileupload');
const { exec, execSync } = require('child_process');
const temp = require('temp');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');

// Configure temp to use specific base dir for better control in production
const appTempDir = path.join(os.tmpdir(), 'markdowner-app');
try {
    if (!fs.existsSync(appTempDir)) {
        fs.mkdirSync(appTempDir, { recursive: true });
    }
    temp.track({ dir: appTempDir });
    console.log(`Using temp directory: ${appTempDir}`);
} catch (err) {
    console.error('Failed to create temp directory, falling back to default:', err);
    temp.track();
}

// Helper to find pandoc across different platforms
async function findPandoc() {
    // Common locations for pandoc
    const commonPaths = [
        '/usr/local/bin/pandoc',
        '/usr/bin/pandoc',
        '/opt/homebrew/bin/pandoc',  // Common on newer macOS with Homebrew
        '/opt/local/bin/pandoc',     // MacPorts
        path.join(os.homedir(), '.local/bin/pandoc')  // User-installed
    ];
    
    // First try the PATH
    try {
        const pathOutput = execSync('which pandoc', { encoding: 'utf8' }).trim();
        if (pathOutput && fs.existsSync(pathOutput)) {
            console.log(`Found pandoc in PATH at: ${pathOutput}`);
            return pathOutput;
        }
    } catch (error) {
        console.log('Could not find pandoc in PATH, trying common locations');
    }
    
    // Then check common locations
    for (const pandocPath of commonPaths) {
        try {
            if (fs.existsSync(pandocPath)) {
                console.log(`Found pandoc at common location: ${pandocPath}`);
                
                // Verify that it works
                execSync(`"${pandocPath}" --version`, { encoding: 'utf8' });
                return pandocPath;
            }
        } catch (error) {
            console.log(`Pandoc at ${pandocPath} not found or not working`);
        }
    }
    
    throw new Error('Pandoc not found. Please install pandoc (https://pandoc.org/installing.html)');
}

let pandocPath = null;

function startServer() {
    return new Promise(async (resolve, reject) => {
        try {
            // Add server health check
            let serverStarted = false;
            const healthCheckTimeout = setTimeout(() => {
                if (!serverStarted) {
                    reject(new Error('Server failed to start within timeout period'));
                }
            }, 10000);

            // Find pandoc early on
            pandocPath = await findPandoc();
            console.log(`Using pandoc at: ${pandocPath}`);
            
            const app = express();
            
            // Configure middleware
            app.use(express.json({ limit: '50mb' }));
            app.use(express.urlencoded({ extended: true }));
            app.use(fileUpload({
                createParentPath: true,
                limits: { fileSize: 50 * 1024 * 1024 },
                debug: isDev, // Only enable debug in development mode
            }));

            // Serve static files from public and node_modules
            app.use(express.static(path.join(__dirname, 'public')));
            app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

            // Status API with pandoc details
            app.get('/api/status', (req, res) => {
                res.json({ 
                    status: 'ok',
                    tempDir: appTempDir,
                    writeable: fs.accessSync(appTempDir, fs.constants.W_OK) === undefined,
                    pandoc: pandocPath || 'Not found'
                });
            });

            // Convert route - fix to properly handle both file uploads and markdown content
            app.post('/convert', async (req, res) => {
                console.log('Received conversion request');
                let inputFile, outputFile;
                
                try {
                    if (!pandocPath) {
                        throw new Error('Pandoc not found. Please install pandoc (https://pandoc.org/installing.html)');
                    }

                    // Check if we have a file upload - check both req.files and req.files.file
                    let fileUploaded = false;
                    if (req.files) {
                        // Handle multiple potential file structures
                        let uploadedFile;
                        
                        // Check if file is directly in req.files
                        if (req.files.file) {
                            uploadedFile = req.files.file;
                            console.log('Found file in req.files.file');
                        } 
                        // Check for first file in req.files object
                        else {
                            const fileKeys = Object.keys(req.files);
                            if (fileKeys.length > 0) {
                                uploadedFile = req.files[fileKeys[0]];
                                console.log('Found file in req.files[' + fileKeys[0] + ']');
                            }
                        }
                        
                        if (uploadedFile) {
                            console.log('Processing uploaded file:', uploadedFile.name, 'size:', uploadedFile.size);
                            inputFile = path.join(appTempDir, `input-${Date.now()}.md`);
                            await uploadedFile.mv(inputFile);
                            console.log('Saved uploaded file to:', inputFile);
                            fileUploaded = true;
                        }
                    }
                    
                    // If no file was uploaded, check for markdown content in request body
                    if (!fileUploaded && req.body && req.body.markdown) {
                        console.log('Processing pasted content, length:', req.body.markdown.length);
                        inputFile = path.join(appTempDir, `input-${Date.now()}.md`);
                        await fsp.writeFile(inputFile, req.body.markdown);
                        console.log('Created markdown file at:', inputFile);
                    } 
                    // If no file was uploaded and no markdown content, return error
                    else if (!fileUploaded) {
                        console.error('No input provided in request. Body keys:', Object.keys(req.body));
                        if (req.files) console.log('Files keys:', Object.keys(req.files));
                        return res.status(400).json({ error: 'No input provided' });
                    }

                    // Verify input file
                    try {
                        const stats = await fsp.stat(inputFile);
                        console.log('Input file stats:', {
                            exists: true,
                            size: stats.size,
                            isFile: stats.isFile()
                        });
                        
                        if (!stats.isFile() || stats.size === 0) {
                            throw new Error('Invalid or empty input file');
                        }
                        
                        // Log file content for debugging
                        const content = await fsp.readFile(inputFile, 'utf8');
                        console.log('Input file content sample:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
                    } catch (err) {
                        console.error('Input file verification failed:', err);
                        throw new Error(`Input file verification failed: ${err.message}`);
                    }

                    // Create output file
                    outputFile = path.join(appTempDir, `output-${Date.now()}.docx`);
                    console.log('Will convert from', inputFile, 'to:', outputFile);

                    // Run pandoc conversion
                    await new Promise((resolve, reject) => {
                        // Use the path we found earlier
                        const cmd = `"${pandocPath}" "${inputFile}" -f markdown -t docx -o "${outputFile}"`;
                        console.log('Executing command:', cmd);
                        
                        exec(cmd, (error, stdout, stderr) => {
                            if (error) {
                                console.error('Pandoc error:', error);
                                console.error('Stderr:', stderr);
                                reject(new Error(stderr || error.message));
                                return;
                            }
                            console.log('Pandoc conversion completed');
                            resolve();
                        });
                    });

                    // Verify output file
                    try {
                        const outStats = await fsp.stat(outputFile);
                        console.log('Output file stats:', {
                            exists: true,
                            size: outStats.size,
                            isFile: outStats.isFile()
                        });
                        
                        if (!outStats.isFile() || outStats.size === 0) {
                            throw new Error('Output file not created or empty');
                        }
                    } catch (err) {
                        console.error('Output file verification failed:', err);
                        throw new Error(`Output file verification failed: ${err.message}`);
                    }

                    // Send the file
                    console.log('Sending converted file to client');
                    res.download(outputFile, 'converted.docx', (err) => {
                        if (err) {
                            console.error('Error sending file:', err);
                        } else {
                            console.log('File sent successfully');
                        }
                        
                        // Clean up temp files
                        setTimeout(() => {
                            try {
                                if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
                                if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
                            } catch (e) {
                                console.error('Error cleaning up temp files:', e);
                            }
                        }, 1000);
                    });
                } catch (error) {
                    console.error('Conversion error:', error);
                    
                    // Clean up any created files
                    if (inputFile && fs.existsSync(inputFile)) {
                        try { fs.unlinkSync(inputFile); } catch (e) {}
                    }
                    if (outputFile && fs.existsSync(outputFile)) {
                        try { fs.unlinkSync(outputFile); } catch (e) {}
                    }
                    
                    res.status(500).json({ 
                        error: 'Conversion failed', 
                        details: error.message 
                    });
                }
            });

            
            const port = 3000;
            const server = app.listen(port, () => {
                console.log(`Server running at http://localhost:${port}`);
                serverStarted = true;
                clearTimeout(healthCheckTimeout);
                
                // Test server health
                fetch(`http://localhost:${port}/api/status`)
                    .then(response => response.json())
                    .then(data => {
                        console.log('Server health check passed:', data);
                        resolve(port);
                    })
                    .catch(error => {
                        console.error('Server health check failed:', error);
                        reject(error);
                    });
            });

            server.on('error', (error) => {
                console.error('Server error:', error);
                reject(error);
            });
            
        } catch (error) {
            console.error('Server initialization error:', error);
            reject(error);
        }
    });
}

module.exports = { startServer };
