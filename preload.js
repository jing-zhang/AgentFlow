const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getStatus: (serviceName) => ipcRenderer.invoke('get-status', serviceName),
    controlService: (serviceName, action) => ipcRenderer.invoke('control-service', { serviceName, action }),
    getLogs: (serviceName, lines) => ipcRenderer.invoke('get-logs', { serviceName, lines }),
    windowControl: (action) => ipcRenderer.send('window-control', action)
});
