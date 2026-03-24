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
    createFile: (filePath) => ipcRenderer.invoke('create-file', filePath),
    createFolder: (folderPath) => ipcRenderer.invoke('create-folder', folderPath),
    // this is a test to check 
    // Project generation
    saveProjectDialog: () => ipcRenderer.invoke('save-project-dialog'),
    saveGeneratedProject: (basePath, files) => ipcRenderer.invoke('save-generated-project', basePath, files),
    
    // Terminal and commands
    startTerminalProcess: (command, args, cwd) => ipcRenderer.send('start-terminal-process', command, args, cwd),
    killTerminalProcess: () => ipcRenderer.send('kill-terminal-process'),
    onTerminalOutput: (callback) => {
        ipcRenderer.on('terminal-output', (event, data) => callback(data));
        return () => ipcRenderer.removeAllListeners('terminal-output');
    },
    runCommand: (command, cwd) => ipcRenderer.invoke('run-command', command, cwd),
});
