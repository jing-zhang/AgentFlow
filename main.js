const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const serviceManager = require('./service-manager');

function createWindow() {
    const win = new BrowserWindow({
        width: 740,
        height: 560,
        frame: false, // Custom frame for that premium look
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // Disable sandbox for AppImage compatibility
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
