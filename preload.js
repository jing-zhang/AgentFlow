const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getStatus: (serviceName) => ipcRenderer.invoke('get-status', serviceName),
    controlService: (serviceName, action) => ipcRenderer.invoke('control-service', { serviceName, action }),
    windowControl: (action) => ipcRenderer.send('window-control', action)
});
