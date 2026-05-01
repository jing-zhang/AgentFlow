const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const serviceManager = require('./service-manager');

function createWindow() {
    const win = new BrowserWindow({
        width: 740,
        height: 565,
        frame: false, // Custom frame for that premium look
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true, // Enable sandbox for security (default)
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html');
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
