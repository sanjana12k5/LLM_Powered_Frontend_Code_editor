const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),

    // File system
    openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
    readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),

    // Project generation
    saveProjectDialog: () => ipcRenderer.invoke('save-project-dialog'),
    saveGeneratedProject: (basePath, files) => ipcRenderer.invoke('save-generated-project', basePath, files),
});
