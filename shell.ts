const { resolve } = require('path')
const { app, BrowserWindow, ipcMain } = require("electron")
// import { app, BrowserWindow, ipcMain } from "electron";

let winRef// : BrowserWindow

const createWindow = () => {
    winRef = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        webPreferences: {
            preload: resolve('./src/scripts/preload.js'),
            webSecurity: true,
            devTools: true
        }
    })

    winRef.loadURL('http://localhost:8899')
    // winRef.loadFile('index.html')
    winRef.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if(BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    ipcMain.on('operate', (e, args) => {
        console.log('operate: ', args)
    })
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    winRef = null
    if(process.platform !== 'darwin') app.quit()
})