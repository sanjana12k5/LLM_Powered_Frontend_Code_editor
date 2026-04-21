import { app, BrowserWindow } from 'electron';
import path from 'path';

const isDev = !app.isPackaged;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile('dist/index.html');
    }
}

app.whenReady().then(createWindow);