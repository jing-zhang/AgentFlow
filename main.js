const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const serviceManager = require('./service-manager');

// Disable GPU and hardware acceleration for stability on Linux
app.disableHardwareAcceleration();

// Window preferences management
function getPreferencesPath() {
    return path.join(app.getPath('userData'), 'window-preferences.json');
}

function loadWindowPreferences() {
    try {
        const prefsPath = getPreferencesPath();
        if (fs.existsSync(prefsPath)) {
            const data = fs.readFileSync(prefsPath, 'utf8');
            const prefs = JSON.parse(data);
            
            // Validate preferences
            if (prefs && 
                typeof prefs.width === 'number' && 
                typeof prefs.height === 'number' &&
                prefs.width >= 370 && prefs.width <= 740 &&
                prefs.height >= 400 && prefs.height <= 800) {
                return prefs;
            }
        }
    } catch (error) {
        console.error('Failed to load window preferences:', error);
    }
    
    // Return defaults if loading fails
    return { width: 370, height: 565 };
}

function saveWindowPreferences(width, height) {
    try {
        const prefsPath = getPreferencesPath();
        const prefs = { width, height, lastSaved: new Date().toISOString() };
        fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));
        return true;
    } catch (error) {
        console.error('Failed to save window preferences:', error);
        return false;
    }
}

function getScreenConstrainedSize(width, height) {
    // Get primary display bounds
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // Ensure window fits within screen with some margin
    const margin = 50;
    const maxWidth = screenWidth - margin;
    const maxHeight = screenHeight - margin;
    
    // Constrain to both screen limits and application limits
    const constrainedWidth = Math.max(370, Math.min(width, 740, maxWidth));
    const constrainedHeight = Math.max(400, Math.min(height, 800, maxHeight));
    
    return { width: constrainedWidth, height: constrainedHeight };
}

function createWindow() {
    // Load saved preferences
    const savedPrefs = loadWindowPreferences();
    
    // Apply screen boundary constraints
    const constrainedSize = getScreenConstrainedSize(savedPrefs.width, savedPrefs.height);
    
    const win = new BrowserWindow({
        width: constrainedSize.width,
        height: constrainedSize.height,
        frame: false, // Custom frame for that premium look
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true, // Enable sandbox for security (default)
            preload: path.join(__dirname, 'preload.js')
        },
        minWidth: 370,
        minHeight: 400,
        maxWidth: 740,
        maxHeight: 800
    });

    win.loadFile('index.html');
    
    // Store reference to window for resize operations
    global.mainWindow = win;
    
    // Save window size when resized (with debouncing)
    let saveTimeout;
    win.on('resize', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            const [width, height] = win.getSize();
            saveWindowPreferences(width, height);
        }, 500); // Debounce to avoid excessive writes
    });
    
    // Save window size when moved (position might be useful too)
    win.on('move', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            const [width, height] = win.getSize();
            saveWindowPreferences(width, height);
        }, 500);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('get-status', async (event, serviceName) => {
    return await serviceManager.getStatus(serviceName);
});

ipcMain.handle('control-service', async (event, { serviceName, action }) => {
    try {
        await serviceManager.controlService(serviceName, action);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-logs', async (event, { serviceName, lines }) => {
    try {
        const logs = await serviceManager.getLogs(serviceName, lines);
        return { success: true, logs };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-service-mapping', async (event, newMapping) => {
    try {
        serviceManager.updateServiceMapping(newMapping);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-service-mapping', async (event) => {
    try {
        const mapping = serviceManager.getServiceMapping();
        return { success: true, mapping };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Window controls
ipcMain.on('window-control', (event, action) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;
    if (action === 'close') win.close();
    if (action === 'minimize') win.minimize();
    if (action === 'maximize') {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    }
});

// Window resize handler
ipcMain.handle('resize-window', async (event, { width, height }) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false, error: 'No focused window' };
    
    try {
        // Apply screen boundary constraints
        const constrainedSize = getScreenConstrainedSize(width, height);
        
        win.setSize(constrainedSize.width, constrainedSize.height);
        
        // Save preferences
        saveWindowPreferences(constrainedSize.width, constrainedSize.height);
        
        return { success: true, width: constrainedSize.width, height: constrainedSize.height };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get current window size preferences
ipcMain.handle('get-window-preferences', async () => {
    return loadWindowPreferences();
});

ipcMain.handle('get-cpu', async (event, serviceName) => {
    try {
        const cpu = await serviceManager.getServiceCPU(serviceName);
        return { success: true, cpu };
    } catch (error) {
        return { success: false, cpu: 0 };
    }
});
